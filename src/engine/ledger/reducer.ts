/**
 * Deterministic Workflow Ledger reducer (build scope).
 *
 * Implements the exact state transitions the contract defines for:
 *   - `project-initialized` (sequence 1) → sets control ready@INTAKE, no request yet
 *   - `invocation-received` → binds `activeRequest`, control ready@INTAKE
 *   - `decision-recorded` with `advance` → producer-free move along the initial
 *     linear semantic sequence (INTAKE→FACT_CHECK→BRIEF→TREATMENT→MOTION_SPEC→VALIDATE)
 *   - `decision-recorded` with `abandon` → terminal STOP (attributed abandoned)
 *   - `decision-recorded` with `delivery-complete` → terminal COMPLETE
 *
 * Every other event kind / decision route is carried structurally by the types but
 * refused here with `LEDGER_REDUCER_ROUTE_NOT_IMPLEMENTED`, so a deferred route can
 * never produce a silently-wrong transition.
 */

import {computeEventBindingHash} from './chain.js';
import type {
  DecisionRecordedPayload,
  InvocationReceivedPayload,
  LedgerEventBindingProjection,
  ProjectInitializedPayload,
  WorkflowCheckpoint,
  WorkflowState,
} from './types.js';

const INITIAL_CHECKPOINT: WorkflowCheckpoint = {
  control: {kind: 'ready', state: 'INTAKE'},
  currentRevisionId: null,
  activeRequest: null,
  invalidatedContentHashes: [],
};

/**
 * Legal producer-free `advance` transitions along the initial linear sequence.
 * INTAKE→FACT_CHECK is the "no local source" producer-free advance; the remaining
 * arrows are the facts-closed / acceptance continuations that this build models as
 * producer-free state moves for the happy path.
 */
const ADVANCE_EDGES: ReadonlyArray<readonly [WorkflowState, WorkflowState]> = [
  ['INTAKE', 'FACT_CHECK'],
  ['FACT_CHECK', 'BRIEF'],
  ['BRIEF', 'TREATMENT'],
  ['TREATMENT', 'MOTION_SPEC'],
  ['MOTION_SPEC', 'VALIDATE'],
];

function isLegalAdvance(from: WorkflowState, to: WorkflowState): boolean {
  return ADVANCE_EDGES.some(([a, b]) => a === from && b === to);
}

function currentReadyState(previous: WorkflowCheckpoint): WorkflowState {
  if (previous.control.kind !== 'ready') {
    throw new Error(`LEDGER_REDUCER_NOT_READY: control is ${previous.control.kind}`);
  }
  return previous.control.state;
}

export function reduce(
  previous: WorkflowCheckpoint | null,
  binding: LedgerEventBindingProjection,
): WorkflowCheckpoint {
  switch (binding.eventKind) {
    case 'project-initialized': {
      if (previous !== null) {
        throw new Error('LEDGER_REDUCER_INIT_NOT_FIRST');
      }
      if (binding.sequence !== 1) {
        throw new Error('LEDGER_REDUCER_INIT_SEQUENCE');
      }
      // Payload shape presence check (allocatedProjectId must equal projectId).
      const p = binding.payload as ProjectInitializedPayload;
      if (p.allocatedProjectId !== binding.projectId) {
        throw new Error('LEDGER_REDUCER_INIT_PROJECT_MISMATCH');
      }
      return {...INITIAL_CHECKPOINT};
    }

    case 'invocation-received': {
      if (previous === null) throw new Error('LEDGER_REDUCER_NO_PRIOR');
      if (previous.activeRequest !== null) {
        throw new Error('LEDGER_REDUCER_REQUEST_ALREADY_ACTIVE');
      }
      if (previous.control.kind !== 'ready' || previous.control.state !== 'INTAKE') {
        throw new Error('LEDGER_REDUCER_INVOCATION_STATE');
      }
      const p = binding.payload as InvocationReceivedPayload;
      // `invocationEventHash` binds the matching invocation binding hash; the chain
      // engine has already validated the previous-hash linkage, so we bind the
      // binding projection's own hash surrogate: the recorder computes and passes
      // the eventBindingHash via a later wiring step. Here we bind requestId only.
      return {
        control: {kind: 'ready', state: 'INTAKE'},
        currentRevisionId: previous.currentRevisionId,
        invalidatedContentHashes: previous.invalidatedContentHashes,
        activeRequest: {
          requestId: binding.requestId,
          requestClass: p.requestClass,
          trustedHostId: p.trustedHostId,
          sourceUserInstruction: p.sourceUserInstruction,
          invocationEnvelopeHash: p.invocationEnvelopeHash,
          suppliedLocatorSetHash: p.suppliedLocatorSetHash,
          // Legacy-named field equals this event's binding hash; the chain engine
          // sets it during rebuild verification. We store the projection's computed
          // binding hash indirectly via the recorder; for reducer purposes we bind
          // the deterministic value below.
          invocationEventHash: computeInvocationEventBindingHash(binding),
          repairCycleId: 'repair-0001',
          structuralRepairCount: 0,
          visualRepairCount: 0,
        },
      };
    }

    case 'decision-recorded': {
      if (previous === null) throw new Error('LEDGER_REDUCER_NO_PRIOR');
      const {decision} = binding.payload as DecisionRecordedPayload;
      switch (decision.kind) {
        case 'advance': {
          const from = currentReadyState(previous);
          const d = decision as {kind: 'advance'; fromState: WorkflowState; toState: WorkflowState};
          if (d.fromState !== from) {
            throw new Error(`LEDGER_REDUCER_ADVANCE_FROM: at ${from} got ${d.fromState}`);
          }
          if (!isLegalAdvance(d.fromState, d.toState)) {
            throw new Error(`LEDGER_REDUCER_ADVANCE_ILLEGAL: ${d.fromState}→${d.toState}`);
          }
          return {...previous, control: {kind: 'ready', state: d.toState}};
        }
        case 'abandon': {
          return {
            ...previous,
            control: {kind: 'terminal', state: 'STOP', outcomeKind: 'abandoned'},
          };
        }
        case 'delivery-complete': {
          return {
            ...previous,
            control: {kind: 'terminal', state: 'COMPLETE', outcomeKind: 'completed'},
          };
        }
        default:
          throw new Error(`LEDGER_REDUCER_ROUTE_NOT_IMPLEMENTED: decision ${decision.kind}`);
      }
    }

    case 'role-result-recorded':
    case 'interface-result-recorded':
    case 'operator-input-recorded':
      throw new Error(`LEDGER_REDUCER_ROUTE_NOT_IMPLEMENTED: ${binding.eventKind}`);

    default:
      throw new Error(`LEDGER_REDUCER_UNKNOWN_EVENT: ${String(binding.eventKind)}`);
  }
}

/**
 * The invocation event's legacy-named `invocationEventHash` equals the matching
 * `eventBindingHash` of the `invocation-received` event. It is deterministic from
 * the binding projection alone (no stateAfter), so the reducer can compute it while
 * deriving the checkpoint without a fixed point.
 */
function computeInvocationEventBindingHash(binding: LedgerEventBindingProjection): string {
  // chain.ts imports the reducer only as a call-time parameter (never at module
  // load), so importing its pure hash helper here is cycle-free.
  return computeEventBindingHash(binding);
}
