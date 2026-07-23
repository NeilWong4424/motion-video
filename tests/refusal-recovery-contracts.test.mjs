import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('every rejected artifact route has an immutable owner correction edge', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const acceptanceRouteBlock = /type AcceptanceContext\s*=([\s\S]*?);\n```/.exec(decision)?.[1] ?? '';
  const rejectionBlock = /type CandidateRejectionContinuation\s*=([\s\S]*?);\n\ntype CandidateRejectionRecoveryRoute/.exec(decision)?.[1] ?? '';
  const acceptanceRouteIds = [...acceptanceRouteBlock.matchAll(/acceptanceRouteId:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.ok(acceptanceRouteIds.length > 0, 'AcceptanceContext routes were not found');
  for (const routeId of acceptanceRouteIds) {
    assert.match(rejectionBlock, new RegExp(`acceptanceRouteId: "${routeId}"`), `missing rejection continuation for ${routeId}`);
  }
  assert.match(decision, /type CandidateRejectionRecoveryRoute/i);
  assert.match(decision, /diagnosticRouteId:\s*"candidate-owner-rewrite"/i);
  assert.match(decision, /decisionKind:\s*"recover-interface-refusal"/i);
  assert.match(decision, /rejectedCandidateByteHash:\s*string/i);
});

test('pause and interface decisions are correlated mapped unions', () => {
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(decision, /type PauseDecisionFor<P extends NonUserWorkflowPause>/i);
  assert.match(decision, /fromState:\s*P\["state"\][\s\S]+toState:\s*P\["state"\]/i);
  assert.match(decision, /pause:\s*P;/i);
  assert.match(decision, /type NeedsUserDecisionFor<P extends RequiredUserInputPause>/i);
  assert.doesNotMatch(decision, /pause:\s*WorkflowPause;/i);
  assert.match(decision, /type ArtifactAcceptanceInvocationDecision/i);
  assert.match(decision, /artifactCandidate:\s*ArtifactCandidateForRoute<R\["acceptanceRouteId"\]>/i);
  assert.match(decision, /type InitialArtifactAcceptanceInvocationRoute\s*=\s*\{[\s\S]+\[R in ArtifactRouteId\]/i);
  assert.match(decision, /type PauseDecision\s*=\s*NonUserWorkflowPause extends infer P/i);
  assert.match(decision, /type NonAcceptanceInterfaceInvocationDecision/i);
  assert.match(decision, /artifactCandidate:\s*null;/i);
  assert.doesNotMatch(decision, /artifactCandidate:\s*ArtifactCandidate\s*\|\s*null/i);
  assert.match(decision, /type InterfaceExecutionStateFor<R extends InterfaceInvocationRoute>[\s\S]+R extends ArtifactAcceptanceInvocationRoute \? "ARTIFACT_ACCEPTANCE"/i);
});

test('interface refusal is closed and every recoverable result names a reachable route', () => {
  const engine = read('agent/contracts/engine-interface.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const diagnostics = read('agent/contracts/diagnostics.md');

  assert.match(engine, /type InterfaceRefusalFor<R extends InterfaceRefusalRecoveryRoute, A extends string = string>/i);
  assert.match(engine, /originState:\s*R\["fromState"\]/i);
  assert.match(engine, /recovery:\s*R/i);
  assert.doesNotMatch(engine, /retryDisposition:\s*"same-input-retry"\s*\|/i);
  assert.match(decision, /type InterfaceRefusalRecoveryRoute\s*=/i);
  for (const routeId of [
    'candidate-owner-rewrite',
    'initial-source-owner-repair',
    'rebuild-owner-repair',
    'revision-interpreter-repair',
    'preview-evidence-repair',
    'preview-gate-recheck',
    'audio-brief-repair',
    'manual-audio-reselect',
    'capability-authorization-repair',
  ]) {
    assert.match(decision, new RegExp(`diagnosticRouteId: "${routeId}"`), `missing workflow edge ${routeId}`);
    assert.match(diagnostics, new RegExp(`"${routeId}"`), `missing diagnostic route ${routeId}`);
  }
  assert.match(diagnostics, /type DiagnosticCode\s*=/i);
  assert.match(diagnostics, /type DiagnosticRouteMap\s*=\s*\{/i);
  assert.match(diagnostics, /type Diagnostic\s*=\s*\{/i);
  assert.doesNotMatch(diagnostics, /type Diagnostic\s*=\s*Record</i);
  assert.match(engine, /type RefusalDiagnosticFor[\s\S]+severity:\s*"blocking"[\s\S]+actionId:\s*A[\s\S]+interfaceId:\s*R\["interfaceId"\]/i);
});

test('one result event atomically closes one running action', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.doesNotMatch(ledger, /LedgerEvent<"artifact-candidate-recorded"/i);
  assert.doesNotMatch(ledger, /LedgerEvent<"artifact-accepted"/i);
  assert.match(ledger, /role-result-recorded[\s\S]+atomically[\s\S]+candidate-ready/i);
  assert.match(ledger, /interface-result-recorded[\s\S]+atomically[\s\S]+(?:ready|refusal-ready|terminal)/i);
  assert.match(ledger, /exactly one matching result event/i);
  assert.match(ledger, /orphan[\s\S]+duplicate|duplicate[\s\S]+orphan/i);
  assert.match(ledger, /kind:\s*"refusal-ready"[\s\S]+PendingInterfaceRefusal/i);
  assert.match(ledger, /type RefusalReadyControl[\s\S]+state:\s*R\["fromState"\][\s\S]+PendingInterfaceRefusalFor<R>/i);
  assert.match(ledger, /type PausedControl[\s\S]+state:\s*P\["state"\][\s\S]+pause:\s*P/i);
  assert.match(ledger, /type RunningControl[\s\S]+state:\s*A\["executionState"\][\s\S]+action:\s*A/i);
  assert.match(ledger, /type TerminalOutcome\s*=/i);
  assert.match(ledger, /type TerminalControl[\s\S]+state:\s*"COMPLETE"[\s\S]+state:\s*"STOP"/i);
  assert.match(engine, /acceptance:\s*ArtifactAcceptanceForRoute<R>/i);
  assert.match(engine, /resultReceiptHash[\s\S]+only `resultReceiptHash` omitted/i);
});
