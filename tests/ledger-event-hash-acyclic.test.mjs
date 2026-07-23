import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ledger = readFileSync(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');

test('ledger state references a non-self event binding rather than its enclosing chain hash', () => {
  assert.match(ledger, /type LedgerEventBindingProjection/);
  assert.match(ledger, /eventBindingHash:\s*string/);
  assert.match(ledger, /eventBindingHash[^\n]+SHA-256[^\n]+LedgerEventBindingProjection/i);
  assert.match(ledger, /projection[^\n]+omits[^\n]+stateAfter[^\n]+eventBindingHash[^\n]+eventHash/i);
  assert.match(ledger, /invocationEventHash[^\n]+matching `eventBindingHash`/i);
  assert.match(ledger, /decisionEventHash[^\n]+matching `eventBindingHash`/i);
  assert.match(ledger, /advisoryResultReceiptHash[^\n]+verified `RoleResultRecordedPayload\.resultReceiptHash`/i);
  assert.match(ledger, /eventHash[^\n]+complete event[^\n]+only `eventHash` omitted/i);
  assert.match(ledger, /no fixed point|non-self-referential/i);
});

test('a torn ledger append has one fail-closed rollback or terminal classification', () => {
  assert.match(ledger, /ftruncate[^\n]+same verified inode[^\n]+pre-append size/i);
  assert.match(ledger, /successful verified rollback[^\n]+identical retry/i);
  assert.match(ledger, /partial suffix\/torn event[^\n]+terminal Ledger corruption/i);
  assert.match(ledger, /never truncates a suffix discovered after releasing[^\n]+append lock/i);
  assert.doesNotMatch(ledger, /torn tails[^\n]+enter recovery/i);
});
