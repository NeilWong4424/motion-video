import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('local source ingress has a closed non-opaque format map and exact resource ceilings', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  assert.match(acceptance, /type VerifiedFormatExtension\s*=/);
  assert.doesNotMatch(acceptance, /\|\s*"bin"/);
  for (const format of ['"png"', '"woff2"', '"json"', '"txt"', '"pdf"', '"wav"', '"mp4"']) {
    assert.ok(acceptance.includes(format), `missing supported format ${format}`);
  }

  assert.match(acceptance, /type LocalIngressBudget\s*=\s*\{/);
  for (const ceiling of [
    'maxFilesPerRequest: 32',
    'maxTotalEncodedBytes: 536870912',
    'maxSingleEncodedBytes: 268435456',
    'maxCumulativeDecodedBytes: 2147483648',
    'maxRasterDimension: 8192',
    'maxRasterPixels: 33554432',
    'maxRasterFrames: 1',
    'maxDocumentPages: 1000',
    'maxReferenceDurationSeconds: 300',
    'maxReferenceVideoFrames: 18000',
  ]) {
    assert.ok(acceptance.includes(ceiling), `missing exact ingress ceiling ${ceiling}`);
  }
  assert.match(acceptance, /exceed(?:s|ed|ing)? any[^\n]+refus/i);
});

test('credential and executable configuration classes are refused before destination creation', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');

  assert.match(acceptance, /before (?:any )?destination[^\n]+creat/i);
  assert.match(acceptance, /private[- ]key/i);
  assert.match(acceptance, /credential/i);
  assert.match(acceptance, /environment configuration|\.env/i);
  assert.match(acceptance, /must not (?:be )?(?:staged|copied)|refus/i);
  assert.match(acceptance, /safe diagnostic/i);
});

test('manual returned audio has exact encoded and decoded media limits', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');

  assert.match(artifacts, /type ManualAudioIngressBudget\s*=\s*\{/);
  for (const ceiling of [
    'maxEncodedBytes: 268435456',
    'maxDecodedBytes: 536870912',
    'maxDurationSeconds: 300',
    'maxSampleRateHz: 192000',
    'maxChannels: 8',
  ]) {
    assert.ok(artifacts.includes(ceiling), `missing exact manual-audio ceiling ${ceiling}`);
  }
});
