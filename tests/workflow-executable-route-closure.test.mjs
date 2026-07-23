import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('role actions bind their closed candidate routes before execution', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const result = read('agent/contracts/role-result.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type RoleDelegationRule\s*=/);
  assert.match(decision, /allowedAcceptanceRouteIds:/);
  assert.match(decision, /initial-capability-gap/);
  assert.match(decision, /rebuild-capability-gap/);
  assert.match(decision, /type AllowedArtifactCandidateForRoleRoute<R extends RoleDelegationRoute>/);
  assert.match(result, /artifactCandidate:\s*AllowedArtifactCandidateForRoleRoute<R>/);
  assert.match(ledger, /allowedAcceptanceRouteIds:\s*R\["allowedAcceptanceRouteIds"\]/);
  assert.match(ledger, /candidate route[^\n]+pending role action/i);
});

test('normal actions carry typed input identity and literal result routes', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type SafeAuditEvidenceId\s*=/);
  assert.match(decision, /evidenceRefs:\s*SafeAuditEvidenceId\[\]/);
  assert.doesNotMatch(decision, /evidenceRefs:\s*string\[\]/);
  assert.match(decision, /type ActionInvocationInputFor<R extends NormalActionRoute>/);
  assert.match(decision, /actionId:\s*ActionId/);
  assert.match(decision, /inputBindingHash:\s*Sha256/);
  assert.match(decision, /resultRouteId:\s*ResultRouteIdFor<R>/);
  assert.match(decision, /SHA-256[^\n]+RFC 8785|SHA-256[^\n]+JCS/i);
  assert.match(decision, /host-native locator[^\n]+never[^\n]+ActionInvocationInput|ActionInvocationInput[^\n]+never[^\n]+locator/i);
  assert.match(ledger, /invocationInput:\s*ActionInvocationInputFor<R>/);
});

test('same-action refusal retry has an exact restoring decision', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type RetryRefusedInterfaceDecisionFor<R extends SameInputRetryRoute>/);
  assert.match(decision, /decisionKind:\s*"retry-refused-interface"/);
  assert.match(decision, /refusedActionId:\s*ActionId/);
  assert.match(decision, /refusedResultReceiptHash:\s*Sha256/);
  assert.match(ledger, /restores the exact stored `PendingInterfaceAction`[^\n]+same action ID/i);
  assert.match(ledger, /does not allocate a new action/i);
});

test('refusal and reconciliation retain the complete original normal action', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(ledger, /type PendingNormalActionForExecutionState<S extends NormalActionExecutionState>/);
  assert.match(ledger, /type PendingInterfaceRefusalFor<R extends InterfaceRefusalRecoveryRoute>[\s\S]+originalAction:\s*PendingInterfaceActionForRecovery<R>/);
  assert.match(ledger, /type PendingReconciliationActionFor<R extends ReconciliationInvocationRoute>[\s\S]+originalAction:\s*PendingNormalActionForExecutionState<R\["fromState"\]>/);
  assert.match(decision, /type ReconciliationActionInvocationInputFor<R extends ReconciliationInvocationRoute>[\s\S]+originalAction:\s*PendingNormalActionForExecutionState<R\["fromState"\]>/);
  assert.match(engine, /type RecoveredResultBindingFor<S extends NormalActionExecutionState>[\s\S]+originalAction:\s*PendingNormalActionForExecutionState<S>/);
  assert.match(engine, /retryAuthorization:[\s\S]+originalAction:\s*PendingNormalActionForExecutionState<S>/);
});

