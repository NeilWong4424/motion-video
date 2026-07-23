import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const block = (text, start, end) => {
  const value = new RegExp(`${start}([\\s\\S]*?)${end}`).exec(text)?.[1];
  assert.ok(value, `missing block ${start}`);
  return value;
};

test('artifact routes distribute candidate acceptance producer and schema by route ID', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const engine = read('agent/contracts/engine-interface.md');

  const contexts = block(decision, 'type AcceptanceContext\\s*=', ';\\n```');
  const rules = block(acceptance, 'type ArtifactRouteRule\\s*=', ';\\n\\ntype ArtifactRouteId');
  const contextIds = [...contexts.matchAll(/acceptanceRouteId:\s*"([^"]+)"/g)].map((m) => m[1]).sort();
  const ruleIds = [...rules.matchAll(/acceptanceRouteId:\s*"([^"]+)"/g)].map((m) => m[1]).sort();

  assert.deepEqual(ruleIds, contextIds);
  assert.ok(ruleIds.length >= 18);
  for (const row of rules.split('\n').filter((line) => line.includes('acceptanceRouteId:'))) {
    assert.match(row, /artifactKind:/);
    assert.match(row, /semanticProducer:/);
    assert.match(row, /expectedSchemaVersion:/);
  }
  assert.match(acceptance, /type ArtifactCandidateForRoute<R extends ArtifactRouteId>/);
  assert.match(acceptance, /\[R in ArtifactRouteId\]: ArtifactCandidateForRoute<R>/);
  assert.match(acceptance, /type ArtifactAcceptanceForRoute<R extends ArtifactRouteId>/);
  assert.match(acceptance, /\[R in ArtifactRouteId\]: ArtifactAcceptanceForRoute<R>/);
  assert.doesNotMatch(engine, /Extract<ArtifactAcceptance,\s*\{acceptanceContext:/);
  assert.match(engine, /acceptance:\s*ArtifactAcceptanceForRoute<R>/);
  assert.match(rules, /acceptanceRouteId:\s*"creative-review"[^\n]+expectedSchemaVersion:\s*"creative-review@1"/);
  assert.match(rules, /acceptanceRouteId:\s*"motion-review"[^\n]+expectedSchemaVersion:\s*"motion-review@1"/);
  assert.match(read('agent/reviewers/creative-reviewer.md'), /"schemaVersion":\s*"creative-review@1"/);
  assert.match(read('agent/reviewers/motion-reviewer.md'), /"schemaVersion":\s*"motion-review@1"/);
});

test('acceptance invocation and written role result cannot form state owner route cross-products', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const result = read('agent/contracts/role-result.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type AcceptanceProducerStateFor<R extends ArtifactRouteId>/);
  assert.match(decision, /\[R in ArtifactRouteId\][\s\S]+fromState:\s*AcceptanceProducerStateFor<R>[\s\S]+acceptanceRouteId:\s*R/);
  assert.match(decision, /artifactCandidate:\s*ArtifactCandidateForRoute<R\["acceptanceRouteId"\]>/);
  assert.match(result, /artifactCandidate:\s*AllowedArtifactCandidateForRoleRoute<R>/);
  assert.match(ledger, /type PendingArtifactForRoute<R extends ArtifactRouteId>/);
  assert.match(ledger, /candidate:\s*ArtifactCandidateForRoute<R>/);
  assert.match(ledger, /producerState:\s*AcceptanceProducerStateFor<R>/);
});

