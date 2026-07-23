import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('resumable waits preserve their origin state and have closed resume inputs', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /decisionKind:\s*"pause"[\s\S]+status:\s*"paused"/i);
  assert.match(decision, /fromState:\s*P\["state"\][\s\S]+toState:\s*P\["state"\]/i);
  assert.match(decision, /decisionKind:\s*"needs-user"[\s\S]+toState:\s*P\["state"\]/i);
  assert.doesNotMatch(decision, /decisionKind:\s*"needs-user"[\s\S]{0,500}toState:\s*"STOP"/i);
  for (const kind of [
    'required-user-answer',
    'artifact-acceptance-retry',
    'deferred-interface-retry',
    'action-recovery-request',
  ]) {
    assert.match(ledger, new RegExp(kind), `missing resumable input ${kind}`);
  }
  assert.match(ledger, /kind:\s*"paused"[\s\S]+pause:\s*WorkflowPause/i);
  assert.match(ledger, /type TerminalControl[\s\S]+state:\s*"COMPLETE"[\s\S]+kind:\s*"completed"[\s\S]+state:\s*"STOP"[\s\S]+Exclude<TerminalOutcome/i);
});

test('acceptance continuation and action interfaces have one non-bypass route', () => {
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(decision, /type AcceptanceContext\s*=/i);
  assert.match(decision, /acceptanceRouteId/i);
  assert.doesNotMatch(decision, /type ArtifactAcceptanceAdvanceRoute\s*=/i);
  assert.doesNotMatch(decision, /fromState:\s*"ARTIFACT_ACCEPTANCE"[\s\S]{0,140}interfaceId:\s*"(?:canonical-source-hashing-and-validation|semantic-revision-apply|audio-prompt-generator)"/i);
  assert.match(decision, /fromState:\s*"APPLY_SEMANTIC_REVISION"[\s\S]+toState:\s*"VALIDATE"[\s\S]+interfaceId:\s*"semantic-revision-apply"/i);
  assert.match(decision, /fromState:\s*"AUDIO_PROMPT"[\s\S]+toState:\s*"WAITING_FOR_MANUAL_MUSIC"[\s\S]+interfaceId:\s*"audio-prompt-generator"/i);
  assert.doesNotMatch(decision, /fromState:\s*"MOTION_SPEC";\s*toState:\s*"CAPABILITY_GAP"/i);
});

test('artifact-owning roles execute in their stage and acceptance selects the next stage', () => {
  const decision = read('agent/contracts/workflow-decision.md');

  for (const [state, role] of [
    ['BRIEF', 'brief-planner'],
    ['TREATMENT', 'creative-direction'],
    ['MOTION_SPEC', 'motion-planner'],
    ['REVISION_INTERPRET', 'revision-interpreter'],
    ['AUDIO_BRIEF', 'sound-designer'],
  ]) {
    assert.match(decision, new RegExp(`fromState: "${state}"; toState: "${state}"; delegatedRole: "${role}"`, 'i'));
  }
  assert.match(decision, /acceptanceRouteId:\s*"initial-brief"[\s\S]+successState:\s*"TREATMENT"/i);
  assert.match(decision, /acceptanceRouteId:\s*"initial-treatment"[\s\S]+successState:\s*"MOTION_SPEC"/i);
  assert.match(decision, /acceptanceRouteId:\s*"initial-motion-spec"[\s\S]+successState:\s*"VALIDATE"/i);
});

