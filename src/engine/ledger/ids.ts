/**
 * Recorder-owned identifier families for the Workflow Ledger.
 *
 * Per the contract, these IDs are NEVER accepted from model output. Within one
 * project they are monotonically allocated ASCII ordinals with no gaps on
 * successful append: `request-0001`, `action-0001`, `pause-0001`, `repair-0001`,
 * `candidate-0001`, `revision-attempt-0001`, `review-attempt-0001`, and `rev-0001`.
 * Widths grow beyond four digits without truncation. Caller/model-selected
 * suffixes, separators, traversal, alternate spelling, or reuse are invalid.
 */

export const ID_FAMILIES = [
  'request',
  'action',
  'pause',
  'repair',
  'candidate',
  'revision-attempt',
  'review-attempt',
  'rev',
] as const;

export type IdFamily = (typeof ID_FAMILIES)[number];

// Branded string subtypes. The brands are structural markers only; construction is
// always via the validating allocators/parsers below, never a raw cast elsewhere.
export type RequestId = string & {readonly __brand: 'request-id'};
export type ActionId = string & {readonly __brand: 'action-id'};
export type PauseId = string & {readonly __brand: 'pause-id'};

const FAMILY_PATTERN = /^(request|action|pause|repair|candidate|revision-attempt|review-attempt|rev)-(\d+)$/;

/**
 * Parse an ordinal ID of a specific family. Returns the positive integer ordinal,
 * or null if the string is not a canonical, non-truncated, minimal-width-or-wider
 * ordinal of that family.
 *
 * Canonical form: at least 4 digits (zero-padded), no leading-zero ordinal below
 * the minimum width, and the numeric value round-trips to the exact digit string.
 */
export function parseOrdinalId(family: IdFamily, value: string): number | null {
  const match = FAMILY_PATTERN.exec(value);
  if (!match || match[1] !== family) return null;
  const digits = match[2];
  if (digits === undefined) return null;
  // Minimum width is 4; wider is allowed as the ordinal grows, but the digit string
  // must be the canonical rendering of the ordinal (no extra leading zeros beyond
  // the padding needed to reach width 4).
  if (digits.length < 4) return null;
  const ordinal = Number(digits);
  if (!Number.isSafeInteger(ordinal) || ordinal < 1) return null;
  if (renderOrdinal(family, ordinal) !== value) return null;
  return ordinal;
}

/** Render an ordinal to its canonical family ID string (min width 4, growing). */
export function renderOrdinal(family: IdFamily, ordinal: number): string {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1) {
    throw new Error(`LEDGER_ID_ORDINAL_INVALID: ${family} ${String(ordinal)}`);
  }
  const digits = String(ordinal).padStart(4, '0');
  return `${family}-${digits}`;
}

/** Whether a string is a canonical ordinal ID of the given family. */
export function isOrdinalId(family: IdFamily, value: string): boolean {
  return parseOrdinalId(family, value) !== null;
}

/**
 * Allocate the next ID of a family given the highest ordinal already allocated
 * (0 when none). No gaps: the next ordinal is always previous + 1.
 */
export function allocateNextId(family: IdFamily, previousOrdinal: number): string {
  if (!Number.isSafeInteger(previousOrdinal) || previousOrdinal < 0) {
    throw new Error(`LEDGER_ID_PREVIOUS_INVALID: ${family} ${String(previousOrdinal)}`);
  }
  return renderOrdinal(family, previousOrdinal + 1);
}

// Branded parsers for the three families the contract brands explicitly.
export function asRequestId(value: string): RequestId {
  if (!isOrdinalId('request', value)) throw new Error(`REQUEST_ID_INVALID: ${value}`);
  return value as RequestId;
}
export function asActionId(value: string): ActionId {
  if (!isOrdinalId('action', value)) throw new Error(`ACTION_ID_INVALID: ${value}`);
  return value as ActionId;
}
export function asPauseId(value: string): PauseId {
  if (!isOrdinalId('pause', value)) throw new Error(`PAUSE_ID_INVALID: ${value}`);
  return value as PauseId;
}
