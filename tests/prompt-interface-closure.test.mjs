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
  assert.match(review, /beforeFrame\s*=\s*bridgeStartFrame\s*-\s*1/i);
  assert.match(review, /midpointFrame[\s\S]+floor/i);
  assert.match(review, /afterFrame\s*=\s*bridgeEndFrameExclusive/i);
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
  for (const text of [planner, builder]) {
    assert.match(text, /agent\/contracts\/capability-gap-contract\.md/);
    assert.doesNotMatch(text, /authorizedByActor|authorizationReason|chosenRoute/);
  }
  assert.match(workflow, /CAPABILITY_ADVISORY[\s\S]+WAITING_FOR_CAPABILITY_IMPLEMENTATION/i);
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
  assert.match(revision, /owner sequence|owner-scoped/i);
  assert.match(creative, /"id": "beat-2"/);
});

test('WorkflowDecision closes no-delegation, project identity, and quick defaults', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  const workflow = read('agent/video-workflow.md');
  assert.match(contract, /decisionKind[\s\S]+out-of-scope/i);
  assert.match(contract, /delegatedRole:\s*null/i);
  assert.match(contract, /projectId:\s*ProjectId\s*\|\s*null/i);
  assert.match(contract, /Try `base`, `base-2`, `base-3`/i);
  assert.match(contract, /1920[×x]1080/i);
  assert.match(contract, /30\s*fps/i);
  assert.match(workflow, /agent\/contracts\/workflow-decision\.md/);
});

test('every allocated ProjectId satisfies one bounded invariant including collision suffixes', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type ProjectId/i);
  assert.match(contract, /ProjectId[\s\S]+at most 64 characters/i);
  assert.match(contract, /suffix `s`[\s\S]+64\s*-\s*s\.length/i);
  assert.match(contract, /truncate the base[\s\S]+trim its trailing hyphen/i);
  assert.match(contract, /append `s`, and revalidate/i);
  assert.match(contract, /no non-empty legal candidate can form[\s\S]+pause/i);
});

test('non-delegating WorkflowDecision distinguishes resumable pauses from terminal refusal', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  const baseStart = contract.indexOf('type WorkflowDecisionBase');
  const base = contract.slice(baseStart, contract.indexOf('\n};', baseStart) + 3);
  assert.doesNotMatch(base, /toState:/);
  for (const kind of ['blocked', 'out-of-scope']) {
    const start = contract.indexOf(`decisionKind: "${kind}"`);
    const end = contract.indexOf('\n  | (WorkflowDecisionBase & {', start + 1);
    const variant = contract.slice(start, end === -1 ? undefined : end);
    assert.match(variant, /toState:\s*"STOP"/, `${kind} must terminate at STOP`);
  }
  assert.match(contract, /type PauseDecisionFor<P extends NonUserWorkflowPause>[\s\S]+fromState:\s*P\["state"\];[\s\S]+toState:\s*P\["state"\]/i);
  assert.match(contract, /type NeedsUserDecisionFor<P extends RequiredUserInputPause>[\s\S]+fromState:\s*P\["state"\];[\s\S]+toState:\s*P\["state"\]/i);
  assert.doesNotMatch(contract, /decisionKind:\s*"needs-user"[\s\S]{0,500}toState:\s*"STOP"/i);
  assert.match(contract, /type OutOfScopeCode\s*=/);
  assert.doesNotMatch(contract, /outOfScopeCodes:\s*\[string,/);
  assert.match(contract, /fromState:\s*"WAITING_FOR_MANUAL_MUSIC"; toState:\s*"COMPLETE"; interfaceId:\s*"delivery-packager"/i);
  assert.match(contract, /fromState:\s*"DELIVERY"; toState:\s*"COMPLETE"; interfaceId:\s*"delivery-packager"/i);
});

