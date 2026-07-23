import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('audio lineage reset rules close every downstream suffix', async () => {
  const ledger = await read('agent/contracts/workflow-ledger.md');
  const block = /type AudioLineageInvalidationRule\s*=([\s\S]*?);\n```/.exec(ledger)?.[1] ?? '';

  assert.match(block, /trigger:\s*"begin-audio-request";[\s\S]+clears:\s*\["audioBriefHash", "promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(block, /trigger:\s*"accept-audio-brief";[\s\S]+\["audioBriefHash", "promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(block, /trigger:\s*"generate-prompt-attempt";[\s\S]+\["promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(block, /trigger:\s*"accept-manual-audio-return";[\s\S]+\["manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(block, /trigger:\s*"complete-local-mux";[\s\S]+\["alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(block, /trigger:\s*"recover-manual-audio-reselect";[\s\S]+\["manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"\]/);
  assert.match(ledger, /delivery retry entering manual wait, mux, or delivery applies its target-specific tuple/i);
  assert.match(ledger, /appends every previously non-null superseded identity to `invalidatedContentHashes`/i);
  assert.match(ledger, /replaced head is superseded and recorded just like its descendants/i);
});

test('mixed delivery can become a clean new no-track lineage', async () => {
  const ledger = await read('agent/contracts/workflow-ledger.md');
  const workflow = await read('agent/video-workflow.md');
  const audio = await read('docs/workflows/audio-handoff.md');
  const corpus = `${ledger}\n${workflow}\n${audio}`;

  assert.match(ledger, /mixed delivery followed by a new `audio-request` can later select no track/i);
  assert.match(ledger, /no-track delivery precondition requires `manualAudioReturnHash`, `alignmentManifestHash`, `muxManifestHash`, and `mixedMasterHash` all to be null/i);
  assert.match(ledger, /`manual-audio-reselect` recovery[\s\S]+null manual-through-delivery suffix/i);
  assert.match(workflow, /No-track is valid only[\s\S]+manual-return, alignment, mux-manifest, and mixed-master[\s\S]+all null/i);
  assert.match(audio, /switching from a previous mixed delivery to a new no-track selection[\s\S]+all four current fields/i);
  assert.doesNotMatch(corpus, /no-track branch[^\n]+requires all three mux lineage hashes/i);
});
