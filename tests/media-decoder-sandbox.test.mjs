import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all untrusted media consumers inherit closed decode and render sandboxes', async () => {
  const acceptance = await read('agent/contracts/artifact-acceptance.md');
  const engine = await read('agent/contracts/engine-interface.md');
  const researcher = await read('agent/prompts/researcher.md');
  const artifacts = await read('agent/contracts/artifact-contracts.md');

  assert.match(acceptance, /type MediaDecodeSandbox\s*=\s*\{/);
  assert.match(acceptance, /maxCpuMillisecondsPerInput:\s*15000/);
  assert.match(acceptance, /maxWallMillisecondsPerInput:\s*30000/);
  assert.match(acceptance, /maxResidentBytes:\s*536870912/);
  assert.match(acceptance, /maxDecodedOutputBytesPerInput:\s*536870912/);
  assert.match(acceptance, /maxOpenFileDescriptors:\s*16/);
  assert.match(acceptance, /maxChildProcesses:\s*0/);
  assert.match(acceptance, /maxWritableFilesystemBytes:\s*0/);
  assert.match(acceptance, /already-open[^\n]+no-followed[^\n]+rehashed[^\n]+same handle/i);
  assert.match(acceptance, /no network[^\n]+environment[^\n]+credentials[^\n]+ambient host filesystem/i);
  assert.match(acceptance, /missing sandbox support[^\n]+refus/i);

  assert.match(acceptance, /type MotionRenderSandbox\s*=\s*\{/);
  assert.match(acceptance, /Preview and final rendering[^\n]+`MotionRenderSandbox`/i);
  assert.match(acceptance, /exact hash-verified accepted asset descriptors/i);
  assert.match(acceptance, /pre-opened exact output destinations/i);
  assert.match(acceptance, /All asset decoders[^\n]+`MediaDecodeSandbox`/i);

  assert.match(engine, /MediaDecodeSandbox/);
  assert.match(engine, /MotionRenderSandbox/);
  assert.match(researcher, /MediaDecodeSandbox/);
  assert.match(researcher, /bounded typed (?:inspection )?output/i);
  assert.match(artifacts, /MediaDecodeSandbox/);
});