test('WorkflowDecision represents non-role interface calls without fabricated delegation', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type InterfaceInvocationRoute\s*=/i);
  assert.match(contract, /decisionKind:\s*"invoke-interface"[\s\S]+status:\s*"continue"[\s\S]+delegatedRole:\s*null/i);
  for (const [fromState, toState, interfaceId] of [
    ['VALIDATE', 'SNAPSHOT', 'canonical-source-hashing-and-validation'],
    ['SNAPSHOT', 'VALIDATE', 'initial-snapshot'],
    ['APPLY_SEMANTIC_REVISION', 'VALIDATE', 'semantic-revision-apply'],
    ['WAITING_FOR_CAPABILITY_IMPLEMENTATION', 'WAITING_FOR_CAPABILITY_IMPLEMENTATION', 'project-local-capability-implementation-and-registration'],
    ['RESOLVE', 'PREVIEW', 'resolver-compiler'],
    ['PREVIEW', 'TECHNICAL_QC', 'preview-evidence-renderer'],
    ['TECHNICAL_QC', 'CREATIVE_AND_MOTION_REVIEW', 'technical-qc'],
    ['RECORD_PREVIEW_APPROVAL', 'APPROVED', 'approval-recorder'],
    ['SILENT_FINAL', 'AUDIO_BRIEF', 'silent-final-renderer'],
    ['AUDIO_PROMPT', 'WAITING_FOR_MANUAL_MUSIC', 'audio-prompt-generator'],
    ['OPTIONAL_LOCAL_MUX', 'DELIVERY', 'local-alignment-mux'],
  ]) {
    assert.match(contract, new RegExp(`fromState: "${fromState}"[^\\n]+toState: "${toState}"[^\\n]+interfaceId: "${interfaceId}"`, 'i'));
  }
  assert.match(contract, /fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "COMPLETE"; interfaceId: "delivery-packager"/i);
  assert.match(contract, /fromState: "DELIVERY"; toState: "COMPLETE"; interfaceId: "delivery-packager"/i);
  assert.match(contract, /type OrchestrationAdvanceRoute\s*=/i);
  assert.match(contract, /decisionKind:\s*"advance"[\s\S]+delegatedRole:\s*null[\s\S]+interfaceId:\s*null/i);
});

test('role delegation target state and role authority are one discriminated pair', () => {
  const contract = read('agent/contracts/workflow-decision.md');
  assert.match(contract, /type RoleDelegationTarget\s*=/i);
  for (const [fromState, toState, role] of [
    ['FACT_CHECK', 'FACT_CHECK', 'researcher'],
    ['BRIEF', 'BRIEF', 'brief-planner'],
    ['TREATMENT', 'TREATMENT', 'creative-direction'],
    ['MOTION_SPEC', 'MOTION_SPEC', 'motion-planner'],
    ['CAPABILITY_GAP', 'CAPABILITY_ADVISORY', 'capability-builder'],
    ['REVISION_INTERPRET', 'REVISION_INTERPRET', 'revision-interpreter'],
    ['AUDIO_BRIEF', 'AUDIO_BRIEF', 'sound-designer'],
    ['CREATIVE_AND_MOTION_REVIEW', 'CREATIVE_AND_MOTION_REVIEW', 'creative-reviewer'],
    ['CREATIVE_AND_MOTION_REVIEW', 'CREATIVE_AND_MOTION_REVIEW', 'motion-reviewer'],
  ]) {
    assert.match(contract, new RegExp(`fromState: "${fromState}"; toState: "${toState}"; delegatedRole: (?:"${role}"|"creative-reviewer" \\| "motion-reviewer")`, 'i'));
  }
  const delegateStart = contract.indexOf('decisionKind: "delegate"');
  const delegateEnd = contract.indexOf('\n  | (WorkflowDecisionBase &', delegateStart);
  const delegateVariant = contract.slice(delegateStart, delegateEnd);
  assert.match(contract, /type RoleDelegationDecisionFor<R extends RoleDelegationRoute>\s*=\s*[\s\S]+WorkflowDecisionBase\s*&\s*R\s*&\s*NormalActionIdentityFor<R>[\s\S]+decisionKind:\s*"delegate"/i);
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
  assert.match(workflow, /No-track is valid only after the actual AudioBrief and prompt attempt exist/i);
});

