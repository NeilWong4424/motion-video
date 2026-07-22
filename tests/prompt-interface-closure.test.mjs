import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('MotionSpec maps every semantic time reference to one global half-open frame timeline', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');
  for (const term of [
    'segmentId',
    'cumulative',
    'half-open',
    'bridgeRange',
    'boundaryAt',
    'sourceFocalNodeId',
    'destinationFocalNodeId',
    'eyeTrace',
  ]) {
    assert.match(contract, new RegExp(term, 'i'), `Missing deterministic timeline term: ${term}`);
  }
  assert.match(contract, /resolveBoundary\(ref\)[\s\S]+segmentStartFrame[\s\S]+floor/i);
  assert.match(contract, /bridgeRange[\s\S]+durationFrames[\s\S]+equal|bridgeRange[\s\S]+length[\s\S]+equal[\s\S]+durationFrames/i);
  assert.match(contract, /camera[\s\S]+range[\s\S]+cover[\s\S]+complete.+film timeline/i);
  assert.match(contract, /(?:without gaps|gap-free)/i);
  assert.match(contract, /(?:without overlaps|non-overlap)/i);
  assert.match(contract, /directional-push[\s\S]+outgoingNodeIds?[\s\S]+incomingNodeIds?/i);
});

test('review evidence roles resolve to exact bridge and cut frames', () => {
  const review = read('agent/contracts/review-contract.md');
  assert.match(review, /beforeFrame\s*=\s*startFrame\s*-\s*1/i);
  assert.match(review, /midpointFrame[\s\S]+floor/i);
  assert.match(review, /afterFrame\s*=\s*endFrameExclusive/i);
  assert.match(review, /outgoingLastFrame\s*=\s*boundaryFrame\s*-\s*1/i);
  assert.match(review, /incomingFirstFrame\s*=\s*boundaryFrame/i);
  assert.match(review, /incomingHeldFrame[\s\S]+holdRange/i);
  assert.match(review, /frameRange[\s\S]+exactly\s+\[frameIndex,\s*frameIndex\s*\+\s*1\)/i);
});

test('review completion records the required playback observations structurally', () => {
  const review = read('agent/contracts/review-contract.md');
  assert.match(review, /type PlaybackEvidence/i);
  assert.match(review, /playbackEvidence/i);
  assert.match(review, /missingPlaybackRates/i);
  assert.match(review, /creative review[\s\S]+1(?:\.0)?×/i);
  assert.match(review, /motion review[\s\S]+1(?:\.0)?×[\s\S]+0\.25×/i);
  assert.match(review, /incomplete[\s\S]+must not[\s\S]+fabricat.+playback/is);
  assert.match(review, /type IncompleteReview[\s\S]+missingEvidenceRefs:\s*MissingEvidenceRef\[\][\s\S]+missingPlaybackRates:\s*PlaybackRate\[\]/i);
  assert.match(review, /at least one[\s\S]+missingEvidenceRefs[\s\S]+missingPlaybackRates/i);
});

test('revision provenance is orthogonal to patch size and bridge edits are closed', () => {
  const revision = read('agent/contracts/revision-contract.md');
  assert.match(revision, /cause[\s\S]+user-request[\s\S]+review-repair/i);
  assert.match(revision, /review-repair[\s\S]+triggeringReviewIssueIds[\s\S]+repairCycleId/i);
  assert.match(revision, /user-request[\s\S]+triggeringReviewIssueIds[^\n]+never/i);
  assert.doesNotMatch(revision, /set-continuity-bridge[^\n]+value:\s*unknown/i);
  assert.match(revision, /set-continuity-bridge[\s\S]+same.+(?:mode|variant)/i);
  assert.match(revision, /bounded[\s\S]+must not[\s\S]+(?:add|remove|reorder).+bridge/i);
});

test('Beat retiming has deterministic cascading impact and derived locks cannot be bypassed', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const prompt = read('agent/prompts/revision-interpreter.md');
  assert.match(revision, /retime-beat[\s\S]+recompute-segment-and-shift-following/i);
  assert.match(revision, /retime-beat[\s\S]+all later.+global.+frame/i);
  assert.match(revision, /derived|resolved timing/i);
  assert.match(revision, /lock[\s\S]+(?:transitive|dependency)[\s\S]+resolved timing/i);
  assert.match(revision, /bridgeRange[\s\S]+revalidat/i);
  assert.match(revision, /must not[\s\S]+implicit.+(?:remap|rewrite).+SegmentRef/i);
  assert.match(prompt, /retime-beat[\s\S]+locked.+(?:camera|transition|logo).+timing[\s\S]+blocked/is);
});

