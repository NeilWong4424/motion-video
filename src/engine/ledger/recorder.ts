/**
 * Workflow Ledger recorder — the sole legal writer of `.workflow/ledger.jsonl` and
 * the immutable action-result sidecars.
 *
 * Build scope (see plan): this implements the deterministic append/verify engine and
 * the initialization + terminal + initial-linear reducer path. It exposes a small,
 * honest API that a future orchestrator/adapter calls. It never fabricates an
 * interface result and only claims what it verifiably wrote.
 *
 * Append transaction (per contract):
 *   1. load + fully verify the current chain from one retained handle;
 *   2. build the next event via the reducer (deriving stateAfter + both hashes);
 *   3. compare-and-append one LF-terminated JCS line at the exact verified tail,
 *      fsync file + parent dir, with ftruncate rollback on a short write.
 *
 * First initialization uses exclusive create so a pre-existing/symlinked ledger is a
 * refusal, then appends `project-initialized` (seq 1) and `invocation-received`.
 */

import {
  buildNextEvent,
  classifyLedger,
  serializeEventLine,
} from './chain.js';
import {
  anchorRepoRoot,
  closeLedger,
  compareAndAppend,
  createExclusiveFile,
  openLedgerForAppend,
  readLedgerContents,
  type RepoRootAnchor,
} from './fs-safe.js';
import {sha256Jcs} from './hash.js';
import {ledgerRelativePath} from './load-checkpoint.js';
import {projectDurableInstructionText, type DurableInstructionText} from './redaction.js';
import {reduce} from './reducer.js';
import type {
  DecisionRecordedPayload,
  HostId,
  LedgerEvent,
  LedgerEventBindingProjection,
  RequestClass,
  WorkflowCheckpoint,
} from './types.js';

export type {RepoRootAnchor};
export {anchorRepoRoot};

function sidecarRelativePath(projectId: string, actionId: string, receiptHash: string): string {
  return `projects/${projectId}/.workflow/action-results/${actionId}/${receiptHash}.json`;
}

/** Read + verify the full ledger from an open handle; refuse on any corruption. */
function loadVerified(
  contents: string,
): {events: LedgerEvent[]; last: LedgerEvent | null; verifiedSize: number} {
  if (contents.length === 0) {
    return {events: [], last: null, verifiedSize: 0};
  }
  const classified = classifyLedger(contents, reduce);
  if (classified.kind === 'corrupt') {
    throw new Error(`LEDGER_CORRUPT: ${classified.reason}`);
  }
  if (classified.kind === 'empty') {
    return {events: [], last: null, verifiedSize: 0};
  }
  const last = classified.events[classified.events.length - 1] ?? null;
  return {events: classified.events, last, verifiedSize: classified.verifiedSize};
}

function makeBinding(
  projectId: string,
  requestId: string,
  previous: LedgerEvent | null,
  eventKind: LedgerEventBindingProjection['eventKind'],
  payload: LedgerEventBindingProjection['payload'],
): LedgerEventBindingProjection {
  return {
    schemaVersion: 'workflow-ledger-event@1',
    sequence: previous ? previous.sequence + 1 : 1,
    projectId,
    requestId,
    previousEventHash: previous ? previous.eventHash : null,
    eventKind,
    payload,
  };
}

export type InitializeInput = {
  requestedProjectId: string | null;
  allocatedProjectId: string;
  requestClass: RequestClass;
  trustedHostId: HostId;
  /** Raw user instruction; the recorder projects it to DurableInstructionText. */
  rawUserInstruction: string;
  suppliedLocalPathCount: number;
  suppliedLocatorSetHash: string | null;
};

export type RecorderResult = {
  checkpoint: WorkflowCheckpoint;
  events: LedgerEvent[];
  ledgerRelativePath: string;
};

/**
 * Initialize a brand-new project ledger: exclusive-create the file with the first
 * `project-initialized` event, then append `invocation-received`. Refuses if a
 * ledger already exists at the allocated identity.
 */
