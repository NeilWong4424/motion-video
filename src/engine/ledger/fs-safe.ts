/**
 * Anchored filesystem safety for the Workflow Ledger and its action-result
 * sidecars — the portable subset of the contract's requirements.
 *
 * ── Platform-fidelity deviation (decision B1) ────────────────────────────────
 * The contract mandates POSIX `openat`/`mkdirat` with directory-only + `O_NOFOLLOW`
 * semantics, `fstat` proving link-count-one and retained device/inode identity, and
 * per-directory `fsync`. Node.js exposes none of `openat`/`mkdirat`/`O_NOFOLLOW`
 * cross-platform, and Windows (win32) has no stable inode / hard-link-count model.
 *
 * This module implements the strongest portable approximation Node guarantees:
 *   - ancestor walk that refuses any existing symlink component (`lstat`);
 *   - exclusive creation via the `wx`/`ax` open flags (`O_CREAT|O_EXCL`), so first
 *     initialization cannot follow or clobber a pre-existing file;
 *   - `fstat` on the opened descriptor proving a regular file (and link-count-one
 *     where the OS reports it — best-effort on win32);
 *   - reads/appends performed against the retained descriptor, never re-resolving
 *     the pathname between check and write;
 *   - `fsync` of the file and (where supported) the parent directory;
 *   - `ftruncate` rollback to an exact prior size on a short append.
 *
 * On win32 the device/inode retention and directory-fsync guarantees are weaker
 * than POSIX; this is a documented, intentional reduction, not a silent claim of
 * full POSIX safety. Strict fidelity requires running under WSL/Linux.
 */

import {
  closeSync,
  fstatSync,
  fsyncSync,
  ftruncateSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeSync,
  type Stats,
} from 'node:fs';
import {dirname, join, relative, resolve, sep} from 'node:path';

/** A verified repository-root anchor. Paths are only composed under this root. */
export type RepoRootAnchor = {repoRoot: string};

export function anchorRepoRoot(repoRoot: string): RepoRootAnchor {
  const canonical = resolve(repoRoot);
  const st = lstatSync(canonical);
  if (st.isSymbolicLink()) {
    throw new Error('LEDGER_FS_REPO_ROOT_SYMLINK');
  }
  if (!st.isDirectory()) {
    throw new Error('LEDGER_FS_REPO_ROOT_NOT_DIRECTORY');
  }
  return {repoRoot: canonical};
}

/**
 * Resolve a repository-relative path under the anchor, refusing traversal that
 * would escape the root. Returns the absolute path; does not touch the filesystem.
 */
export function resolveUnderRoot(anchor: RepoRootAnchor, relativePath: string): string {
  const abs = resolve(anchor.repoRoot, relativePath);
  const rel = relative(anchor.repoRoot, abs);
  if (rel === '' || rel.startsWith('..') || (rel.length >= 2 && rel[1] === ':')) {
    throw new Error(`LEDGER_FS_PATH_ESCAPE: ${relativePath}`);
  }
  const prefix = `${anchor.repoRoot}${sep}`;
  if (!abs.startsWith(prefix)) {
    throw new Error(`LEDGER_FS_PATH_ESCAPE: ${relativePath}`);
  }
  return abs;
}

/**
 * Walk each existing ancestor of `absPath` (from the anchor down), refusing any
 * symlink component, and create exactly the missing directory ancestors. The
 * final path component is NOT created here (it is the file to be opened).
 */
export function ensureAncestorsNoFollow(anchor: RepoRootAnchor, absPath: string): void {
  const targetDir = dirname(absPath);
  const rel = relative(anchor.repoRoot, targetDir);
  const parts = rel === '' ? [] : rel.split(sep);
  let current = anchor.repoRoot;
  for (const part of parts) {
    current = join(current, part);
    let st: Stats | null = null;
    try {
      st = lstatSync(current);
    } catch {
      st = null;
    }
    if (st === null) {
      // Create exactly this missing ancestor (non-recursive so a race that
      // created a symlink here would surface on the next lstat).
      mkdirSync(current);
      const after = lstatSync(current);
      if (after.isSymbolicLink() || !after.isDirectory()) {
        throw new Error(`LEDGER_FS_ANCESTOR_UNSAFE: ${current}`);
      }
    } else if (st.isSymbolicLink()) {
      throw new Error(`LEDGER_FS_ANCESTOR_SYMLINK: ${current}`);
    } else if (!st.isDirectory()) {
      throw new Error(`LEDGER_FS_ANCESTOR_NOT_DIRECTORY: ${current}`);
    }
  }
}