test('acceptance and reconciliation expose only reachable invocation routes', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.doesNotMatch(decision, /RetryArtifactAcceptanceInvocationRoute|retained-candidate-retry/);
  assert.match(decision, /type ArtifactAcceptanceInvocationRoute\s*=\s*InitialArtifactAcceptanceInvocationRoute/);
  assert.match(decision, /type NormalActionExecutionState\s*=/);
  assert.match(decision, /\[S in NormalActionExecutionState\]:\s*\{fromState:\s*S;/);
  assert.doesNotMatch(decision, /\[S in ResumableState\]:\s*\{fromState:\s*S;\s*toState:\s*S;\s*interfaceId:\s*"action-result-reconciliation"/);
  assert.match(engine, /\[S in NormalActionExecutionState\]:\s*\{/);
});

test('capability route decisions and implementation actions are context-discriminated', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type CapabilityGapRouteBindingFor<[\s\S]+decision:\s*D/);
  assert.doesNotMatch(decision, /WorkflowDecisionBase[\s\S]{0,500}capabilityGapRoute:\s*CapabilityGapRouteBinding\s*\|\s*null/);
  assert.match(decision, /type CapabilityGapDeclineDecision/);
  assert.match(decision, /decision:\s*"decline"[\s\S]+fromState:\s*"CAPABILITY_GAP"[\s\S]+toState:\s*"STOP"/);
  assert.match(decision, /project-local-capability-implementation-and-registration";\s*originPlanningContext:\s*Extract<OriginPlanningContext,\s*\{kind:\s*"initial"\}>/);
  assert.match(decision, /project-local-capability-implementation-and-registration";\s*originPlanningContext:\s*Extract<OriginPlanningContext,\s*\{kind:\s*"rebuild"\}>/);
  assert.match(ledger, /capability gap route decision[\s\S]+decline[^\n]+terminal/i);
});

test('interface actions bind the exact route-owned operator input kind', () => {
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(decision, /type OperatorInputEventBindingFor<R extends NormalInterfaceInvocationRoute>/);
  for (const kind of [
    'local-source-ingress-request',
    'project-policy-ingress-request',
    'capability-implementation-authorization',
    'preview-gate-decision',
    'manual-audio-ingress-request',
    'no-track-selection',
  ]) assert.match(decision, new RegExp(`inputKind: "${kind}"`));
  assert.doesNotMatch(decision, /operatorInputEventHash:\s*Sha256\s*\|\s*null/);
});

test('refusal result routes remain exact through checkpoint and retry', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(decision, /type ResultRouteIdForRecovery<R extends InterfaceRefusalRecoveryRoute>/);
  assert.match(ledger, /resultRouteId:\s*ResultRouteIdForRecovery<R>/);
  assert.doesNotMatch(ledger, /type PendingInterfaceRefusalFor<R extends InterfaceRefusalRecoveryRoute>[\s\S]{0,500}resultRouteId:\s*string/);
  assert.match(decision, /refusedResultRouteId:\s*ResultRouteIdForRecovery<R>/);
  assert.match(engine, /resultRouteId:\s*ResultRouteIdForRecovery<R>/);
});

test('pause and abandonment each have one reducer event', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.doesNotMatch(ledger, /PauseRecordedPayload|LedgerEvent<"pause-recorded"/);
  assert.match(ledger, /decision-recorded[^\n]+sole[^\n]+pause reducer/i);
  assert.match(decision, /blocked[^\n]+never[^\n]+abandon/i);
  assert.doesNotMatch(decision, /`blocked`[^\n]+explicitly abandoned request/i);
  assert.match(ledger, /AbandonRequest[^\n]+sole abandonment reducer/i);
});

test('mixed master is retained through mux and delivery lineage', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(ledger, /muxManifestHash:\s*string\s*\|\s*null;\s*\n\s*mixedMasterHash:\s*string\s*\|\s*null;/);
  assert.match(ledger, /local-alignment-mux[^\n]+mixedMasterHash[^\n]+checkpoint/i);
  assert.match(ledger, /delivery-packager[^\n]+mixedMasterHash/i);
  assert.match(engine, /local-alignment-mux[^\n]+mixedMasterHash/);
});

test('acceptance deferral pauses in the candidate producer state', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(ledger, /type ArtifactAcceptancePauseFor<R extends ArtifactRouteId>/);
  assert.match(ledger, /state:\s*AcceptanceProducerStateFor<R>/);
  assert.match(ledger, /acceptanceRouteId:\s*R/);
  assert.match(decision, /P extends \{kind: "artifact-acceptance"\} \? "artifact-validation-and-hashing"/);
  assert.match(ledger, /restores[^\n]+candidate-ready[^\n]+producer state/i);
});

test('deferred validator routes retain their exact disposition and target', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  assert.match(ledger, /type DeferredInvocationCorrelationFor<R extends NonAcceptanceInterfaceInvocationRoute>/);
  assert.match(ledger, /validationDisposition:\s*V/);
  assert.match(ledger, /declaredInvocationToState:\s*R\["toState"\]/);
  assert.match(ledger, /type DeferredInterfaceRetryFor<P extends DeferredInterfacePause>/);
});

