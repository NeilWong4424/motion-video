import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const block = (text, start, end) => {
  const value = new RegExp(`${start}([\\s\\S]*?)${end}`).exec(text)?.[1];
  assert.ok(value, `missing block ${start}`);
  return value;
};

test('manual audio has one external return identity and derives the prompt attempt path', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const request = block(artifacts, 'type ManualAudioIngressRequest\\s*=\\s*\\{', '\\n\\};');
  const result = block(artifacts, 'type ManualAudioReturn\\s*=\\s*\\{', '\\n\\};');
  const manifest = read('agent/prompt-manifest.json');

  assert.doesNotMatch(artifacts, /manualAudioHash/);
  assert.match(artifacts, /manualAudioReturnHash/);
  assert.doesNotMatch(request, /promptAttemptPath/);
  assert.match(artifacts, /derive[s]? the exact canonical[^\n]+promptAttemptPath/i);
  assert.match(result, /promptAttemptPath:\s*RepositoryArtifactPath/);
  assert.doesNotMatch(manifest, /<manual-audio-hash>/);
  assert.match(manifest, /<manual-audio-return-hash>/);
});

test('all local locator reads reject symlinks and bind one opened regular file handle', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const roleArtifacts = read('agent/contracts/role-artifact-contracts.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');

  for (const text of [acceptance, roleArtifacts, artifacts]) {
    assert.match(text, /lstat/i);
    assert.match(text, /(?:O_NOFOLLOW|no-follow)/i);
    assert.match(text, /same opened file handle|same file handle/i);
    assert.match(text, /(?:refus[^\n]+symlink|symlink[^\n]+refus)/i);
  }
  assert.doesNotMatch(roleArtifacts, /A symlink is accepted/i);
});

test('revision prompt distinguishes bounded operations from rebuild scopes', () => {
  const prompt = read('agent/prompts/revision-interpreter.md');
  assert.match(prompt, /bounded[^\n]+non-empty operation/i);
  assert.match(prompt, /rebuild[^\n]+non-empty[^\n]+authorizedScopes/i);
  assert.match(prompt, /rebuild[^\n]+forbid[^\n]+operations/i);
  assert.doesNotMatch(prompt, /Require a non-empty operation list with unique canonical operation keys and unique canonical impact keys/);
});

test('sound role names only the canonical prompt attempt contract', () => {
  const prompt = read('agent/prompts/sound-designer.md');
  const handoff = read('docs/workflows/audio-handoff.md');
  assert.doesNotMatch(prompt, /MusicPromptDocument\s*\{/);
  assert.doesNotMatch(prompt, /cutPayoff(?:Frame|Seconds)/);
  assert.match(prompt, /MusicPromptAttempt@1/);
  assert.match(prompt, /agent\/templates\/music-prompt-document\.md/);
  assert.match(handoff, /AudioBriefArtifact@1/);
  assert.doesNotMatch(handoff, /`AudioBrief@1`/);
});
