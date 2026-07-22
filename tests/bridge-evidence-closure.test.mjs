import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('positive bridges straddle the exact adjacent Beat boundary', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');

  assert.match(contract, /fromBeatId[\s\S]+toBeatId[\s\S]+exact adjacent ordered Beat pair/i);
  assert.match(
    contract,
    /fromBeatStartFrame\s*<\s*bridgeStartFrame\s*<\s*boundaryFrame\s*<\s*bridgeEndFrameExclusive\s*<\s*toBeatEndFrame/,
  );
  assert.match(contract, /beforeFrame[\s\S]+outgoing Beat[\s\S]+afterFrame[\s\S]+incoming Beat/i);
  assert.match(contract, /motionRange[\s\S]+cameraRange[\s\S]+exact same resolved start and end/i);
});

test('chapter cuts are a closed budgeted exception rather than a positive transition family', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');

  assert.match(contract, /type ChapterCutBridge = BridgeIdentityBase/);
  assert.match(contract, /exceptionRole:\s*"chapter-cut"/);
  assert.match(
    contract,
    /chapter-cut[\s\S]+omits[\s\S]+transitionFamily[\s\S]+vocabularyRole[\s\S]+motionOwnership[\s\S]+combinationMeaning/i,
  );
  assert.match(contract, /outside[\s\S]+transitionVocabulary[\s\S]+Treatment[\s\S]+chapterCutBudget/i);
});

test('MotionSpec binds the Brief identity, canvas, fps, and exact total duration', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');

  assert.match(contract, /type MotionSpec[\s\S]+briefHash:\s*string/);
  assert.match(contract, /MotionSpec\.projectId[\s\S]+BriefSpec\.projectId[\s\S]+exactly equal/i);
  assert.match(contract, /canvas\.width[\s\S]+canvas\.height[\s\S]+canvas\.fps[\s\S]+BriefSpec/i);
  assert.match(contract, /sum\(Beat\.durationFrames\)\s*===\s*BriefSpec\.durationInFrames/);
});

test('completed Motion Review evidence is a mode-bound ordered bijection over bridges', () => {
  const contract = read('agent/contracts/review-contract.md');

  assert.match(contract, /ordered bijection[\s\S]+MotionSpec\.timeline\.bridges/i);
  assert.match(contract, /same length[\s\S]+same order[\s\S]+unique bridgeId[\s\S]+no missing[\s\S]+no extra/i);
  assert.match(contract, /bridgeStartFrame[\s\S]+boundaryFrame[\s\S]+bridgeEndFrameExclusive[\s\S]+exactly equal[\s\S]+MotionSpec/i);
  assert.match(contract, /brightnessDeadFrameScan\.frameRange[\s\S]+\[bridgeStartFrame, bridgeEndFrameExclusive\)/i);
  assert.match(contract, /shared-element[\s\S]+persistent-shared-element[\s\S]+exact-visual/i);
  assert.match(contract, /camera-navigation[\s\S]+camera-navigation[\s\S]+continuous-motion/i);
  assert.match(contract, /morph-into-target[\s\S]+scene-stack-real-target[\s\S]+exact-visual/i);
  assert.match(contract, /match-on-action[\s\S]+match-on-action[\s\S]+continuous-motion/i);
  assert.match(contract, /directional-push[\s\S]+directional-push[\s\S]+continuous-motion/i);
});

test('chapter-cut evidence is bound to the exact MotionSpec boundary and frame pair', () => {
  const contract = read('agent/contracts/review-contract.md');

  assert.match(contract, /ChapterCutEvidence[\s\S]+boundaryFrame/);
  assert.match(contract, /boundaryFrame[\s\S]+exactly equal[\s\S]+MotionSpec[\s\S]+adjacent-Beat boundary/i);
  assert.match(contract, /fullFrameChange\.frameRange[\s\S]+\[boundaryFrame - 1, boundaryFrame \+ 1\)/i);
  assert.match(contract, /outgoingLast[\s\S]+boundaryFrame - 1[\s\S]+incomingFirst[\s\S]+boundaryFrame/i);
  assert.match(contract, /declaredEyeTraceDistanceNormalized[\s\S]+exactly equal[\s\S]+maxEyeTraceDistanceNormalized/i);
  assert.match(contract, /measuredEyeTraceDistanceNormalized\s*<=\s*declaredEyeTraceDistanceNormalized/);
});
