import {createHash} from 'node:crypto';

import {canonicalJson} from './canonical-json.js';

/** Lowercase SHA-256 hex digest over exact UTF-8 bytes. */
export function sha256Hex(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Lowercase SHA-256 hex digest over the canonical JSON encoding of a value. */
export function sha256Canonical(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
