/**
 * Ledger chain engine: two-stage hashing, line (de)serialization, and full-chain
 * verification, per `agent/contracts/workflow-ledger.md`.
 *
 * Two-stage, non-self-referential hashing:
 *   1. `eventBindingHash` = SHA-256(JCS(binding projection)), where the binding
 *      projection is the immutable header + prior chain hash + kind + payload, and
 *      deliberately omits `stateAfter`, `eventBindingHash`, and `eventHash`.
 *   2. The reducer derives `stateAfter` from the verified prior checkpoint + event.
 *   3. `eventHash` = SHA-256(JCS(full event with only `eventHash` omitted)); it
 *      therefore binds `eventBindingHash` and the derived checkpoint.
 *
 * Each ledger line is one JCS event followed by exactly one LF.
 */

import {jcsCanonical} from './jcs.js';
import {sha256Hex} from './hash.js';
import type {
  LedgerEvent,
  LedgerEventBindingProjection,
  WorkflowCheckpoint,
} from './types.js';

export type Reducer = (
  previous: WorkflowCheckpoint | null,
  binding: LedgerEventBindingProjection,
) => WorkflowCheckpoint;

/** Compute the binding-projection hash (stage 1). */
export function computeEventBindingHash(binding: LedgerEventBindingProjection): string {
  return sha256Hex(jcsCanonical(binding));
}

/** Compute the final event hash (stage 3) over the event minus `eventHash`. */
export function computeEventHash(event: Omit<LedgerEvent, 'eventHash'>): string {
  return sha256Hex(jcsCanonical(event));
}

/** Serialize a complete event to its canonical LF-terminated ledger line. */
export function serializeEventLine(event: LedgerEvent): string {
  return `${jcsCanonical(event)}\n`;
}

/**
 * Build the next complete event from a binding projection and a reducer. Verifies
 * the projection's `previousEventHash` and `sequence` are consistent with the prior
 * event, derives `stateAfter`, and computes both hashes.
 */
export function buildNextEvent(
  binding: LedgerEventBindingProjection,
  previousEvent: LedgerEvent | null,
  reduce: Reducer,
): LedgerEvent {
  const expectedSeq = previousEvent ? previousEvent.sequence + 1 : 1;
  if (binding.sequence !== expectedSeq) {
    throw new Error(`LEDGER_CHAIN_SEQUENCE: expected ${expectedSeq} got ${binding.sequence}`);
  }
  const expectedPrev = previousEvent ? previousEvent.eventHash : null;
  if (binding.previousEventHash !== expectedPrev) {
    throw new Error('LEDGER_CHAIN_PREV_HASH_MISMATCH');
  }
  const eventBindingHash = computeEventBindingHash(binding);
  const previousCheckpoint = previousEvent ? previousEvent.stateAfter : null;
  const stateAfter = reduce(previousCheckpoint, binding);
  const withoutFinal: Omit<LedgerEvent, 'eventHash'> = {
    ...binding,
    eventBindingHash,
    stateAfter,
  };
  const eventHash = computeEventHash(withoutFinal);
  return {...withoutFinal, eventHash};
}

export type ParsedLedger = {
  events: LedgerEvent[];
  /** Byte length of the verified prefix (all complete, valid lines). */
  verifiedSize: number;
};

export type LedgerClassification =
  | {kind: 'ok'; events: LedgerEvent[]; verifiedSize: number}
  | {kind: 'empty'}
  | {kind: 'corrupt'; reason: string; verifiedSize: number};

/**
 * Parse and fully verify a ledger's raw contents. Recomputes both hashes for every
 * event, checks the sequence (1..N, +1 each) and the previous-hash chain, and
 * re-derives every checkpoint via the reducer, requiring the stored bytes to match.
 *
 * A trailing partial (non-LF-terminated) suffix, a torn line, or any verification
 * failure is classified `corrupt` with the byte size of the last fully verified
 * prefix — the contract's terminal-corruption signal.
 */
export function classifyLedger(contents: string, reduce: Reducer): LedgerClassification {
  if (contents.length === 0) return {kind: 'empty'};

  const events: LedgerEvent[] = [];
  let previous: LedgerEvent | null = null;
  let verifiedSize = 0;
  let offset = 0;

  while (offset < contents.length) {
    const nl = contents.indexOf('\n', offset);
    if (nl === -1) {
      // Trailing partial suffix with no terminator: torn write.
      return {kind: 'corrupt', reason: 'LEDGER_TORN_SUFFIX', verifiedSize};
    }
    const line = contents.slice(offset, nl);
    let parsed: LedgerEvent;
    try {
      parsed = JSON.parse(line) as LedgerEvent;
    } catch {
      return {kind: 'corrupt', reason: 'LEDGER_LINE_NOT_JSON', verifiedSize};
    }
    // Canonical-bytes check: the stored line must equal the JCS of its own object.
    if (jcsCanonical(parsed) !== line) {
      return {kind: 'corrupt', reason: 'LEDGER_LINE_NONCANONICAL', verifiedSize};
    }
    // Rebuild from the binding projection and require an exact match.
    const binding: LedgerEventBindingProjection = {
      schemaVersion: parsed.schemaVersion,
      sequence: parsed.sequence,
      projectId: parsed.projectId,
      requestId: parsed.requestId,
      previousEventHash: parsed.previousEventHash,
      eventKind: parsed.eventKind,
      payload: parsed.payload,
    };
    let rebuilt: LedgerEvent;
    try {
      rebuilt = buildNextEvent(binding, previous, reduce);
    } catch (err) {
      return {kind: 'corrupt', reason: `LEDGER_REBUILD_FAILED:${(err as Error).message}`, verifiedSize};
    }
    if (rebuilt.eventBindingHash !== parsed.eventBindingHash) {
      return {kind: 'corrupt', reason: 'LEDGER_BINDING_HASH_MISMATCH', verifiedSize};
    }
    if (jcsCanonical(rebuilt.stateAfter) !== jcsCanonical(parsed.stateAfter)) {
      return {kind: 'corrupt', reason: 'LEDGER_STATE_AFTER_MISMATCH', verifiedSize};
    }
    if (rebuilt.eventHash !== parsed.eventHash) {
      return {kind: 'corrupt', reason: 'LEDGER_EVENT_HASH_MISMATCH', verifiedSize};
    }
    events.push(rebuilt);
    previous = rebuilt;
    offset = nl + 1;
    verifiedSize = offset;
  }

  return {kind: 'ok', events, verifiedSize};
}
