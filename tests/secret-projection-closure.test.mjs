import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ledger = readFileSync(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');

test('explicit credential forms redact even short values with a deterministic grammar', () => {
  assert.match(ledger, /Bearer[^\n]+1[–-]512 bytes/i);
  assert.match(ledger, /Basic[^\n]+1[–-]512 bytes/i);
  assert.match(ledger, /labeled credential key/i);
  for (const key of ['apikey', 'accesskey', 'accesstoken', 'authtoken', 'clientsecret', 'privatekey', 'token', 'secret', 'password', 'passwd', 'pwd']) {
    assert.match(ledger, new RegExp(`\\b${key}\\b`, 'i'));
  }
  assert.match(ledger, /separator is exactly one `=` or `:`/i);
  assert.match(ledger, /CLI credential flag/i);
  assert.match(ledger, /--api-key/);
  assert.match(ledger, /--password/);
  assert.match(ledger, /prefixed token[^\n]+1[–-]256/i);
  assert.doesNotMatch(ledger, /authorization credential[^\n]+8[–-]512/i);
  assert.doesNotMatch(ledger, /prefixed token[^\n]+16[–-]256/i);
});

test('pasted private keys are one bounded secret match before durable hashing', () => {
  assert.match(ledger, /BEGIN PRIVATE KEY/);
  assert.match(ledger, /OPENSSH PRIVATE KEY/);
  assert.match(ledger, /matching bounded end marker refuses the input before hashing/i);
  assert.match(ledger, /complete block is at most 65,536 bytes/i);
  assert.match(ledger, /whole block is one secret match/i);
});

test('secret matching order and redaction are idempotent and precede ID promotion', () => {
  assert.match(ledger, /choose PEM, authorization, labeled assignment, CLI flag, provider prefix, then generic token/i);
  assert.match(ledger, /complete transform is idempotent/i);
  assert.match(ledger, /raw free-text candidates before they can be promoted to closed IDs/i);
  assert.match(ledger, /before computing any hash that may be written durably/i);
});