test('ManualAudioReturn binds one exact prompt attempt and rejects cross-attempt mixing', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const interfaces = read('agent/contracts/engine-interface.md');
  const audio = read('docs/workflows/audio-handoff.md');
  assert.match(artifacts, /type ManualAudioReturn[\s\S]+promptAttemptHash:\s*string[\s\S]+promptContentHash:\s*string[\s\S]+promptAttemptPath:\s*RepositoryArtifactPath/i);
  assert.match(artifacts, /reload[\s\S]+prompt-attempt\.json[\s\S]+recompute[\s\S]+promptAttemptHash/i);
  assert.match(artifacts, /Track A cannot be aligned under attempt B/i);
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
  const audioWorkflow = read('docs/workflows/audio-handoff.md');
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
  const storedAttemptFields = /type MusicPromptAttempt\s*=\s*\{([\s\S]*?)\n\};/.exec(artifacts)?.[1];
  assert.ok(storedAttemptFields, 'MusicPromptAttempt@1 needs an explicit stored-field projection');
  assert.match(storedAttemptFields, /\bcontentHash\b/);
  assert.doesNotMatch(storedAttemptFields, /\bpromptAttemptHash\b/);
  assert.match(artifacts, /promptAttemptHash[\s\S]+(?:external|path)[\s\S]+alias[\s\S]+(?:equals|equal to)[\s\S]+contentHash/i);
  assert.match(artifacts, /prompt-attempt\.json[\s\S]+stores no second `promptAttemptHash`/i);
  assert.match(template, /prompt-attempt\.json[\s\S]+stores[\s\S]+contentHash[\s\S]+promptContentHash/i);
  assert.match(template, /does not store[\s\S]+promptAttemptHash/i);
  assert.match(audioWorkflow, /attempt envelope's external\/path alias `promptAttemptHash` equals its `contentHash`/i);
});

test('missing Part 2 interfaces use same-state pauses and never a role-owned wait result', () => {
  const paths = [
    'agent/contracts/role-result.md',
    'craft/delivery.md',
    'craft/skill-manifest.json',
    'docs/workflows/audio-handoff.md',
  ];
  const corpus = paths.map(read).join('\n');
  assert.doesNotMatch(corpus, /AWAITING_ENGINE_INTERFACE/);
  assert.doesNotMatch(corpus, /status:\s*"awaiting-interface"|status`?\s+(?:is|=)\s+`?awaiting-interface/i);
  assert.doesNotMatch(corpus, /unavailable[\s\S]{0,300}(?:transitions?|followed by)[\s\S]{0,80}`STOP`/i);
  const workflow = read('agent/video-workflow.md');
  assert.match(workflow, /Recoverable waiting never writes terminal `STOP`/i);
  assert.match(workflow, /deferred-interface retry[\s\S]+same interface only/i);
});