test('structural rebuild is owner-authored and contains no replacement payloads', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const interpreter = read('agent/prompts/revision-interpreter.md');

  for (const forbidden of ['replace-brief', 'replace-treatment', 'replace-motion-spec']) {
    assert.doesNotMatch(revision, new RegExp(forbidden));
    assert.doesNotMatch(interpreter, new RegExp(forbidden));
  }
  assert.match(revision, /type RebuildSemanticPatch/i);
  assert.match(revision, /rebuildFrom:\s*"brief"\s*\|\s*"treatment"\s*\|\s*"motion-spec"/i);
  assert.match(revision, /operations\?:\s*never/i);
  assert.match(revision, /replacement(?:Brief|Treatment|MotionSpec)?\w*\?:\s*never|replacement payloads?[^\n]+forbidden/i);
  assert.match(decision, /"REBUILD_AUTHORING"/);
  for (const [route, role] of [
    ['rebuild-brief', 'brief-planner'],
    ['rebuild-treatment', 'creative-direction'],
    ['rebuild-motion-planning', 'motion-planner'],
  ]) {
    assert.match(decision, new RegExp(`roleRouteId: "${route}"[^\\n]+fromState: "REBUILD_AUTHORING"[^\\n]+delegatedRole: "${role}"`));
  }
  assert.match(ledger, /type ActiveRevisionAttempt/i);
  assert.match(ledger, /kind:\s*"structural-rebuild"[\s\S]+stage:\s*"brief"\s*\|\s*"treatment"\s*\|\s*"motion-spec"\s*\|\s*"validate"\s*\|\s*"commit"/i);
  assert.match(ledger, /acceptedCandidates/i);
});

test('rebuild candidates are immutable and the current revision changes only at commit', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  for (const artifact of ['brief.spec.json', 'treatment.json', 'motion.spec.json']) {
    assert.match(revision, new RegExp(`\\.workflow/candidates/<revision-attempt-id>/.+${artifact.replaceAll('.', '\\.')}`));
  }
  assert.match(ledger, /currentRevisionId[\s\S]+must not change[\s\S]+commit/i);
  assert.match(ledger, /createdBy:[\s\S]+kind:\s*"structural-rebuild"[\s\S]+ownerAcceptanceHashes/i);
  assert.match(acceptance, /`rebuild-brief`[\s\S]+`rebuild-treatment`[\s\S]+`rebuild-motion-spec`/i);
});

test('PreviewApproval identity is external and never hashes itself', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(artifacts, /PreviewApproval@1[\s\S]+does not contain[\s\S]+(?:previewApprovalHash|contentHash)/i);
  assert.match(artifacts, /external[\s\S]+previewApprovalHash[\s\S]+SHA-256/i);
  assert.match(engine, /previewApprovalHash[\s\S]+external/i);
  assert.doesNotMatch(artifacts, /PreviewApproval@1[^\n]+adds its own `previewApprovalHash`/i);
});

test('written RoleResult carries the exact nullable ordered ArtifactCandidate', () => {
  const result = read('agent/contracts/role-result.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  assert.match(result, /status:\s*"written"[\s\S]+artifactCandidate:\s*AllowedArtifactCandidateForRoleRoute<R>/i);
  assert.doesNotMatch(result, /expectedBindings:\s*Record<string,\s*string>/i);
  assert.match(acceptance, /type ArtifactParentSet\s*=/i);
  assert.match(acceptance, /Parent<N extends string, H extends string \| null = string>/i);
  assert.match(acceptance, /exact ordered tuple|ordered tuple/i);
  assert.match(acceptance, /artifactKind:\s*"research-findings"; expectedParentBindings:\s*\[Parent<"localAssetManifestHash">\]/i);
  assert.match(acceptance, /ResearchFindings always has a non-null accepted LocalAssetManifest parent/i);
});

test('ledger events control and interrupted-action recovery are closed', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(ledger, /type WorkflowLedgerEvent\s*=[\s\S]+LedgerEvent<"decision-recorded"/i);
  assert.doesNotMatch(ledger, /payload:\s*object/);
  assert.match(ledger, /stateAfter[\s\S]+deterministic reducer[\s\S]+must not trust/i);
  assert.match(ledger, /type WorkflowControl\s*=/i);
  for (const kind of ['ready', 'running', 'candidate-ready', 'refusal-ready', 'paused', 'terminal']) {
    assert.match(ledger, new RegExp(`kind: "${kind}"`));
  }
  assert.match(ledger, /action-result-reconciliation[\s\S]+same decision hash, action ID, input-binding hash, and literal result route/i);
});

