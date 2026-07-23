import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {
  anchorRepoRoot,
  compareAndAppend,
  createExclusiveFile,
  ensureAncestorsNoFollow,
  openLedgerForAppend,
  readLedgerContents,
  resolveUnderRoot,
  closeLedger,
} from '../../src/engine/ledger/fs-safe.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ledger-fs-'));
});

afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

describe('anchor + path resolution', () => {
  it('anchors a real directory and rejects escapes', () => {
    const anchor = anchorRepoRoot(root);
    expect(resolveUnderRoot(anchor, 'projects/p/.workflow/ledger.jsonl')).toContain('ledger.jsonl');
    expect(() => resolveUnderRoot(anchor, '../escape')).toThrow(/PATH_ESCAPE/);
    expect(() => resolveUnderRoot(anchor, 'a/../../b')).toThrow(/PATH_ESCAPE/);
  });
});

describe('exclusive create', () => {
  it('creates a file with exact bytes and refuses a second create', () => {
    const anchor = anchorRepoRoot(root);
    createExclusiveFile(anchor, 'projects/p/.workflow/ledger.jsonl', 'line1\n');
    expect(readFileSync(join(root, 'projects/p/.workflow/ledger.jsonl'), 'utf8')).toBe('line1\n');
    expect(() => createExclusiveFile(anchor, 'projects/p/.workflow/ledger.jsonl', 'x\n')).toThrow();
  });

  it('creates missing ancestor directories without recursion surprises', () => {
    const anchor = anchorRepoRoot(root);
    ensureAncestorsNoFollow(anchor, join(root, 'a', 'b', 'c', 'file.json'));
    // a/b/c should now exist as directories.
    expect(() => createExclusiveFile(anchor, 'a/b/c/file.json', '{}\n')).not.toThrow();
  });
});

describe('symlink refusal', () => {
  it('refuses a symlinked ancestor when present', () => {
    const anchor = anchorRepoRoot(root);
    const realDir = join(root, 'real');
    mkdirSync(realDir);
    const linkPath = join(root, 'projects');
    let symlinkOk = true;
    try {
      symlinkSync(realDir, linkPath, 'dir');
    } catch {
      symlinkOk = false; // Windows without privilege: skip.
    }
    if (!symlinkOk) return;
    expect(() => createExclusiveFile(anchor, 'projects/p/.workflow/ledger.jsonl', 'x\n')).toThrow(
      /SYMLINK/,
    );
  });
});

describe('compare-and-append', () => {
  it('appends when the tail matches and rejects a stale tail', () => {
    const anchor = anchorRepoRoot(root);
    createExclusiveFile(anchor, 'projects/p/.workflow/ledger.jsonl', 'a\n');
    const handle = openLedgerForAppend(anchor, 'projects/p/.workflow/ledger.jsonl');
    try {
      expect(readLedgerContents(handle)).toBe('a\n');
      const size = handle.size;
      const newSize = compareAndAppend(handle, size, 'b\n');
      expect(newSize).toBe(size + 2);
      // Stale tail: using the old size now fails.
      expect(() => compareAndAppend(handle, size, 'c\n')).toThrow(/STALE_TAIL/);
    } finally {
      closeLedger(handle);
    }
    expect(readFileSync(join(root, 'projects/p/.workflow/ledger.jsonl'), 'utf8')).toBe('a\nb\n');
  });

  it('refuses an unterminated record', () => {
    const anchor = anchorRepoRoot(root);
    createExclusiveFile(anchor, 'projects/p/.workflow/ledger.jsonl', 'a\n');
    const handle = openLedgerForAppend(anchor, 'projects/p/.workflow/ledger.jsonl');
    try {
      expect(() => compareAndAppend(handle, handle.size, 'no-newline')).toThrow(/UNTERMINATED/);
    } finally {
      closeLedger(handle);
    }
  });

  it('refuses to open a pre-existing plain file as a symlink path but reads regular files', () => {
    const anchor = anchorRepoRoot(root);
    mkdirSync(join(root, 'projects', 'p', '.workflow'), {recursive: true});
    writeFileSync(join(root, 'projects', 'p', '.workflow', 'ledger.jsonl'), 'x\n');
    const handle = openLedgerForAppend(anchor, 'projects/p/.workflow/ledger.jsonl');
    try {
      expect(readLedgerContents(handle)).toBe('x\n');
    } finally {
      closeLedger(handle);
    }
  });
});