test('semantic impact targets can identify every transitive timing dependency exactly', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const motion = read('agent/contracts/motion-spec-contract.md');
  for (const entity of ['camera-segment', 'node-track', 'node-effect', 'content-transition']) {
    assert.match(revision, new RegExp(`entity[^\\n]+${entity}`, 'i'));
  }
  assert.match(revision, /node-track[\s\S]+nodeId[\s\S]+channel/i);
  assert.match(revision, /node-effect[\s\S]+nodeId/i);
  assert.match(revision, /content-transition[\s\S]+nodeId/i);
  assert.match(motion, /type ContentTransition[\s\S]+id:\s*string/i);
});

test('CapabilityGap payload, route decision, and advisory sequencing use one contract', () => {
  const contract = read('agent/contracts/capability-gap-contract.md');
  const workflow = read('agent/video-workflow.md');
  const planner = read('agent/prompts/motion-planner.md');
  const builder = read('agent/prompts/capability-builder.md');
  assert.match(contract, /type CapabilityGap/i);
  assert.match(contract, /type CapabilityGapRouteDecision/i);
  assert.match(contract, /gapPath[\s\S]+gapContentHash[\s\S]+decision[\s\S]+actor[\s\S]+reason/i);
  assert.match(contract, /payload[\s\S]+must not[\s\S]+(?:routeRequest|authoriz)/i);
  for (const text of [workflow, planner, builder]) {
    assert.match(text, /agent\/contracts\/capability-gap-contract\.md/);
    assert.doesNotMatch(text, /authorizedByActor|authorizationReason|chosenRoute/);
  }
  assert.match(workflow, /CAPABILITY_ADVISORY[\s\S]+STOP_AWAITING_SEPARATE_IMPLEMENTATION/i);
});

test('TreatmentSpec has one normative closed documentation contract', () => {
  const contract = read('agent/contracts/treatment-contract.md');
  const creative = read('agent/prompts/creative-direction.md');
  const revision = read('agent/contracts/revision-contract.md');
  for (const term of ['TreatmentSpec', 'BeatIntention', 'transitionVocabulary', 'chapterCutBudget', 'compositionMode']) {
    assert.match(contract, new RegExp(term));
  }
  assert.match(contract, /closed/i);
  assert.match(creative, /agent\/contracts\/treatment-contract\.md/);
  assert.match(revision, /agent\/contracts\/treatment-contract\.md/);
  assert.match(creative, /"id": "beat-2"/);
});

test('WorkflowDecision closes no-delegation, project identity, and quick defaults', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  const workflow = read('agent/video-workflow.md');
  assert.match(contract, /decisionKind[\s\S]+out-of-scope/i);
  assert.match(contract, /delegatedRole:\s*null/i);
  assert.match(contract, /projectId:\s*ProjectId\s*\|\s*null/i);
  assert.match(contract, /first available[\s\S]+-2[\s\S]+-3/i);
  assert.match(contract, /1920[×x]1080/i);
  assert.match(contract, /30\s*fps/i);
  assert.match(workflow, /agent\/contracts\/workflow-decision\.md/);
});

test('every allocated ProjectId satisfies one bounded invariant including collision suffixes', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type ProjectId/i);
  assert.match(contract, /final candidate[\s\S]+64 characters/i);
  assert.match(contract, /suffix[\s\S]+64\s*-\s*suffix\.length/i);
  assert.match(contract, /truncate[\s\S]+normalized base[\s\S]+trim.+trailing.+hyphen/i);
  assert.match(contract, /revalidate[\s\S]+final candidate[\s\S]+same.+invariant/i);
  assert.match(contract, /suffix\.length[^\n]+(?:63|cannot form|needs-user)/i);
});

test('non-delegating WorkflowDecision variants cannot point at a continuing state', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  const baseStart = contract.indexOf('type WorkflowDecisionBase');
  const base = contract.slice(baseStart, contract.indexOf('\n};', baseStart) + 3);
  assert.doesNotMatch(base, /toState:/);
  for (const kind of ['needs-user', 'blocked', 'out-of-scope']) {
    const start = contract.indexOf(`decisionKind: "${kind}"`);
    const end = contract.indexOf('\n  | (WorkflowDecisionBase & {', start + 1);
    const variant = contract.slice(start, end === -1 ? undefined : end);
    assert.match(variant, /toState:\s*"STOP"/, `${kind} must terminate at STOP`);
  }
  assert.match(contract, /type OutOfScopeCode\s*=/);
  assert.doesNotMatch(contract, /outOfScopeCodes:\s*\[string,/);
  assert.match(contract, /decisionKind:\s*"complete"[\s\S]+fromState:\s*"DELIVERY"[\s\S]+toState:\s*"COMPLETE"/i);
});

