import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Motion Planner limits positive transition fields to positive-duration bridges', () => {
  const prompt = read('agent/prompts/motion-planner.md');

  assert.match(
    prompt,
    /For positive-duration bridges only,[^\n]+motion ownership[^\n]+transition family[^\n]+vocabulary role/i,
  );
  assert.match(
    prompt,
    /chapter cut[^\n]+must omit[^\n]+motion ownership[^\n]+transition family[^\n]+vocabulary role/i,
  );
});

test('chapter-cut held evidence binds exactly to the incoming Beat resolved hold start', () => {
  const contract = read('agent/contracts/review-contract.md');

  assert.match(
    contract,
    /incomingHoldStartFrame\s*===\s*resolvedIncomingHoldRange\.startFrame/,
  );
  assert.match(
    contract,
    /incomingHeld\.frameIndex\s*===\s*incomingHoldStartFrame/,
  );
  assert.match(
    contract,
    /resolvedIncomingHoldRange\.startFrame\s*<=\s*incomingHoldStartFrame\s*<\s*resolvedIncomingHoldRange\.endFrameExclusive/,
  );
});

test('Motion Reviewer verifies the exact incoming hold binding for chapter cuts', () => {
  const prompt = read('agent/reviewers/motion-reviewer.md');

  assert.match(
    prompt,
    /incomingHoldStartFrame[^\n]+exactly equal[^\n]+resolved incoming Beat[^\n]+holdRange[^\n]+start/i,
  );
  assert.match(
    prompt,
    /incomingHeld\.frameIndex[^\n]+exactly equal[^\n]+incomingHoldStartFrame[^\n]+inside[^\n]+resolved hold range/i,
  );
});