test('reconciliation applies recovered results and can recover its own pre-append crash without recursion', () => {
  const engine = read('agent/contracts/engine-interface.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  const found = block(engine, 'type MatchingResultReconciliationSuccess\\s*=', ';\\n\\ntype RetrySafe');
  assert.match(found, /continuationDisposition:\s*"apply-recovered-original-result"/);
  assert.match(found, /continuationState\?:\s*never/);
  assert.match(found, /artifactCandidate\?:\s*never/);
  assert.match(engine, /continuationDisposition:\s*"restore-original-running-action"/);
  assert.match(engine, /type ReconciliationSuccess\s*=\s*\n\s*\| MatchingResultReconciliationSuccess\n\s*\| RetrySafeAbsenceReconciliationSuccess/);
  assert.match(engine, /reconciliationReceiptHash[\s\S]+SHA-256[\s\S]+\{reconciledActionId, originState, reconciliation\}/i);
  assert.match(read('agent/contracts/workflow-decision.md'), /type ReconciliationInvocationDecisionFor<R extends ReconciliationInvocationRoute>[\s\S]+executionState:\s*R\["fromState"\]/i);
  assert.match(ledger, /action-result-reconciliation` is the sole sidecar exception/i);
  assert.match(ledger, /compare-and-appended directly without a pre-result sidecar/i);
  assert.match(ledger, /restores that identical `PendingInterfaceAction` to `running`/i);
  assert.match(ledger, /never invokes reconciliation-of-reconciliation/i);
});

test('pause unions and audio refusal repair routes preserve legal state-interface correlation', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(ledger, /type DeferredInterfacePauseFor<R extends NonAcceptanceInterfaceInvocationRoute>/);
  assert.match(ledger, /state:\s*R\["fromState"\][\s\S]+interfaceId:\s*R\["interfaceId"\]/);
  assert.match(ledger, /type ActionRecoveryPauseFor<A extends PendingAction>[\s\S]+state:\s*A\["executionState"\]/);
  assert.doesNotMatch(ledger, /kind:\s*"deferred-interface";[^\n]+state:\s*ResumableState;[^\n]+interfaceId:\s*WorkflowInterfaceId/);
  for (const route of [
    /fromState:\s*"OPTIONAL_LOCAL_MUX";\s*toState:\s*"AUDIO_BRIEF";\s*interfaceId:\s*"local-alignment-mux"/,
    /fromState:\s*"WAITING_FOR_MANUAL_MUSIC";\s*toState:\s*"AUDIO_BRIEF";\s*interfaceId:\s*"delivery-packager"/,
    /fromState:\s*"DELIVERY";\s*toState:\s*"AUDIO_BRIEF";\s*interfaceId:\s*"delivery-packager"/,
  ]) assert.match(decision, route);
});

test('durable inputs contain no host-native locator and host approval binds actual adapter identity', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  const manual = block(artifacts, 'type ManualAudioIngressRequest\\s*=\\s*\\{', '\\n\\};');
  assert.match(manual, /localAudioLocatorId:\s*SafeLocatorId/);
  assert.match(manual, /locatorEnvelopeHash:\s*string/);
  assert.doesNotMatch(manual, /localAudioLocator:\s*string/);
  assert.match(artifacts, /type EphemeralManualAudioLocatorEnvelope[\s\S]+localAudioLocator:\s*string/);
  const answer = block(ledger, 'type RequiredUserAnswer\\s*=\\s*\\{', '\\n\\};');
  assert.match(answer, /suppliedLocatorSetHash:\s*string\s*\|\s*null/);
  assert.doesNotMatch(answer, /suppliedLocalPaths/);
  assert.match(decision, /type HostId\s*=\s*"codex"\s*\|\s*"claude-code"/);
  assert.match(ledger, /trustedHostId:\s*HostId/);
  assert.match(engine, /trustedHostContext\.hostId\s*===\s*activeRequest\.trustedHostId/);
});

test('visual local assets carry explicit generation provenance before render eligibility', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  assert.match(acceptance, /type VisualGenerationDeclaration\s*=\s*"declared-non-ai"\s*\|\s*"declared-ai-generated"\s*\|\s*"unknown"\s*\|\s*"not-applicable"/);
  assert.match(acceptance, /type LocalSourceDeclaration[\s\S]+visualGeneration:\s*VisualGenerationDeclaration/);
  assert.match(acceptance, /type LocalAssetEntry[\s\S]+visualGeneration:\s*VisualGenerationDeclaration/);
  assert.match(acceptance, /render-image[\s\S]+eligible only with `declared-non-ai`/i);
  assert.match(acceptance, /never infers provenance from pixels or filenames/i);
});

test('completion and abandonment each have one atomic terminal reducer', () => {
  const engine = read('agent/contracts/engine-interface.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.doesNotMatch(ledger, /LedgerEvent<"request-completed"/);
  assert.doesNotMatch(ledger, /LedgerEvent<"request-abandoned"/);
  assert.match(engine, /interfaceId:\s*"delivery-packager"[\s\S]+terminalOutcome:\s*\{kind:\s*"completed"/);
  assert.match(ledger, /delivery-packager[\s\S]+sole completion reducer/i);
  assert.match(ledger, /operator-input-recorded[\s\S]+AbandonRequest[\s\S]+sole atomic transition/i);
});

test('temporary audio prompt absence always pauses and never terminally blocks', () => {
  const sound = read('craft/sound-design.md');
  assert.match(sound, /same-state deferred-interface pause in `AUDIO_PROMPT`/i);
  assert.match(sound, /never emits terminal `blocked` for temporary absence/i);
  assert.doesNotMatch(sound, /emits the sole blocked WorkflowDecision and stops/i);
});

test('prompt manifest explicitly inventories every non-prompt local resource', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const ids = manifest.resources.map(({id}) => id);
  assert.deepEqual(ids, [...ids].sort());
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, [
    'audio-handoff-procedure',
    'brief-input-template',
    'capability-gap-procedure',
    'core-capability-registry',
    'craft-skill-manifest',
    'local-source-declaration-template',
    'music-prompt-document',
    'project-policy-example',
    'revision-procedure',
    'revision-request-template',
  ]);
  for (const resource of manifest.resources) {
    assert.ok(existsSync(resolve(root, resource.path)), `missing manifest resource ${resource.path}`);
  }
});