test('review attempts bind the execution-time prompt and use immutable paths', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const review = read('agent/contracts/review-contract.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  assert.match(decision, /promptBinding:\s*\{promptPath:\s*string;\s*promptHash:\s*string\}/i);
  assert.match(review, /reviews\/<review-kind>\/<review-attempt-id>\/review\.json/i);
  assert.match(review, /incomplete[\s\S]+new immutable attempt/i);
  assert.match(acceptance, /producerPromptHash[\s\S]+delegation[\s\S]+before[\s\S]+role/i);
});

test('capability implementation has exact human authorization and receipt evidence', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(ledger, /type CapabilityImplementationAuthorization/i);
  assert.match(ledger, /exactFileManifest[\s\S]+actor[\s\S]+reason/i);
  assert.match(acceptance, /authorizationHash/i);
  assert.match(acceptance, /producer:\s*\{[\s\S]+interfaceId:\s*"project-local-capability-implementation-and-registration"[\s\S]+interfaceVersion/i);
  for (const name of ['intentSchemaEvidence', 'resolvedSchemaEvidence', 'fixtureManifestEvidence', 'testReportEvidence', 'performanceReportEvidence', 'registrationReceiptEvidence', 'registrySnapshotEvidence']) {
    assert.match(acceptance, new RegExp(`${name}: \\{path: string; contentHash: string\\}`));
  }
  assert.match(motion, /capabilityRegistryBinding[\s\S]+registrySnapshotHash[\s\S]+implementationBindingHashes[\s\S]+acceptedImplementationReceiptHashes/i);
});

test('post-snapshot source and manual audio ingress are safe and reachable', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /"REVISION_SOURCE_UPDATE"/);
  assert.match(decision, /fromState:\s*"REVISION_SOURCE_UPDATE"[\s\S]+interfaceId:\s*"local-source-ingress"/i);
  assert.match(decision, /interfaceId:\s*"manual-audio-ingress"/i);
  assert.match(artifacts, /type ManualAudioIngressRequest/i);
  assert.match(artifacts, /type ManualAudioReturn[\s\S]+stagedTrackPath[\s\S]+trackContentHash[\s\S]+actor[\s\S]+rights/i);
  assert.match(ledger, /ManualAudioIngressRequest/);
});

test('assets carry machine-checkable use rights and Brief facts have exact provenance', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const source = read('agent/contracts/role-artifact-contracts.md');
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(acceptance, /type AssetUse\s*=/i);
  assert.match(acceptance, /allowedUses:\s*AssetUse\[\]/i);
  assert.match(acceptance, /requestedUses:\s*AssetUse\[\]/i);
  assert.match(acceptance, /kind\/use compatibility|kind.+use.+compatibility/is);
  assert.match(source, /type VerifiedFactSource\s*=/i);
  assert.match(source, /kind:\s*"user-statement"[\s\S]+sourceEventHash[\s\S]+verbatimText/i);
  assert.match(source, /kind:\s*"research-finding"[\s\S]+researchFindingsHash[\s\S]+findingId/i);
  assert.match(motion, /render-use|renderable use|requestedUses/i);
});

test('interface inventory and full music prompt bytes are exhaustive', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const ids = new Set(manifest.interfaces.map((entry) => entry.id));
  for (const id of [
    'workflow-ledger-recorder', 'trusted-candidate-writer', 'local-source-ingress', 'artifact-validation-and-hashing',
    'canonical-source-hashing-and-validation', 'initial-snapshot', 'semantic-revision-apply',
    'resolver-compiler', 'preview-evidence-renderer', 'technical-qc', 'approval-recorder',
    'silent-final-renderer', 'audio-prompt-generator', 'manual-audio-ingress',
    'local-alignment-mux', 'delivery-packager',
  ]) {
    assert.ok(ids.has(id), `manifest missing interface ${id}`);
  }

  const template = read('agent/templates/music-prompt-document.md');
  assert.match(template, /exact complete file skeleton/i);
  assert.match(template, /first byte[\s\S]+final LF/i);
  assert.match(template, /parentHashes:\s*\{[\s\S]+audioBriefHash[\s\S]+previewApprovalHash[\s\S]+renderManifestHash[\s\S]+silentMasterHash/i);
});

