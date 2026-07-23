import {createHash} from 'node:crypto';

import {jcsCanonical} from './jcs.js';

/**
 * Ledger hashing: raw lowercase 64-hex SHA-256, per the Workflow Ledger contract.
 * Kept separate from `src/engine/hash.ts` because ledger hashes are computed over
 * RFC 8785 / JCS bytes rather than the compiler's lexicographic canonical JSON.
 */

/** Lowercase SHA-256 hex digest over exact UTF-8 bytes. */
export function sha256Hex(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Lowercase SHA-256 hex digest over the RFC 8785 / JCS encoding of a value. */
export function sha256Jcs(value: unknown): string {
  return sha256Hex(jcsCanonical(value));
}
