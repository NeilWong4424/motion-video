import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const roles = [
  'agent/prompts/brief-planner.md',
  'agent/prompts/researcher.md',
  'agent/prompts/creative-direction.md',
  'agent/prompts/motion-planner.md',
  'agent/prompts/capability-builder.md',
  'agent/prompts/revision-interpreter.md',
  'agent/prompts/sound-designer.md',
  'agent/reviewers/creative-reviewer.md',
  'agent/reviewers/motion-reviewer.md',
];

test('capability gaps are durable and code-building authority stays future-only', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const planner = manifest.roles.find((role) => role.id === 'motion-planner');
  const builder = manifest.roles.find((role) => role.id === 'capability-builder');
  assert.deepEqual(planner.writes, []);
  assert.deepEqual(planner.candidateOutputs, [
    'projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/motion.spec.json',
    'projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/motion.spec.json',
    'projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/capability-gap.json',
    'projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/capability-gap.json',
  ]);
  assert.deepEqual(builder.writes, []);
  assert.deepEqual(builder.candidateOutputs, []);
  assert.equal(builder.availability, 'interface-stub');
  assert.equal(builder.implementationOwner, 'project-local-capability-implementation-and-registration');
  assert.equal('futureWrites' in builder, false);

  const plannerPrompt = read('agent/prompts/motion-planner.md');
  assert.match(plannerPrompt, /candidate-attempt-id>\/capability-gap\.json/);
  assert.match(plannerPrompt, /content hash/i);
  assert.match(plannerPrompt, /route.+authoriz/i);
  assert.doesNotMatch(plannerPrompt, /inline only/i);
});

test('the semantic revision contract is discriminated, lock-bound and resistant to lock evasion', () => {
  const contract = read('agent/contracts/revision-contract.md');
  const prompt = read('agent/prompts/revision-interpreter.md');
  for (const operation of [
    'replace-copy', 'set-token', 'retime-beat', 'retime-bridge', 'set-node-state',
    'swap-renderer', 'set-effects', 'set-continuity-bridge', 'set-lock', 'remove-lock',
  ]) {
    assert.match(contract, new RegExp(operation));
  }
  for (const forbidden of ['replace-brief', 'replace-treatment', 'replace-motion-spec']) {
    assert.doesNotMatch(contract, new RegExp(forbidden));
  }
  for (const entity of ['brief', 'treatment', 'beat', 'bridge', 'node', 'camera', 'motion-cue', 'token']) {
    assert.match(contract, new RegExp(`entity[^\\n]+${entity}`, 'i'));
  }
  assert.match(contract, /expectedLockSetHash/);
  assert.match(contract, /type BoundedSemanticPatch[\s\S]+operations:[\s\S]+rebuildFrom\?:\s*never/i);
  assert.match(contract, /cause[\s\S]+user-request[\s\S]+review-repair/i);
  assert.match(contract, /review-repair[\s\S]+triggeringReviewIssueIds[\s\S]+repairCycleId/i);
  assert.match(contract, /user-request[\s\S]+triggeringReviewIssueIds[^\n]+never/i);
  assert.match(contract, /rebuildFrom:\s*"brief"\s*\|\s*"treatment"\s*\|\s*"motion-spec"/i);
  assert.match(contract, /rebuild[\s\S]+replacement payloads are forbidden/i);
  assert.match(contract, /remove-lock[\s\S]+durable instruction/i);
  assert.match(prompt, /agent\/contracts\/revision-contract\.md/);
  assert.match(prompt, /expectedLockSetHash/);
  assert.match(prompt, /remove-lock[\s\S]+must not[\s\S]+evade/i);
});