test('WorkflowDecision represents non-role interface calls without fabricated delegation', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type InterfaceInvocationRoute\s*=/i);
  assert.match(contract, /decisionKind:\s*"invoke-interface"[\s\S]+status:\s*"continue"[\s\S]+delegatedRole:\s*null/i);
  for (const [state, interfaceId] of [
    ['VALIDATE', 'canonical-source-hashing-and-validation'],
    ['SNAPSHOT', 'initial-snapshot'],
    ['APPLY_SEMANTIC_REVISION', 'semantic-revision-apply'],
    ['RESOLVE', 'resolver-compiler'],
    ['PREVIEW', 'preview-evidence-renderer'],
    ['TECHNICAL_QC', 'technical-qc'],
    ['RECORD_PREVIEW_APPROVAL', 'approval-recorder'],
    ['SILENT_FINAL', 'silent-final-renderer'],
    ['AUDIO_PROMPT', 'audio-prompt-generator'],
    ['OPTIONAL_LOCAL_MUX', 'local-alignment-mux'],
    ['DELIVERY', 'delivery-packager'],
  ]) {
    assert.match(contract, new RegExp(`toState: "${state}"[\\s\\S]+interfaceId: "${interfaceId}"`, 'i'));
  }
  assert.match(contract, /type OrchestrationAdvanceRoute\s*=/i);
  assert.match(contract, /decisionKind:\s*"advance"[\s\S]+delegatedRole:\s*null[\s\S]+interfaceId:\s*null/i);
});

test('role delegation target state and role authority are one discriminated pair', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type RoleDelegationTarget\s*=/i);
  for (const [state, role] of [
    ['FACT_CHECK', 'researcher'],
    ['BRIEF', 'brief-planner'],
    ['TREATMENT', 'creative-direction'],
    ['MOTION_SPEC', 'motion-planner'],
    ['CAPABILITY_ADVISORY', 'capability-builder'],
    ['REVISION_INTERPRET', 'revision-interpreter'],
    ['AUDIO_BRIEF', 'sound-designer'],
    ['CREATIVE_AND_MOTION_REVIEW', 'creative-reviewer'],
    ['CREATIVE_AND_MOTION_REVIEW', 'motion-reviewer'],
  ]) {
    assert.match(contract, new RegExp(`toState: "${state}"[\\s\\S]+delegatedRole: (?:"${role}"|"creative-reviewer" \\| "motion-reviewer")`, 'i'));
  }
  const delegateStart = contract.indexOf('decisionKind: "delegate"');
  const delegateEnd = contract.indexOf('\n  | (WorkflowDecisionBase &', delegateStart);
  const delegateVariant = contract.slice(delegateStart, delegateEnd);
  assert.match(contract, /WorkflowDecisionBase\s*&\s*RoleDelegationTarget\s*&\s*\{[\s\S]+decisionKind:\s*"delegate"/i);
  assert.doesNotMatch(delegateVariant, /toState:\s*Exclude|delegatedRole:\s*WorkflowRoleId/);
});

test('input-trust findings are typed and unused sources can be explicitly excluded', () => {
  const trust = read('agent/contracts/input-trust.md');
  const diagnostics = read('agent/contracts/diagnostics.md');
  const sources = read('projects/_template/LOCAL_SOURCES.md');
  assert.match(trust, /type InputTrustFinding/i);
  assert.match(trust, /must not[\s\S]+verbatim.+(?:command|URL)/i);
  assert.match(diagnostics, /UNTRUSTED_EMBEDDED_INSTRUCTION/);
  assert.match(sources, /nonessential[\s\S]+exclude|exclude[\s\S]+nonessential/i);
  assert.match(sources, /essential[\s\S]+rights[\s\S]+block/i);
});

test('every delegated role has one typed InputTrustFinding audit route', () => {
  const result = read('agent/contracts/role-result.md');
  assert.match(result, /type RoleResultBase[\s\S]+inputTrustFindings:\s*InputTrustFinding\[\]/i);
  assert.match(result, /every.+variant[\s\S]+inputTrustFindings/i);

  for (const path of [
    'agent/prompts/brief-planner.md',
    'agent/prompts/researcher.md',
    'agent/prompts/creative-direction.md',
    'agent/prompts/motion-planner.md',
    'agent/prompts/capability-builder.md',
    'agent/prompts/revision-interpreter.md',
    'agent/prompts/sound-designer.md',
    'agent/reviewers/creative-reviewer.md',
    'agent/reviewers/motion-reviewer.md',
  ]) {
    const prompt = read(path);
    assert.match(prompt, /inputTrustFindings/, `${path} lacks the typed audit handoff`);
    assert.match(prompt, /RoleResult@1/, `${path} lacks the shared RoleResult route`);
  }
});