function fsyncDir(dirPath: string): void {
  // Directory fsync is not supported on all platforms/filesystems (notably win32).
  // Best-effort: open read-only and fsync; swallow EISDIR/EPERM/EINVAL differences.
  let fd: number | null = null;
  try {
    fd = openSync(dirPath, 'r');
    fsyncSync(fd);
  } catch {
    // Documented win32 reduction: parent-directory durability is best-effort.
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

function assertRegularFileFd(fd: number, label: string): Stats {
  const st = fstatSync(fd);
  if (!st.isFile()) {
    throw new Error(`LEDGER_FS_NOT_REGULAR_FILE: ${label}`);
  }
  // Best-effort hard-link guard: on POSIX a fresh exclusive file has nlink 1.
  // On win32 nlink is reported as 1 for normal files; a value > 1 is suspicious.
  if (typeof st.nlink === 'number' && st.nlink > 1) {
    throw new Error(`LEDGER_FS_MULTIPLE_HARDLINKS: ${label}`);
  }
  return st;
}

/**
 * Exclusively create a new file under the anchor, write its complete bytes, fstat-
 * verify it is a fresh regular file, then fsync file + parent dir. Refuses if the
 * file already exists (`wx` → EEXIST). Used for first ledger init and each sidecar.
 */
export function createExclusiveFile(anchor: RepoRootAnchor, relativePath: string, bytes: string): void {
  const abs = resolveUnderRoot(anchor, relativePath);
  ensureAncestorsNoFollow(anchor, abs);
  const fd = openSync(abs, 'wx', 0o600);
  try {
    assertRegularFileFd(fd, relativePath);
    const buf = Buffer.from(bytes, 'utf8');
    let written = 0;
    while (written < buf.length) {
      written += writeSync(fd, buf, written, buf.length - written);
    }
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  fsyncDir(dirname(abs));
}

/** An opened ledger handle with its verified absolute path and current size. */
export type LedgerHandle = {
  fd: number;
  absPath: string;
  relativePath: string;
  size: number;
};

/**
 * Open an existing ledger for read + append against a retained descriptor. The
 * pathname is resolved once, symlink-guarded, then opened; all subsequent reads and
 * the compare-and-append use this same fd without re-resolving the path.
 */
export function openLedgerForAppend(anchor: RepoRootAnchor, relativePath: string): LedgerHandle {
  const abs = resolveUnderRoot(anchor, relativePath);
  // Guard: the path itself must not be a symlink.
  const lst = lstatSync(abs);
  if (lst.isSymbolicLink()) {
    throw new Error(`LEDGER_FS_PATH_SYMLINK: ${relativePath}`);
  }
  const fd = openSync(abs, 'r+');
  try {
    const st = assertRegularFileFd(fd, relativePath);
    return {fd, absPath: abs, relativePath, size: st.size};
  } catch (err) {
    closeSync(fd);
    throw err;
  }
}

/** Read the full current contents of an open ledger handle. */
export function readLedgerContents(handle: LedgerHandle): string {
  const st = fstatSync(handle.fd);
  const size = st.size;
  if (size === 0) return '';
  const buf = Buffer.allocUnsafe(size);
  let read = 0;
  while (read < size) {
    const n = readSync(handle.fd, buf, read, size - read, read);
    if (n === 0) break;
    read += n;
  }
  return buf.toString('utf8', 0, read);
}

/**
 * Compare-and-append one complete LF-terminated record to the ledger handle after
 * verifying the current on-disk size equals `expectedSize` (the tail the caller
 * verified the chain against). On a short write, `ftruncate` back to `expectedSize`
 * and throw so the caller can retry the identical append. Returns the new size.
 */
export function compareAndAppend(handle: LedgerHandle, expectedSize: number, record: string): number {
  const st = fstatSync(handle.fd);
  if (st.size !== expectedSize) {
    throw new Error(`LEDGER_FS_STALE_TAIL: expected ${expectedSize} got ${st.size}`);
  }
  if (!record.endsWith('\n')) {
    throw new Error('LEDGER_FS_RECORD_UNTERMINATED');
  }
  const buf = Buffer.from(record, 'utf8');
  let written = 0;
  try {
    while (written < buf.length) {
      written += writeSync(handle.fd, buf, written, buf.length - written, expectedSize + written);
    }
    fsyncSync(handle.fd);
  } catch (err) {
    // Roll back any partial bytes to the exact prior size.
    try {
      ftruncateSync(handle.fd, expectedSize);
      fsyncSync(handle.fd);
    } catch {
      throw new Error('LEDGER_FS_ROLLBACK_FAILED');
    }
    throw err;
  }
  fsyncDir(dirname(handle.absPath));
  return expectedSize + buf.length;
}

export function closeLedger(handle: LedgerHandle): void {
  closeSync(handle.fd);
}

/** Read a file's bytes under the anchor (for chain verification/reload). */
export function readFileUnderRoot(anchor: RepoRootAnchor, relativePath: string): string {
  const abs = resolveUnderRoot(anchor, relativePath);
  const lst = lstatSync(abs);
  if (lst.isSymbolicLink()) {
    throw new Error(`LEDGER_FS_PATH_SYMLINK: ${relativePath}`);
  }
  return readFileSync(abs, 'utf8');
}
