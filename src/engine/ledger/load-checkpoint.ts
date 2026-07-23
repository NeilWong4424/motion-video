/**
 * Load and verify a project's Workflow Ledger, returning the current checkpoint.
 *
 * Never infers state from filenames. If the ledger is missing, empty, or fails
 * chain/reducer verification, this refuses — matching the contract's rule that an
 * unverifiable ledger terminates the current request for explicit migration rather
 * than a guessed resume.
 */

import {classifyLedger} from './chain.js';
import {readFileUnderRoot, type RepoRootAnchor} from './fs-safe.js';
import {reduce} from './reducer.js';
import type {LedgerEvent, WorkflowCheckpoint} from './types.js';

export type LoadedLedger = {
  events: LedgerEvent[];
  checkpoint: WorkflowCheckpoint;
  /** Byte length of the verified ledger (the exact append tail). */
  verifiedSize: number;
};

export function ledgerRelativePath(projectId: string): string {
  return `projects/${projectId}/.workflow/ledger.jsonl`;
}

/**
 * Load the ledger for a project. Returns null when no ledger file exists (a genuine
 * new project). Throws on any corruption or verification failure.
 */
export function loadLedger(anchor: RepoRootAnchor, projectId: string): LoadedLedger | null {
  const rel = ledgerRelativePath(projectId);
  let contents: string;
  try {
    contents = readFileUnderRoot(anchor, rel);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  const classified = classifyLedger(contents, reduce);
  if (classified.kind === 'empty') {
    throw new Error('LEDGER_EMPTY_FILE');
  }
  if (classified.kind === 'corrupt') {
    throw new Error(`LEDGER_CORRUPT: ${classified.reason} at verifiedSize=${classified.verifiedSize}`);
  }
  const last = classified.events[classified.events.length - 1];
  if (!last) throw new Error('LEDGER_NO_EVENTS');
  return {
    events: classified.events,
    checkpoint: last.stateAfter,
    verifiedSize: classified.verifiedSize,
  };
}

/** Highest allocated ordinal for a request family across the loaded events. */
export function highestRequestOrdinal(events: LedgerEvent[]): number {
  let max = 0;
  for (const ev of events) {
    const m = /^request-(\d+)$/.exec(ev.requestId);
    if (m) {
      const n = Number(m[1]);
      if (Number.isSafeInteger(n) && n > max) max = n;
    }
  }
  return max;
}
