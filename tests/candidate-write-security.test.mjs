import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const rolePaths = [
  'agent/prompts/brief-planner.md',
  'agent/prompts/researcher.md',
  'agent/prompts/creative-direction.md',
  'agent/prompts/motion-planner.md',
  'agent/prompts/revision-interpreter.md',
  'agent/prompts/sound-designer.md',
  'agent/reviewers/creative-reviewer.md',
  'agent/reviewers/motion-reviewer.md',
];

test('role and reviewer bytes are persisted only by a trusted exclusive candidate writer', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  assert.match(acceptance, /type TrustedCandidateWriteRequest\s*=/);
  assert.match(acceptance, /type CandidateWriteReceipt\s*=/);
  assert.match(acceptance, /Ledger-derived[^\n]+candidate path/i);
  assert.match(acceptance, /O_WRONLY\s*\|\s*O_CREAT\s*\|\s*O_EXCL\s*\|\s*O_NOFOLLOW/);
  assert.match(acceptance, /mode `0600`/i);
  assert.match(acceptance, /regular file[^\n]+link count one/i);
  assert.match(acceptance, /file `fsync`[^\n]+parent-directory `fsync`/i);
  assert.match(acceptance, /role supplies only[^\n]+candidate bytes/i);
  assert.match(acceptance, /pre-existing[^\n]+refus/i);
  assert.match(acceptance, /read-only[^\n]+hash-bound input handles/i);
  assert.match(acceptance, /no ambient shell[^\n]+file-write[^\n]+rename[^\n]+delete/i);
  assert.match(acceptance, /no[^\n]+network[^\n]+environment[^\n]+credentials/i);
  assert.match(acceptance, /unable to enforce[^\n]+must refuse delegation/i);

  const writer = manifest.interfaces.find(({id}) => id === 'trusted-candidate-writer');
  assert.ok(writer, 'trusted writer missing from interface inventory');
  const outputs = manifest.roles.flatMap(({candidateOutputs}) => candidateOutputs);
  for (const role of manifest.roles) assert.deepEqual(role.writes, [], `${role.id} has ambient writes`);
  assert.deepEqual(new Set(writer.writes), new Set(outputs));

  for (const path of rolePaths) {
    const prompt = read(path);
    assert.match(prompt, /trusted candidate writer/i, `${path} omits trusted writer`);
    assert.match(prompt, /never (?:directly )?open/i, `${path} permits direct candidate open`);
  }
});
