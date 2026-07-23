import {closeSync, fsyncSync, mkdirSync, openSync, renameSync, writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, join} from 'node:path';

import {canonicalJson} from '../canonical-json.js';

/** Atomically write canonical JSON bytes (with trailing newline) to a path. */
export function writeCanonicalFileSync(path: string, value: unknown): void {
  const dir = dirname(path);
  mkdirSync(dir, {recursive: true});
  const bytes = `${canonicalJson(value)}\n`;
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