test('the orchestrator alone records an unavailable AUDIO_PROMPT interface boundary', () => {
  const workflow = read('agent/video-workflow.md');
  const audio = read('docs/workflows/audio-handoff.md');
  const soundDesigner = read('agent/prompts/sound-designer.md');
  assert.match(workflow, /AUDIO_PROMPT[\s\S]+audio-prompt-generator success[\s\S]+WAITING_FOR_MANUAL_MUSIC/i);
  assert.match(workflow, /unavailable future interfaces[\s\S]+preserve their exact workflow state/i);
  assert.match(audio, /If `audio-prompt-generator` is unavailable[\s\S]+deferred-interface pause in `AUDIO_PROMPT`/i);
  assert.doesNotMatch(audio, /status:\s*["`]awaiting-interface["`]/i);
  assert.match(soundDesigner, /After a valid write, return `written`[\s\S]+unavailable later prompt interface/i);
});

test('delivery interface names the mandatory AudioBrief and prompt-attempt evidence', () => {
  const interfaces = read('agent/contracts/engine-interface.md');
  const deliveryRow = interfaces.split('\n').find((line) => line.startsWith('| Delivery packager |')) ?? '';
  assert.match(deliveryRow, /AudioBrief/i);
  assert.match(deliveryRow, /prompt[- ]attempt/i);
});

test('role-authored source artifacts inherit one closed central contract', () => {
  const contractPath = 'agent/contracts/role-artifact-contracts.md';
  const contract = read(contractPath);
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));

  assert.ok(manifest.contracts.includes(contractPath));
  for (const type of ['BriefSpec', 'ResearchFindings', 'AudioBriefArtifact']) {
    assert.match(contract, new RegExp(`type ${type} = \\{[\\s\\S]+?schemaVersion:`));
  }
  assert.match(contract, /durationInFrames:\s*PositiveInteger/);
  assert.match(contract, /type BriefFps\s*=\s*24\s*\|\s*25\s*\|\s*30\s*\|\s*50\s*\|\s*60/);
  assert.match(contract, /durationInFrames\s*===?\s*durationSeconds\s*\*\s*canvas\.fps/);
  assert.match(contract, /MotionSpec binds that `briefHash`[\s\S]+Beat durations must sum to[\s\S]+durationInFrames/i);
  assert.match(contract, /type MeasurementValue\s*=[\s\S]+kind:\s*"scalar"[\s\S]+kind:\s*"range"[\s\S]+kind:\s*"point"[\s\S]+kind:\s*"rectangle"/i);
  assert.match(contract, /type MeasurementLocation\s*=[\s\S]+kind:\s*"whole-source"[\s\S]+kind:\s*"frame-range"[\s\S]+kind:\s*"time-range"[\s\S]+kind:\s*"page-region"[\s\S]+kind:\s*"image-region"[\s\S]+kind:\s*"data-path"/i);
  assert.match(contract, /type MeasurementUncertainty\s*=[\s\S]+kind:\s*"exact"[\s\S]+kind:\s*"absolute"[\s\S]+kind:\s*"relative"[\s\S]+kind:\s*"bounded"/i);
  assert.match(contract, /closed object[\s\S]+additional fields[\s\S]+forbidden/i);
  assert.match(contract, /localPath[\s\S]+repository-relative[\s\S]+(?:URL|`\.\.`)[\s\S]+forbidden/i);
  assert.doesNotMatch(contract, /\bunknown\b|Record\s*</);

  const artifactSummary = read('agent/contracts/artifact-contracts.md');
  assert.match(artifactSummary, /ResearchFindings@1[\s\S]+measurements\[\][\s\S]+inputTrustFindings\[\]/i);

  for (const path of [
    'agent/prompts/brief-planner.md',
    'agent/prompts/researcher.md',
    'agent/prompts/sound-designer.md',
  ]) {
    assert.match(read(path), /agent\/contracts\/role-artifact-contracts\.md/);
  }

  assert.match(read('agent/prompts/brief-planner.md'), /"durationInFrames":\s*600/);
  assert.match(read('agent/prompts/researcher.md'), /"location":\s*\{"kind":\s*"frame-range"/);
  assert.match(read('agent/prompts/researcher.md'), /"uncertainty":\s*\{"kind":\s*"absolute"/);
  assert.match(read('agent/prompts/sound-designer.md'), /"schemaVersion":\s*"audio-brief@1"/);

  const example = (path) => JSON.parse(/```json\n([\s\S]*?)\n```/.exec(read(path))?.[1] ?? 'null');
  const brief = example('agent/prompts/brief-planner.md');
  const research = example('agent/prompts/researcher.md');
  const audio = example('agent/prompts/sound-designer.md');
  assert.deepEqual(Object.keys(brief).sort(), [
    'assetManifestHash', 'researchFindingsHash', 'assumptions', 'audience', 'canvas', 'constraints', 'cta', 'durationInFrames',
    'durationSeconds', 'goal', 'inputTrustFindings', 'language', 'message',
    'prohibitedContent', 'projectId', 'schemaVersion', 'suppliedAssetIds', 'title',
    'verifiedFacts',
  ].sort());
  assert.equal(brief.durationInFrames, brief.durationSeconds * brief.canvas.fps);
  assert.deepEqual(Object.keys(research).sort(), [
    'assetManifestHash', 'findings', 'inferences', 'inputTrustFindings', 'measurements', 'projectId',
    'schemaVersion', 'sources', 'status', 'unresolved',
  ].sort());
  assert.deepEqual(Object.keys(audio).sort(), [
    'audio', 'durationInFrames', 'fps', 'previewApprovalHash', 'projectId',
    'renderManifestHash', 'renderPlanHash', 'revisionId', 'schemaVersion',
    'silentMasterHash',
  ].sort());
});
