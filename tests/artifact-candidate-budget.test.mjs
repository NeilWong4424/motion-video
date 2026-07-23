import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const acceptance = await readFile(new URL('../agent/contracts/artifact-acceptance.md', import.meta.url), 'utf8');

test('candidate writer and acceptance enforce finite JSON budgets before parse or write', () => {
  assert.match(acceptance, /type ArtifactCandidateBudget\s*=\s*\{/);
  assert.match(acceptance, /maxUtf8Bytes:\s*8388608/);
  assert.match(acceptance, /maxJsonDepth:\s*128/);
  assert.match(acceptance, /maxJsonTokens:\s*262144/);
  assert.match(acceptance, /maxObjectMembersPerObject:\s*65536/);
  assert.match(acceptance, /maxArrayMembersPerArray:\s*65536/);
  assert.match(acceptance, /maxStringUnicodeScalarsPerValue:\s*65536/);
  assert.match(acceptance, /maxStringUnicodeScalarsTotal:\s*1048576/);

  assert.match(acceptance, /type ReviewCandidateBudget\s*=\s*\{/);
  assert.match(acceptance, /Creative- and Motion-Review candidates use `ReviewCandidateBudget`/);
  assert.match(acceptance, /Before creating a destination[^\n]+bounded streaming JSON\/JCS/i);
  assert.match(acceptance, /duplicate-key[^\n]+byte limit fails/i);
  assert.match(acceptance, /never truncates[^\n]+unbounded in-memory tree/i);
  assert.match(acceptance, /Acceptance independently repeats[^\n]+same safely reopened and rehashed candidate handle/i);
  assert.match(acceptance, /No parser[^\n]+may consume a candidate that failed, bypassed, or predates/i);
});
