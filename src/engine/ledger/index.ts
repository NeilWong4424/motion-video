/**
 * Workflow Ledger recorder (Part 1 orchestration governance).
 *
 * Public surface for a future orchestrator/adapter. This is the deterministic,
 * append-only recorder specified by `agent/contracts/workflow-ledger.md`. It
 * implements the initialization + terminal + initial-linear reducer path with a
 * fully verified hash chain; deferred routes refuse loudly rather than guess.
 */

export {jcsCanonical} from './jcs.js';
export {sha256Hex, sha256Jcs} from './hash.js';
export {
  allocateNextId,
  isOrdinalId,
  parseOrdinalId,
  renderOrdinal,
  type IdFamily,
} from './ids.js';
export {
  projectDurableSafeText,
  projectDurableInstructionText,
  isDurableSafeText,
  type DurableInstructionText,
  type DurableLocatorSafeText,
  type SuppliedLocator,
} from './redaction.js';
export {
  anchorRepoRoot,
  type RepoRootAnchor,
} from './fs-safe.js';
export {
  buildNextEvent,
  classifyLedger,
  serializeEventLine,
  type Reducer,
} from './chain.js';
export {reduce} from './reducer.js';
export {
  loadLedger,
  ledgerRelativePath,
  highestRequestOrdinal,
  type LoadedLedger,
} from './load-checkpoint.js';
export {
  initializeProject,
  appendDecision,
  writeActionResultSidecar,
  type InitializeInput,
  type RecorderResult,
} from './recorder.js';
export type {
  LedgerEvent,
  WorkflowCheckpoint,
  WorkflowControl,
  WorkflowState,
  ActiveRequest,
  RequestClass,
  HostId,
} from './types.js';
