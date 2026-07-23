import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const canonicalize = (value) => {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
};

test('completed reviewer examples carry the exact derived evidence hash', () => {
  for (const path of [
    'agent/reviewers/creative-reviewer.md',
    'agent/reviewers/motion-reviewer.md',
  ]) {
    const source = read(path);
    const json = /```json\n([\s\S]*?)\n```/.exec(source)?.[1];
    assert.ok(json, `missing reviewer JSON example in ${path}`);
    const example = JSON.parse(json);
    const projection = {
      evidenceRefs: example.evidenceRefs,
      playbackEvidence: example.playbackEvidence,
      bridgeEvidence: example.bridgeEvidence,
    };
    const actual = createHash('sha256').update(canonicalize(projection)).digest('hex');
    assert.equal(example.evidenceHash, actual, `${path} evidenceHash drifted from its JCS projection`);
  }
});
