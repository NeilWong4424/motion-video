import {closeSync, fsyncSync, mkdirSync, openSync, renameSync, writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, join} from 'node:path';

/** Atomically write generated TypeScript source (LF-normalized) to a path. */
export function writeCanonicalTsSync(path: string, source: string): void {
  const dir = dirname(path);
  mkdirSync(dir, {recursive: true});
  const bytes = source.replaceAll('\r\n', '\n');
  const tmp = join(dir, `.${randomUUID()}.tmp`);
  const fd = openSync(tmp, 'w');
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, path);
}