test('review artifacts are provenance-complete and can represent incomplete evidence', () => {
  const contract = read('agent/contracts/review-contract.md');
  for (const field of [
    'contentHash', 'producer', 'parentHashes', 'technicalQcHash', 'reviewBundleHash',
    'previewHash', 'renderPlanHash', 'evidenceHash', 'missingEvidenceRefs',
  ]) {
    assert.match(contract, new RegExp(field));
  }
  assert.match(contract, /complete:\s*false[\s\S]+decision:\s*null/i);
  assert.match(contract, /complete:\s*true[\s\S]+ship[\s\S]+fix[\s\S]+rebuild/i);
  assert.match(contract, /expected target hash/i);
  assert.match(contract, /observedBindings[\s\S]+(?:null|omitted)/i);
  assert.match(contract, /completed[\s\S]+observed[\s\S]+expected/i);
  assert.match(contract, /incomplete[\s\S]+(?:must not|never)[\s\S]+fabricat|never[\s\S]+fabricat[\s\S]+incomplete/i);
  assert.match(contract, /positive-duration[\s\S]+midpoint/i);
  assert.match(contract, /chapter-cut[\s\S]+outgoing[\s\S]+incoming[\s\S]+held/i);
  assert.match(contract, /ship[\s\S]+no blocking/i);
  assert.doesNotMatch(contract, /other-declared-mode/);

  for (const path of ['agent/reviewers/creative-reviewer.md', 'agent/reviewers/motion-reviewer.md']) {
    const prompt = read(path);
    assert.match(prompt, /agent\/contracts\/review-contract\.md/);
    assert.match(prompt, /complete.+false/is);
    assert.match(prompt, /technicalQcHash/);
    assert.match(prompt, /reviewBundleHash/);
  }
});

test('MotionSpec documentation closes bridge variants and decorative-anchor loopholes', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');
  for (const mode of [
    'shared-element', 'camera-navigation', 'morph-into-target',
    'match-on-action', 'directional-push', 'chapter-cut',
  ]) {
    assert.match(contract, new RegExp(mode));
  }
  for (const term of [
    'ContentTransition', 'PersistentNode', 'CameraTrack', 'SegmentRef',
    'maxEyeTraceDistanceNormalized', 'preRollFrames', 'settleFrames', 'reveals',
  ]) {
    assert.match(contract, new RegExp(term));
  }
  assert.match(contract, /10%[\s\S]+weighted.+salience/i);
  assert.match(contract, /layout.+fingerprint/i);
  assert.match(read('agent/prompts/motion-planner.md'), /agent\/contracts\/motion-spec-contract\.md/);
});

test('all roles use one typed RoleResult and treat inspected content as untrusted evidence', () => {
  const resultContract = read('agent/contracts/role-result.md');
  const trustContract = read('agent/contracts/input-trust.md');
  assert.match(resultContract, /status.+written[\s\S]+status.+blocked/is);
  assert.doesNotMatch(resultContract, /status:\s*"awaiting-interface"/i);
  assert.match(resultContract, /status.+advisory/is);
  assert.match(resultContract, /advisory[\s\S]+(?:must not|never)[\s\S]+(?:artifact path|gate evidence)/i);
  assert.match(resultContract, /status:\s*"written"[\s\S]+artifactCandidate:\s*AllowedArtifactCandidateForRoleRoute<R>/i);
  assert.match(trustContract, /untrusted evidence/i);
  assert.match(trustContract, /embedded instructions/i);
  assert.match(trustContract, /must not.+follow.+link/is);
  for (const path of roles) {
    const prompt = read(path);
    assert.match(prompt, /agent\/contracts\/role-result\.md/, `${path} does not use RoleResult`);
    assert.match(prompt, /agent\/contracts\/input-trust\.md/, `${path} does not inherit input trust`);
  }
  const capabilityBuilder = read('agent/prompts/capability-builder.md');
  assert.match(capabilityBuilder, /status.+advisory/is);
  assert.match(capabilityBuilder, /must not[\s\S]+(?:route authorization|gate evidence)/i);
});

test('research measurements are typed and partial findings have a clear blocked boundary', () => {
  const prompt = read('agent/prompts/researcher.md');
  for (const field of ['metric', 'value', 'unit', 'sampleBasis', 'location', 'method', 'uncertainty']) {
    assert.match(prompt, new RegExp(field));
  }
  assert.match(prompt, /partial[\s\S]+unresolved/i);
  assert.match(prompt, /blocked[\s\S]+depends on/i);
});

