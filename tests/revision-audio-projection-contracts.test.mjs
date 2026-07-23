import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('MotionSpec exposes stable copy and design-token registries for semantic edits', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type CopyRegistryEntry[\s\S]+id:\s*string[\s\S]+text:\s*DurableSemanticText/i);
  assert.match(motion, /type DesignTokenEntry[\s\S]+semanticRole:\s*"color"[\s\S]+Extract<DesignTokenValue/);
  assert.match(motion, /registries:\s*\{[\s\S]+copy:\s*CopyRegistryEntry\[\][\s\S]+tokens:\s*DesignTokenEntry\[\]/i);
  assert.match(motion, /copy.+IDs?[\s\S]+unique[\s\S]+token.+IDs?[\s\S]+unique/i);
  assert.match(motion, /user-visible authored copy[\s\S]+copy registry/i);
  assert.match(motion, /copyId[\s\S]+resolve[\s\S]+CopyRegistryEntry/i);
  assert.match(motion, /tokenIds[\s\S]+resolve[\s\S]+DesignTokenEntry/i);
});

test('semantic copy and token operations target their closed registries', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const prompt = read('agent/prompts/revision-interpreter.md');

  assert.match(revision, /entity:\s*"copy"/i);
  assert.match(revision, /entity:\s*"token"/i);
  assert.match(revision, /op:\s*"replace-copy";\s*copyId:\s*string/i);
  assert.doesNotMatch(revision, /op:\s*"replace-copy";\s*nodeId:/i);
  assert.match(revision, /op:\s*"set-token";\s*tokenId:\s*string[\s\S]+expectedValueKind/i);
  assert.match(revision, /expectedValueKind:\s*"string"[\s\S]+value:\s*string/i);
  assert.match(revision, /expectedValueKind:\s*"number"[\s\S]+value:\s*number/i);
  assert.match(prompt, /copy registry[\s\S]+copyId/i);
  assert.match(prompt, /design-token registry[\s\S]+tokenId/i);
});

test('retime-bridge atomically remaps the bridge and exact mode mechanism around the real boundary', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const prompt = read('agent/prompts/revision-interpreter.md');

  assert.match(revision, /type RetimeBridgeOperation/i);
  assert.match(revision, /op:\s*"retime-bridge"[\s\S]+expectedBoundary[\s\S]+fromBeatId[\s\S]+toBeatId[\s\S]+boundaryAt/i);
  assert.match(revision, /expectedMode:\s*"camera-navigation"[\s\S]+bridgeRange:\s*SegmentRange[\s\S]+cameraRange:\s*SegmentRange/i);
  assert.match(revision, /expectedMode:\s*"shared-element"\s*\|\s*"morph-into-target"\s*\|\s*"match-on-action"\s*\|\s*"directional-push"[\s\S]+motionRange:\s*SegmentRange/i);
  assert.match(revision, /bridgeRange[\s\S]+mechanism range[\s\S]+exact same resolved endpoints/i);
  assert.match(revision, /straddle[\s\S]+actual adjacent-Beat boundary/i);
  assert.match(revision, /cameraSegmentId[\s\S]+atomically update[\s\S]+segment.+range/i);
  assert.match(revision, /chapter-cut[\s\S]+cannot be retimed/i);
  assert.match(prompt, /retime-bridge[\s\S]+bridgeRange[\s\S]+motionRange|retime-bridge[\s\S]+bridgeRange[\s\S]+cameraRange/i);
  assert.match(prompt, /real adjacent-Beat boundary/i);
});

test('bounded bridge changes discriminate positive modes from chapter cuts', () => {
  const revision = read('agent/contracts/revision-contract.md');

  assert.match(revision, /type PositiveBridgeChangeOperation/i);
  assert.match(revision, /type ChapterCutChangeOperation/i);
  for (const mode of ['shared-element', 'camera-navigation', 'morph-into-target', 'match-on-action', 'directional-push']) {
    assert.match(
      revision,
      new RegExp(`expectedMode:\\s*"${mode}"[\\s\\S]+transitionFamily\\?:\\s*"${mode}"`, 'i'),
    );
  }
  const cutStart = revision.indexOf('type ChapterCutChangeOperation');
  const cutEnd = revision.indexOf('\n};', cutStart) + 3;
  const cut = revision.slice(cutStart, cutEnd);
  assert.match(cut, /expectedMode:\s*"chapter-cut"/i);
  assert.doesNotMatch(cut, /transitionFamily|vocabularyRole|motionOwnership|combinationMeaning/i);
});

test('music prompt projection is a versioned exact function of the AudioBrief', () => {
  const template = read('agent/templates/music-prompt-document.md');

  assert.match(template, /templateId:\s*`music-prompt-document`/i);
  assert.match(template, /templateVersion:\s*`1\.0\.0`/i);
  assert.match(template, /compilerContractVersion:\s*`audio-prompt-projection\/1`/i);
  assert.match(template, /AudioBriefArtifact@1[\s\S]+only semantic source/i);
  assert.match(template, /durationSeconds[\s\S]+durationInFrames[\s\S]+fps/i);
  assert.match(template, /formatSeconds\(frame,\s*fps\)/i);
  assert.match(template, /round half up[\s\S]+three decimal/i);
  assert.match(template, /audio\.cues[\s\S]+artifact order/i);
  assert.match(template, /role @ frame[\s\S]+label[\s\S]+sound/i);
  assert.match(template, /Unicode NFC/i);
  assert.match(template, /CRLF[\s\S]+LF/i);
  assert.match(template, /collapse[\s\S]+whitespace[\s\S]+single ASCII space/i);
  assert.match(template, /backtick[\s\S]+apostrophe/i);
  assert.match(template, /exactly one LF/i);
  assert.match(template, /4,000 Unicode scalar values[\s\S]+refuse[\s\S]+must not truncate/i);
  assert.doesNotMatch(template, /motionCueReference/);
});