export function initializeProject(anchor: RepoRootAnchor, input: InitializeInput): RecorderResult {
  const {allocatedProjectId: projectId} = input;
  const rel = ledgerRelativePath(projectId);
  const requestId = 'request-0001';
  const instruction: DurableInstructionText = projectDurableInstructionText(input.rawUserInstruction);

  // Event 1: project-initialized (exclusive create — first line).
  const e1 = buildNextEvent(
    makeBinding(projectId, requestId, null, 'project-initialized', {
      requestedProjectId: input.requestedProjectId,
      allocatedProjectId: projectId,
    }),
    null,
    reduce,
  );
  createExclusiveFile(anchor, rel, serializeEventLine(e1));

  // The invocationEnvelopeHash is derived only from the durable projection. Here we
  // bind it to the sanitized instruction + host + counts, per the contract's rule
  // that it comes from the durable projection, never a raw envelope.
  const invocationEnvelopeHash = sha256Jcs({
    requestClass: input.requestClass,
    trustedHostId: input.trustedHostId,
    sourceUserInstruction: instruction,
    suppliedLocalPathCount: input.suppliedLocalPathCount,
    suppliedLocatorSetHash: input.suppliedLocatorSetHash,
  });

  // Event 2: invocation-received (compare-and-append at the verified tail).
  const handle = openLedgerForAppend(anchor, rel);
  try {
    const contents = readLedgerContents(handle);
    const {last, verifiedSize} = loadVerified(contents);
    const e2 = buildNextEvent(
      makeBinding(projectId, requestId, last, 'invocation-received', {
        requestClass: input.requestClass,
        trustedHostId: input.trustedHostId,
        sourceUserInstruction: instruction,
        suppliedLocalPathCount: input.suppliedLocalPathCount,
        suppliedLocatorSetHash: input.suppliedLocatorSetHash,
        invocationEnvelopeHash,
      }),
      last,
      reduce,
    );
    compareAndAppend(handle, verifiedSize, serializeEventLine(e2));
    return {checkpoint: e2.stateAfter, events: [e1, e2], ledgerRelativePath: rel};
  } finally {
    closeLedger(handle);
  }
}

/**
 * Append one `decision-recorded` event (e.g. a producer-free advance or a terminal
 * abandon/complete) to an existing verified ledger.
 */
export function appendDecision(
  anchor: RepoRootAnchor,
  projectId: string,
  decision: DecisionRecordedPayload['decision'],
): RecorderResult {
  const rel = ledgerRelativePath(projectId);
  const handle = openLedgerForAppend(anchor, rel);
  try {
    const contents = readLedgerContents(handle);
    const {events, last, verifiedSize} = loadVerified(contents);
    if (!last) throw new Error('LEDGER_NO_PRIOR_EVENTS');
    const requestId = last.requestId;
    const payload: DecisionRecordedPayload = {decision};
    const next = buildNextEvent(
      makeBinding(projectId, requestId, last, 'decision-recorded', payload),
      last,
      reduce,
    );
    compareAndAppend(handle, verifiedSize, serializeEventLine(next));
    return {checkpoint: next.stateAfter, events: [...events, next], ledgerRelativePath: rel};
  } finally {
    closeLedger(handle);
  }
}

/**
 * Write an immutable action-result sidecar BEFORE its ledger result event, per the
 * contract's crash-recovery ordering. Exclusive create + fsync; returns its path.
 * (Result-event append is a deferred route in this build; the sidecar writer is
 * provided so the ordering primitive exists and is tested.)
 */
export function writeActionResultSidecar(
  anchor: RepoRootAnchor,
  projectId: string,
  actionId: string,
  payload: unknown,
): {relativePath: string; resultReceiptHash: string} {
  const resultReceiptHash = sha256Jcs(payload);
  const rel = sidecarRelativePath(projectId, actionId, resultReceiptHash);
  createExclusiveFile(anchor, rel, `${JSON.stringify(payload)}\n`);
  return {relativePath: rel, resultReceiptHash};
}
