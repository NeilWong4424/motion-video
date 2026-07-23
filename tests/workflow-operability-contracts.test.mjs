import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('one generic acceptance contract closes canonical JSON and every role artifact kind', () => {
  const contract = read('agent/contracts/artifact-acceptance.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));

  assert.ok(manifest.contracts.includes('agent/contracts/artifact-acceptance.md'));
  assert.match(contract, /RFC 8785|JSON Canonicalization Scheme/i);
  assert.match(contract, /UTF-8[\s\S]+no BOM or trailing newline/i);
  assert.match(contract, /SHA-256[\s\S]+raw lowercase 64-hex/i);
  assert.match(contract, /Semantic producers author and supply immutable canonical candidate bytes[\s\S]+Acceptance owns only mechanical validation/i);
  for (const kind of [
    'local-asset-manifest', 'research-findings', 'brief', 'treatment',
    'motion-spec', 'capability-gap', 'semantic-patch', 'creative-review',
    'motion-review', 'audio-brief', 'capability-implementation-receipt',
  ]) {
    assert.match(contract, new RegExp(`"${kind}"`), `missing accepted artifact kind ${kind}`);
  }
  assert.match(contract, /type ArtifactCandidate/);
  assert.match(contract, /type ArtifactAcceptance/);
  assert.match(contract, /expectedParentBindings[\s\S]+observedParentBindings/i);
  assert.match(contract, /route-mapped discriminated unions[\s\S]+artifactKind[\s\S]+context[\s\S]+ordered parent tuple/i);
});

test('append-only ledger makes revision locks counters and pauses recoverable', () => {
  const contract = read('agent/contracts/workflow-ledger.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));

  assert.ok(manifest.contracts.includes('agent/contracts/workflow-ledger.md'));
  assert.match(contract, /projects\/<project-id>\/\.workflow\/ledger\.jsonl/);
  assert.match(contract, /workflow-ledger-recorder[\s\S]+sole writer/i);
  assert.match(contract, /append-only/i);
  assert.match(contract, /previousEventHash[\s\S]+eventHash/);
  assert.match(contract, /compare-and-append|compare and append/i);
  for (const field of [
    'WorkflowControl', 'currentRevisionId', 'sourceHashes', 'lockSetHash',
    'repairCycleId', 'structuralRepairCount', 'visualRepairCount',
    'kind: "paused"', 'pendingArtifact', 'invalidatedContentHashes',
  ]) {
    assert.match(contract, new RegExp(field), `ledger checkpoint lacks ${field}`);
  }
  assert.match(contract, /projects\/<project-id>\/revisions\/<revision-id>\/revision\.manifest\.json/);
  assert.match(contract, /projects\/<project-id>\/revisions\/<revision-id>\/locks\.json/);
  assert.match(contract, /Every normal role\/interface decision[\s\S]+recorded before execution/i);
  assert.match(contract, /project-initialized[\s\S]+invocation-received[\s\S]+first head-bound decision/i);
});

test('workflow decisions bind the ledger and route each candidate through acceptance', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(contract, /expectedLedgerHeadHash:\s*Sha256\s*\|\s*null/);
  assert.match(contract, /requestId:\s*string/);
  assert.match(contract, /"ARTIFACT_ACCEPTANCE"/);
  assert.match(contract, /"artifact-validation-and-hashing"/);
  assert.match(contract, /artifactCandidate:\s*ArtifactCandidateForRoute/);
  assert.match(engine, /Workflow ledger recorder/);
  assert.match(engine, /Artifact validation and hashing/);
  assert.match(contract, /type AcceptanceProducerStateFor<R extends ArtifactRouteId>[\s\S]+CandidateRejectionContinuation/i);
  assert.match(contract, /type InitialArtifactAcceptanceInvocationRoute\s*=\s*\{[\s\S]+\[R in ArtifactRouteId\]/i);
  assert.match(contract, /artifactKind[\s\S]+"brief"[\s\S]+toState:\s*"TREATMENT"/i);
  assert.match(contract, /artifactKind[\s\S]+"treatment"[\s\S]+toState:\s*"MOTION_SPEC"/i);
  assert.match(contract, /artifactKind[\s\S]+"motion-spec"[\s\S]+toState:\s*"VALIDATE"/i);
});

test('new-project flow accepts each artifact before the downstream role', () => {
  const workflow = read('agent/video-workflow.md');
  const result = read('agent/contracts/role-result.md');

  assert.match(workflow, /BRIEF --Brief Planner--> Brief candidate → acceptance\(initial-brief\) → TREATMENT[\s\S]+TREATMENT --Creative Direction--> Treatment candidate → acceptance\(initial-treatment\) → MOTION_SPEC[\s\S]+MOTION_SPEC --Motion Planner--> MotionSpec candidate → acceptance\(initial-motion-spec\) → VALIDATE/i);
  assert.match(workflow, /role[\s\S]+trusted candidate writer[\s\S]+RoleResult[^\n]+written[\s\S]+artifact-validation-and-hashing/i);
  assert.match(result, /`written` proves only that the trusted candidate writer persisted[\s\S]+must externally accept/i);
  assert.doesNotMatch(result, /status:\s*"awaiting-interface"/i);

  for (const path of [
    'agent/prompts/researcher.md',
    'agent/prompts/brief-planner.md',
    'agent/prompts/creative-direction.md',
    'agent/prompts/motion-planner.md',
    'agent/prompts/revision-interpreter.md',
    'agent/reviewers/creative-reviewer.md',
    'agent/reviewers/motion-reviewer.md',
    'agent/prompts/sound-designer.md',
  ]) {
    const prompt = read(path);
    assert.match(prompt, /return `?written`?|status:\s*"written"/i, `${path} lacks written draft handoff`);
    assert.match(prompt, /artifact-validation-and-hashing/i, `${path} lacks acceptance handoff`);
  }
});

test('review identity comes from external acceptance rather than a self hash', () => {
  const review = read('agent/contracts/review-contract.md');
  const envelope = /type ReviewEnvelope\s*=\s*\{([\s\S]*?)\n\};/.exec(review)?.[1] ?? '';

  assert.ok(envelope);
  assert.doesNotMatch(envelope, /^\s*contentHash:/m);
  assert.doesNotMatch(envelope, /promptContentHash/);
  assert.match(review, /ArtifactAcceptance[\s\S]+reviewContentHash|reviewContentHash[\s\S]+ArtifactAcceptance/i);
});

test('operator pauses have exact resumable input variants', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const workflow = read('agent/video-workflow.md');

  for (const type of [
    'PreviewGateDecision', 'ManualAudioIngressRequest', 'NoTrackSelection',
    'CapabilityImplementationAuthorization',
  ]) {
    assert.match(ledger, new RegExp(type), `missing operator input ${type}`);
  }
  assert.match(workflow, /preview response[\s\S]+Preview Gate pause[\s\S]+recorder stage/i);
  assert.match(workflow, /ManualAudioIngressRequest[\s\S]+manual-audio-ingress → OPTIONAL_LOCAL_MUX/i);
  assert.match(workflow, /NoTrackSelection[\s\S]+delivery-packager → COMPLETE/i);
  assert.match(workflow, /capability authorization[\s\S]+authorized implementation interface → receipt acceptance → Motion Planner/i);
  assert.match(workflow, /acceptance retry[\s\S]+acceptance only/i);
});

test('missing policy resolves to deterministic human-only authority without auto approval', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const engine = read('agent/contracts/engine-interface.md');
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(artifacts, /type EffectivePolicyBinding/);
  assert.match(artifacts, /implicit-human-only/);
  assert.match(artifacts, /hostOptIn[\s\S]+enabled:\s*false[\s\S]+allowedHostIds:\s*\[\]/i);
  assert.match(artifacts, /implicit[\s\S]+does not[\s\S]+approv/i);
  assert.match(engine, /missing[\s\S]+policy[\s\S]+human[\s\S]+implicit-human-only/i);
  assert.match(engine, /Host approval requires[\s\S]+accepted explicit policy[\s\S]+TrustedHostContext\.hostId[\s\S]+activeRequest\.trustedHostId/i);
  assert.match(decision, /ArtifactRouteId[\s\S]+AcceptanceProducerStateFor[\s\S]+toState: "ARTIFACT_ACCEPTANCE"/i);
  assert.match(decision, /artifactKind: "project-policy"[\s\S]+toState: "PREVIEW_GATE"/i);
});

