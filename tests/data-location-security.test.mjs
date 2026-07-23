import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const contract = readFileSync(new URL('../agent/contracts/role-artifact-contracts.md', import.meta.url), 'utf8');

test('research data locations use structured segments rather than slash-form pointers', () => {
  assert.match(contract, /type SafeDataKeyToken\s*=/);
  assert.match(contract, /type DataPathSegment\s*=/);
  assert.match(contract, /kind:\s*"object-key";\s*keyToken:\s*SafeDataKeyToken/);
  assert.match(contract, /kind:\s*"array-index";\s*index:\s*NonNegativeInteger/);
  assert.match(contract, /kind:\s*"data-path";\s*segments:\s*DataPathSegment\[\]/);
  assert.doesNotMatch(contract, /jsonPointer:\s*string/);
  assert.match(contract, /canonical base64url/i);
  assert.match(contract, /exact original UTF-8 bytes/i);
  assert.match(contract, /Unicode normalization is forbidden/i);
  assert.match(contract, /NFC and NFD[^\n]+remain distinct[^\n]+cannot alias/i);
  assert.match(contract, /no slash, backslash, colon/i);
  assert.match(contract, /exact accepted JSON source/i);
});
