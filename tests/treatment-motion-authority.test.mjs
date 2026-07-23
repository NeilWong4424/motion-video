import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('Treatment declares one stable camera rationale for every adjacent intention pair', () => {
  const treatment = read('agent/contracts/treatment-contract.md');

  assert.match(treatment, /type CameraTravelRationale[\s\S]+id:\s*string/);
  assert.match(
    treatment,
    /exactly one[\s\S]+CameraTravelRationale[\s\S]+every adjacent ordered[\s\S]+BeatIntention[^\w]+pair/i,
  );
  assert.match(treatment, /cameraTravelRationale[\s\S]+same order[\s\S]+no (?:missing|omitted)[\s\S]+no extra[\s\S]+no duplicate/i);
});

test('MotionSpec preserves Treatment Beat intentions through an ordered bijection', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type Beat = \{[\s\S]+treatmentBeatIntentionId:\s*string/);
  assert.match(motion, /MotionSpec\.timeline\.beats[\s\S]+ordered bijection[\s\S]+TreatmentSpec\.beatIntentions/i);
  assert.match(motion, /same (?:length|count)[\s\S]+same order[\s\S]+no (?:missing|omitted)[\s\S]+no extra[\s\S]+no duplicate/i);
  assert.match(motion, /Beat\.objective\s*===\s*(?:the )?matched BeatIntention\.objective/);
  assert.match(motion, /Beat\.message\s*===\s*(?:the )?matched BeatIntention\.message/);
});

test('each MotionSpec bridge consumes the exact matching Treatment camera rationale', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type BridgeIdentityBase = \{[\s\S]+treatmentCameraRationaleId:\s*string/);
  assert.match(motion, /timeline\.bridges[\s\S]+ordered bijection[\s\S]+TreatmentSpec\.cameraTravelRationale/i);
  assert.match(motion, /treatmentCameraRationaleId[\s\S]+exact adjacent[\s\S]+treatmentBeatIntentionId/i);
  assert.match(motion, /camera-navigation[\s\S]+travelIntent\s*===\s*"travel"/i);
  assert.match(motion, /spatialRelationship\s*===\s*(?:the )?matched rationale\.revealedSpatialRelation/i);
  assert.match(motion, /reveals\.spatialRelationship\s*===\s*(?:the )?matched rationale\.revealedSpatialRelation/i);
  assert.match(motion, /every (?:other|non-camera)[\s\S]+bridge[\s\S]+travelIntent\s*===\s*"hold"/i);
  for (const type of [
    'SharedElementBridge',
    'MorphIntoTargetBridge',
    'MatchOnActionBridge',
    'DirectionalPushBridge',
  ]) {
    assert.match(motion, new RegExp(`type ${type}[\\s\\S]+?motionOwnership: "node"`));
  }
  assert.match(motion, /type CameraNavigationBridge[\s\S]+?motionOwnership:\s*"camera"\s*\|\s*"camera-and-node-semantic"/);
});

test('planner, reviewer, and camera craft enforce Treatment-to-Motion bindings', () => {
  const director = read('agent/prompts/creative-direction.md');
  const planner = read('agent/prompts/motion-planner.md');
  const reviewer = read('agent/reviewers/motion-reviewer.md');
  const camera = read('craft/camera-choreography.md');
  const continuity = read('craft/continuity-first.md');

  assert.match(director, /exactly one[\s\S]+CameraTravelRationale[\s\S]+every adjacent ordered/i);
  assert.match(director, /same order[\s\S]+no missing[\s\S]+extra[\s\S]+duplicate/i);
  for (const text of [planner, reviewer]) {
    assert.match(text, /treatmentBeatIntentionId/);
    assert.match(text, /treatmentCameraRationaleId/);
    assert.match(text, /ordered bijection/i);
    assert.match(text, /objective[\s\S]+message[\s\S]+(?:unchanged|exact|preserv)/i);
  }
  for (const text of [camera, continuity]) {
    assert.match(text, /treatmentCameraRationaleId/);
    assert.match(text, /camera-navigation[\s\S]+travel[\s\S]+revealedSpatialRelation/i);
    assert.match(text, /non-camera[\s\S]+hold/i);
  }
});

test('Capability Builder reads the capability-gap workflow directly without craft routing', () => {
  const builder = read('agent/prompts/capability-builder.md');
  const workflow = read('docs/workflows/capability-gap.md');
  const craftManifest = JSON.parse(read('craft/skill-manifest.json'));

  assert.match(builder, /docs\/workflows\/capability-gap\.md/);
  assert.match(builder, /read (?:it )?directly[\s\S]+normative/i);
  assert.doesNotMatch(builder, /craft\/index\.md|craft\/skill-manifest\.json/i);
  assert.doesNotMatch(builder, /(?:consult|invoke|use)[^\n]+craft (?:loader|manifest|index)/i);
  assert.match(workflow, /does not invoke the craft loader for Capability Builder/i);
  assert.match(builder, /Procedure[\s\S]+capability-gap\.md[\s\S]+disprove the gap/i);
  assert.ok(craftManifest.skills.every((skill) => !skill.readerRoles.includes('capability-builder')));
  assert.ok(craftManifest.skills.every((skill) => !skill.workflowStates.includes('CAPABILITY_GAP')));
});