test('local asset manifest closes staged bytes rights and all asset IDs', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const source = read('agent/contracts/role-artifact-contracts.md');
  const motion = read('agent/contracts/motion-spec-contract.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(acceptance, /type LocalAssetManifest/);
  for (const field of [
    'assetId', 'stagedPath', 'contentHash', 'kind', 'visualGeneration', 'rightsStatus',
    'rightsHolder', 'rightsEvidence', 'allowedUses', 'requestedUses',
    'attribution', 'useLimits', 'useStatus',
  ]) {
    assert.match(acceptance, new RegExp(field), `asset manifest lacks ${field}`);
  }
  assert.match(engine, /Local source ingress/);
  assert.match(source, /ResearchSource[\s\S]+assetId/);
  assert.match(source, /BriefSpec[\s\S]+assetManifestHash/);
  assert.match(motion, /MotionSpec[\s\S]+assetManifestHash/);
  assert.match(source, /suppliedAssetIds[\s\S]+resolves to exactly one eligible entry[\s\S]+LocalAssetManifest/i);
});

test('capability implementation receipt binds the stopped gap before MotionSpec resumes', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(acceptance, /type CapabilityImplementationReceipt/);
  for (const field of [
    'gapContentHash', 'routeDecisionHash', 'advisoryResultReceiptHash',
    'implementationAuthorizationHash', 'exactFileManifest',
    'testReportEvidence', 'registrationReceiptEvidence', 'registrySnapshotEvidence',
  ]) {
    assert.match(acceptance, new RegExp(field), `implementation receipt lacks ${field}`);
  }
  assert.match(ledger, /WAITING_FOR_CAPABILITY_IMPLEMENTATION[\s\S]+CapabilityImplementationAuthorization[\s\S]+exactFileManifest/i);
});
