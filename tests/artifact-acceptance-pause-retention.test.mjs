import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ledger = await readFile(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');

test('acceptance pause and retry retain the complete pending artifact object', () => {
  assert.match(ledger, /type ArtifactAcceptancePauseFor<R extends ArtifactRouteId>[\s\S]+pendingArtifact:\s*PendingArtifactForRoute<R>/);
  assert.match(ledger, /derived only from current `CandidateReadyControl`[^\n]+embeds its complete `pendingArtifact: PendingArtifactForRoute<R>` byte-for-byte/i);
  for (const binding of [
    'candidate path/schema/parents/context',
    'byte hash/length',
    'producer state',
    'producer decision/result receipt',
    'prompt binding',
  ]) assert.ok(ledger.includes(binding), `pause prose omits ${binding}`);
  assert.match(ledger, /state[^\n]+candidateByteHash[^\n]+acceptanceRouteId[^\n]+must equal[^\n]+embedded object/i);
  assert.match(ledger, /restores exactly `pause\.pendingArtifact`[^\n]+not a reconstructed object/i);
  assert.match(ledger, /No field from the retry[^\n]+may fill, replace, or default/i);
});