test('reconciler self-recovery never allocates reconciliation of reconciliation', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const workflow = read('agent/video-workflow.md');

  assert.match(ledger, /ordinary pending action[^\n]+invoke[^\n]+action-result-reconciliation/i);
  assert.match(ledger, /pending action is itself `action-result-reconciliation`[^\n]+restore/i);
  assert.match(workflow, /ordinary role or non-reconciliation interface[^\n]+running[^\n]+action-result-reconciliation/i);
  assert.match(workflow, /running reconciler[^\n]+same recorded action/i);
  assert.match(workflow, /never[^\n]+reconciliation-of-reconciliation/i);
});

test('declared catalog policy and resolver failures have constructible refusal routes', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const diagnostics = read('agent/contracts/diagnostics.md');

  for (const route of ['catalog-registry-repair', 'project-policy-request-repair', 'resolver-capability-repair']) {
    assert.match(decision, new RegExp(`diagnosticRouteId: "${route}"`));
    assert.match(diagnostics, new RegExp(`"${route}"`));
  }
  assert.match(diagnostics, /CATALOG_REGISTRY_INVALID:\s*"catalog-registry-repair"/);
  assert.match(diagnostics, /PROJECT_POLICY_REQUEST_INVALID:\s*"project-policy-request-repair"/);
  assert.match(diagnostics, /RESOLVER_CAPABILITY_UNAVAILABLE:\s*"resolver-capability-repair"/);
});

test('capability gaps and receipts round-trip to their initial or rebuild planning context', () => {
  const gap = read('agent/contracts/capability-gap-contract.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  assert.match(gap, /type OriginPlanningContext\s*=/);
  assert.match(gap, /kind:\s*"initial"[\s\S]+resumeState:\s*"MOTION_SPEC"/);
  assert.match(gap, /kind:\s*"rebuild"[\s\S]+resumeState:\s*"REBUILD_AUTHORING"/);
  assert.match(gap, /originPlanningContext:\s*OriginPlanningContext/);
  for (const route of [
    'initial-capability-gap',
    'rebuild-capability-gap',
    'initial-capability-receipt',
    'rebuild-capability-receipt',
  ]) {
    assert.match(decision, new RegExp(`acceptanceRouteId: "${route}"`));
    assert.match(acceptance, new RegExp(`acceptanceRouteId: "${route}"`));
  }
  assert.match(ledger, /activeCapabilityGap:[\s\S]+originPlanningContext:\s*OriginPlanningContext/);
  assert.match(ledger, /kind:\s*"capability-gap-route"[\s\S]+originPlanningContext:\s*OriginPlanningContext/);
  assert.match(ledger, /type CapabilityImplementationAuthorization[\s\S]+originPlanningContext:\s*OriginPlanningContext/);
  assert.match(acceptance, /type CapabilityImplementationReceipt[\s\S]+originPlanningContext:\s*OriginPlanningContext/);
  assert.match(decision, /initial-capability-receipt[^\n]+successState:\s*"MOTION_SPEC"/);
  assert.match(decision, /rebuild-capability-receipt[^\n]+successState:\s*"REBUILD_AUTHORING"/);
});

test('validation success embeds a closed hashable receipt instead of a naked hash', () => {
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(engine, /type ValidationReceiptFor<D extends ValidationDisposition>/);
  assert.match(engine, /schemaVersion:\s*"validation-receipt@1"/);
  assert.match(engine, /inputParentBindings:/);
  assert.match(engine, /validatedSourceIdentities:/);
  assert.match(engine, /decision:\s*"pass"/);
  assert.match(engine, /type ValidationSuccess\s*=/);
  assert.match(engine, /validationReceipt:\s*ValidationReceiptFor<D>/);
  assert.match(engine, /validationReceiptHash[^\n]+SHA-256[^\n]+JCS/i);
  assert.doesNotMatch(engine, /\{interfaceId: "canonical-source-hashing-and-validation"; validationDisposition:/);
});

test('reconciliation output defines its second receipt hash projection', () => {
  const engine = read('agent/contracts/engine-interface.md');
  assert.match(engine, /reconciliationReceiptHash/);
  assert.match(engine, /SHA-256[^\n]+\{reconciledActionId, originState, reconciliation\}/i);
  assert.match(engine, /not a file or self-hash/i);
});