test('AudioBrief binds all locked-picture evidence and prompt-tool absence blocks only AUDIO_PROMPT', () => {
  const prompt = read('agent/prompts/sound-designer.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const workflow = read('agent/video-workflow.md');
  for (const field of ['previewApprovalHash', 'renderManifestHash', 'silentMasterHash']) {
    assert.match(prompt, new RegExp(field));
    assert.match(artifacts, new RegExp(field));
  }
  assert.match(prompt, /both.+review.+ship/is);
  assert.match(prompt, /Technical QC.+pass/is);
  assert.match(prompt, /After a valid write[\s\S]+return `written`[\s\S]+unavailable later prompt interface/i);
  assert.match(workflow, /AUDIO_PROMPT[\s\S]+audio-prompt-generator success[\s\S]+WAITING_FOR_MANUAL_MUSIC/i);
  assert.match(workflow, /Recoverable waiting never writes terminal `STOP`/i);
});

test('craft manifest is read-only, on-demand and authority-compatible', () => {
  const manifest = JSON.parse(read('craft/skill-manifest.json'));
  for (const skill of manifest.skills) {
    assert.equal(skill.authority, 'none', skill.id);
    assert.deepEqual(skill.writes, [], skill.id);
    assert.equal(skill.loadPolicy, 'on-demand', skill.id);
    assert.ok(Array.isArray(skill.readerRoles) && skill.readerRoles.length > 0, skill.id);
    assert.ok(Array.isArray(skill.workflowStates) && skill.workflowStates.length > 0, skill.id);
    assert.ok(Array.isArray(skill.triggerConditions) && skill.triggerConditions.length > 0, skill.id);
    assert.ok(Array.isArray(skill.requires), skill.id);
    assert.equal('ownerRoles' in skill, false, skill.id);
  }
  const sound = manifest.skills.find((skill) => skill.id === 'sound-design');
  assert.deepEqual(sound.readerRoles, ['sound-designer']);
  assert.ok(sound.workflowStates.every((state) => ['AUDIO_BRIEF', 'AUDIO_PROMPT'].includes(state)));
  const delivery = manifest.skills.find((skill) => skill.id === 'delivery');
  assert.deepEqual(delivery.readerRoles, ['orchestrator']);
  assert.match(read('craft/index.md'), /skill-manifest\.json/);
  assert.match(read('craft/index.md'), /load only|do not.+load all/is);
});

test('continuity evidence distinguishes positive bridges from the zero-frame cut', () => {
  const continuity = read('craft/continuity-first.md');
  const reviewer = read('agent/reviewers/motion-reviewer.md');
  for (const text of [continuity, reviewer]) {
    assert.match(text, /positive-duration[\s\S]+before[\s\S]+midpoint[\s\S]+after/i);
    assert.match(text, /zero-frame.+chapter cut[\s\S]+outgoing.+last[\s\S]+incoming.+first[\s\S]+incoming.+held/is);
    assert.match(text, /full-frame-change/i);
  }
  assert.match(continuity, /node declared as persisting[\s\S]+stable identity/i);
});

test('audio workflow is ordered and MUSIC_PROMPT ownership remains deterministic', () => {
  const audio = read('docs/workflows/audio-handoff.md');
  const ordered = [
    /approved locked silent cut/i,
    /AudioBrief/,
    /MUSIC_PROMPT\.md/,
    /third-party music generator/i,
    /user-declared payoff/i,
    /alignment/i,
    /delivery/i,
  ];
  let cursor = -1;
  for (const pattern of ordered) {
    const match = pattern.exec(audio.slice(cursor + 1));
    assert.ok(match, `Audio workflow missing ordered step ${pattern}`);
    cursor += match.index + match[0].length;
  }
  assert.match(read('craft/sound-design.md'), /declare exactly one payoff/i);
  assert.doesNotMatch(read('craft/sound-design.md'), /matching AudioBrief context/i);
  assert.match(read('craft/delivery.md'), /actual.+MUSIC_PROMPT\.md/is);
});

test('camera craft permits justified combined verbs without allowing decorative drift', () => {
  for (const path of ['craft/camera-choreography.md', 'craft/continuous-world.md']) {
    const text = read(path);
    assert.match(text, /one primary verb.+default/i);
    assert.match(text, /combine.+semantically|combination.+rationale/is);
  }
  const motionSpec = read('agent/contracts/motion-spec-contract.md');
  assert.match(motionSpec, /primaryVerb/);
  assert.match(motionSpec, /combinedVerbs/);
  assert.match(motionSpec, /combinationRationale/);
  assert.match(motionSpec, /combinedVerbs[\s\S]+unique[\s\S]+maximum/i);
});
