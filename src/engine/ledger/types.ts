/**
 * Closed Workflow Ledger event and checkpoint types (build scope).
 *
 * These mirror `agent/contracts/workflow-ledger.md`. The contract's full checkpoint
 * and pending-action cross-product is vast; this build models the fields the
 * in-scope reducer actually reads and transitions (initialization, terminal, and the
 * initial linear semantic sequence FACT_CHECK→BRIEF→TREATMENT→MOTION_SPEC→VALIDATE).
 * Routes outside that scope are represented structurally but their reducer
 * transitions throw `LEDGER_REDUCER_ROUTE_NOT_IMPLEMENTED` rather than guess.
 */

import type {DurableInstructionText, DurableLocatorSafeText} from './redaction.js';

export type Sha256 = string;

/** Trusted host identity supplied out-of-band by the adapter. */
export type HostId = 'codex' | 'claude-code';

export type HumanActorId = string & {readonly __humanActorId: unique symbol};

export type RequestClass =
  | 'new-project'
  | 'visual-revision'
  | 'review-retry'
  | 'audio-request'
  | 'delivery-retry';

/**
 * Workflow states relevant to this build. The full machine has more; these are the
 * ones the in-scope reducer can enter/verify. Unknown target states from a deferred
 * route cause the reducer to refuse loudly.
 */
export type WorkflowState =
  | 'INTAKE'
  | 'FACT_CHECK'
  | 'BRIEF'
  | 'TREATMENT'
  | 'MOTION_SPEC'
  | 'VALIDATE'
  | 'STOP'
  | 'COMPLETE';

export type ControlKind = 'ready' | 'running' | 'candidate-ready' | 'paused' | 'terminal';

export type WorkflowControl =
  | {kind: 'ready'; state: WorkflowState}
  | {kind: 'running'; state: WorkflowState; actionId: string; interfaceOrRole: string}
  | {
      kind: 'candidate-ready';
      state: WorkflowState;
      candidateByteHash: Sha256;
      candidateByteLength: number;
      acceptanceRouteId: string;
      candidatePath: string;
      actionId: string;
    }
  | {kind: 'paused'; state: WorkflowState; pauseId: string; pauseKind: string}
  | {kind: 'terminal'; state: 'STOP' | 'COMPLETE'; outcomeKind: TerminalOutcomeKind};

export type TerminalOutcomeKind = 'completed' | 'abandoned' | 'blocked' | 'out-of-scope';

export type ActiveRequest = {
  requestId: string;
  requestClass: RequestClass;
  trustedHostId: HostId;
  sourceUserInstruction: DurableInstructionText;
  invocationEnvelopeHash: Sha256;
  suppliedLocatorSetHash: Sha256 | null;
  invocationEventHash: string;
  repairCycleId: string;
  structuralRepairCount: number;
  visualRepairCount: number;
};

/**
 * The reduced checkpoint. This is the deterministic function of the verified prior
 * checkpoint plus the typed event; it is never trusted from caller input.
 */
export type WorkflowCheckpoint = {
  control: WorkflowControl;
  currentRevisionId: string | null;
  activeRequest: ActiveRequest | null;
  invalidatedContentHashes: string[];
};

// --- Closed events -----------------------------------------------------------

export type LedgerEventKind =
  | 'project-initialized'
  | 'invocation-received'
  | 'decision-recorded'
  | 'role-result-recorded'
  | 'interface-result-recorded'
  | 'operator-input-recorded';

export type ProjectInitializedPayload = {
  requestedProjectId: string | null;
  allocatedProjectId: string;
};

export type InvocationReceivedPayload = {
  requestClass: RequestClass;
  trustedHostId: HostId;
  sourceUserInstruction: DurableInstructionText;
  suppliedLocalPathCount: number;
  suppliedLocatorSetHash: Sha256 | null;
  invocationEnvelopeHash: Sha256;
};

/**
 * A workflow decision. Scoped: the reducer understands `advance` (producer-free
 * state move), `abandon` (→ STOP), and `delivery-complete` (→ COMPLETE). Other
 * decision kinds are carried structurally and refused by the reducer.
 */
export type DecisionRecordedPayload = {
  decision:
    | {kind: 'advance'; fromState: WorkflowState; toState: WorkflowState}
    | {kind: 'delegate-role'; state: WorkflowState; actionId: string; role: string}
    | {kind: 'abandon'; actor: {type: 'human'; id: HumanActorId}; reason: DurableInstructionText}
    | {kind: 'delivery-complete'; deliveryManifestHash: Sha256}
    | {kind: string; [field: string]: unknown};
};

export type RoleResultRecordedPayload = {
  actionId: string;
  inputBindingHash: string;
  resultReceiptHash: string;
  /**
   * On `written`, the recorder's mechanical candidate capture: exact byte hash,
   * length, the acceptance route, the candidate path, and the producer state the
   * candidate is mapped back to. The reducer moves control to `candidate-ready`.
   */
  written?: {
    candidateByteHash: string;
    candidateByteLength: number;
    acceptanceRouteId: string;
    candidatePath: string;
    producerState: WorkflowState;
  };
  [field: string]: unknown;
};

export type InterfaceResultRecordedPayload = {
  actionId: string;
  /**
   * On acceptance success, the embedded ArtifactAcceptance identity the reducer uses
   * to apply the route's one success-state continuation.
   */
  acceptance?: {
    acceptanceRouteId: string;
    candidateByteHash: string;
    successState: WorkflowState;
    contentHash: string;
  };
  [field: string]: unknown;
};

export type OperatorInputRecordedPayload = {
  pauseId: string | null;
  operatorEnvelopeHash: Sha256 | null;
  input: {kind: string; [field: string]: unknown};
};

export type LedgerEventPayload =
  | ProjectInitializedPayload
  | InvocationReceivedPayload
  | DecisionRecordedPayload
  | RoleResultRecordedPayload
  | InterfaceResultRecordedPayload
  | OperatorInputRecordedPayload;

/** The projection hashed for `eventBindingHash` — omits stateAfter + both hashes. */
export type LedgerEventBindingProjection = {
  schemaVersion: 'workflow-ledger-event@1';
  sequence: number;
  projectId: string;
  requestId: string;
  previousEventHash: string | null;
  eventKind: LedgerEventKind;
  payload: LedgerEventPayload;
};

/** The full persisted event: binding projection + derived state + both hashes. */
export type LedgerEvent = LedgerEventBindingProjection & {
  eventBindingHash: string;
  stateAfter: WorkflowCheckpoint;
  eventHash: string;
};

export type {DurableInstructionText, DurableLocatorSafeText};