test('all role craft loading starts from the machine-readable manifest', () => {
  for (const path of [
    'agent/prompts/brief-planner.md',
    'agent/prompts/researcher.md',
    'agent/prompts/creative-direction.md',
    'agent/prompts/motion-planner.md',
    'agent/prompts/revision-interpreter.md',
    'agent/prompts/sound-designer.md',
    'agent/reviewers/creative-reviewer.md',
    'agent/reviewers/motion-reviewer.md',
  ]) {
    const text = read(path);
    const manifestIndex = text.indexOf('craft/skill-manifest.json');
    const indexIndex = text.indexOf('craft/index.md');
    assert.ok(manifestIndex >= 0, `${path} omits craft manifest`);
    assert.ok(indexIndex < 0 || manifestIndex < indexIndex, `${path} reads craft index first`);
  }
});

test('audio re-entry cannot bypass approval and locked-picture production', () => {
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(decision, /type AudioReentrySourceState\s*=\s*"COMPLETE"\s*\|\s*"STOP"/i);
  assert.match(decision, /requestClass:\s*"audio-request"[\s\S]+requiredLockedPictureTupleHash:\s*string/i);
  assert.doesNotMatch(decision, /requestClass:\s*"audio-request"; fromState:[^\n]+"PREVIEW_GATE"/i);
  assert.match(decision, /PREVIEW_GATE[^\n]+never sufficient/i);
});

test('interface success and acceptance are type-correlated closed unions', () => {
  const engine = read('agent/contracts/engine-interface.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(engine, /type InterfaceSuccessRoute\s*=/i);
  assert.match(engine, /type OutputBinding<N extends string>/i);
  assert.doesNotMatch(engine, /outputBindings:\s*\{name:\s*string;\s*contentHash:\s*string\}\[\]/i);
  assert.match(engine, /interfaceId:\s*"audio-prompt-generator"[^\n]+OutputBinding<"promptAttemptHash">[^\n]+continuationState:\s*"WAITING_FOR_MANUAL_MUSIC"/i);
  assert.match(engine, /CapabilityImplementationSuccess[\s\S]+artifactCandidate:\s*ArtifactCandidateForRoute<"initial-capability-receipt">[\s\S]+artifactCandidate:\s*ArtifactCandidateForRoute<"rebuild-capability-receipt">/i);
  assert.match(acceptance, /type ArtifactCandidateForRoute<R extends ArtifactRouteId>/i);
  assert.match(acceptance, /type ArtifactAcceptanceForRoute<R extends ArtifactRouteId>/i);
  assert.match(acceptance, /observedParentBindings:\s*Extract<ArtifactParentSet,\s*\{artifactKind:\s*ArtifactRouteRuleFor<R>\["artifactKind"\]\}>/i);
  assert.doesNotMatch(decision, /"BOUNDED_FIX"/);
  assert.match(decision, /fromState:\s*"WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState:\s*"WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId:\s*"project-local-capability-implementation-and-registration"/i);
});

test('Capability Builder advisory has a closed proposal payload', () => {
  const result = read('agent/contracts/role-result.md');

  assert.match(result, /type ProjectLocalCapabilityProposal<C extends OriginPlanningContext>\s*=\s*\{/i);
  assert.match(result, /futureExactFileManifest:\s*\[CapabilityAuthorizedFile,\s*\.\.\.CapabilityAuthorizedFile\[\]\]/i);
  assert.match(result, /nonCanonicalPayload:\s*ProjectLocalCapabilityProposal/i);
  assert.doesNotMatch(result, /nonCanonicalPayload:\s*Record<string,\s*unknown>/i);
});

test('human resume inputs bind the exact current pause', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');

  assert.match(ledger, /type PreviewGateDecision[\s\S]+pauseId:\s*string/i);
  assert.match(ledger, /type CapabilityImplementationAuthorization[\s\S]+pauseId:\s*string/i);
  assert.match(ledger, /type NoTrackSelection[\s\S]+pauseId:\s*string/i);
  assert.match(artifacts, /type ManualAudioIngressRequest[\s\S]+pauseId:\s*string/i);
});