test('silent delivery cannot bypass AudioBrief and the actual prompt attempt', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const workflow = read('agent/video-workflow.md');
  const delivery = read('craft/delivery.md');
  assert.match(artifacts, /silent/i);
  assert.match(artifacts, /audioBriefHash/i);
  assert.match(artifacts, /promptContentHash/i);
  assert.match(delivery, /silent[\s\S]+audioBriefHash[\s\S]+promptContentHash/i);
  assert.doesNotMatch([artifacts, workflow, delivery].join('\n'), /musicPromptHash/i);
  assert.match(workflow, /delivery request[\s\S]+actual[\s\S]+MUSIC_PROMPT\.md/i);
});

test('ManualAudioReturn binds one exact prompt attempt and rejects cross-attempt mixing', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const interfaces = read('agent/contracts/engine-interface.md');
  const audio = read('docs/workflows/audio-handoff.md');
  assert.match(artifacts, /type ManualAudioReturn[\s\S]+promptAttemptHash:\s*string[\s\S]+promptContentHash:\s*string[\s\S]+promptAttemptPath:\s*string/i);
  assert.match(artifacts, /reload[\s\S]+prompt-attempt\.json[\s\S]+recompute[\s\S]+promptAttemptHash/i);
  assert.match(artifacts, /must equal[\s\S]+selected[\s\S]+prompt attempt/i);
  assert.match(interfaces, /cross-attempt/i);
  assert.match(audio, /promptAttemptHash/i);
});

test('CapabilityGap identity is canonical and non-self-referential', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const planner = read('agent/prompts/motion-planner.md');
  assert.match(artifacts, /CapabilityGap[\s\S]+does[\s*]+not[\s\S]+contain[\s\S]+contentHash/i);
  assert.match(artifacts, /external[\s\S]+SHA-256[\s\S]+canonical JSON bytes/i);
  assert.match(planner, /(?:self-hash|contentHash)[\s\S]+payload|payload[\s\S]+(?:self-hash|contentHash)/i);
  assert.doesNotMatch(planner, /hash.+exact persisted bytes/i);
});

test('music prompt attempts have one content-addressed path and complete bindings', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const template = read('agent/templates/music-prompt-document.md');
  assert.match(artifacts, /out\/<project-id>\/<revision-id>\/<render-plan-hash>\/audio\/[\s\S]+<prompt-attempt-hash>/i);
  assert.match(artifacts, /MUSIC_PROMPT\.md/);
  for (const field of [
    'audioBriefHash',
    'previewApprovalHash',
    'renderManifestHash',
    'silentMasterHash',
  ]) {
    assert.match(artifacts, new RegExp(field));
    assert.match(template, new RegExp(field));
  }
  assert.match(artifacts, /promptAttemptHash/);
  assert.match(template, /promptAttemptHash[\s\S]+(?:not|neither).+embedded|(?:not|neither).+embedded[\s\S]+promptAttemptHash/i);
});

test('missing Part 2 interfaces use the defined role status and workflow stop', () => {
  const paths = [
    'agent/contracts/role-result.md',
    'craft/delivery.md',
    'craft/skill-manifest.json',
    'docs/workflows/audio-handoff.md',
  ];
  const corpus = paths.map(read).join('\n');
  assert.doesNotMatch(corpus, /AWAITING_ENGINE_INTERFACE/);
  assert.match(corpus, /status:\s*"awaiting-interface"|status`?\s+(?:is|=)\s+`?awaiting-interface/i);
  const workflow = read('agent/video-workflow.md');
  assert.match(workflow, /AWAITING_ENGINE_INTERFACE.+not a canonical state/i);
  assert.match(workflow, /awaiting-interface[\s\S]+STOP/i);
});

test('the orchestrator alone records an unavailable AUDIO_PROMPT interface boundary', () => {
  const workflow = read('agent/video-workflow.md');
  const audio = read('docs/workflows/audio-handoff.md');
  const soundDesigner = read('agent/prompts/sound-designer.md');
  const audioState = workflow.slice(workflow.indexOf('\nAUDIO_PROMPT\n'), workflow.indexOf('\nSTOP_MANUAL_MUSIC_GENERATION\n'));
  assert.match(audioState, /unavailable[\s\S]+WorkflowDecision\(status=blocked\)[\s\S]+STOP/i);
  assert.doesNotMatch(audioState, /RoleResult/);
  assert.match(audio, /orchestrator[\s\S]+WorkflowDecision@1[\s\S]+status:\s*["`]blocked["`]/i);
  assert.doesNotMatch(audio, /delegated owner returns `RoleResult@1` with `status: "awaiting-interface"`/i);
  assert.match(soundDesigner, /valid AudioBrief write[\s\S]+return `written`/i);
});

test('delivery interface names the mandatory AudioBrief and prompt-attempt evidence', () => {
  const interfaces = read('agent/contracts/engine-interface.md');
  const deliveryRow = interfaces.split('\n').find((line) => line.startsWith('| Delivery packager |')) ?? '';
  assert.match(deliveryRow, /AudioBrief/i);
  assert.match(deliveryRow, /prompt[- ]attempt/i);
});
