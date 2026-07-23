import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('pending candidates retain recorder-derived producer correlation', async () => {
  const decision = await read('agent/contracts/workflow-decision.md');
  const ledger = await read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type RoleCandidateProducerCorrelationFor<R extends ArtifactRouteId>/);
  assert.match(decision, /roleRouteId:\s*D\["roleRouteId"\]/);
  assert.match(decision, /capabilityGapRoute:\s*CapabilityGapRouteFieldForRole<D>\["capabilityGapRoute"\]/);
  assert.match(decision, /type InterfaceCandidateProducerCorrelationFor<R extends ArtifactRouteId>/);
  assert.match(decision, /type CandidateProducerCorrelationFor<R extends ArtifactRouteId>/);
  assert.match(ledger, /type PendingArtifactForRoute<R extends ArtifactRouteId>[\s\S]+producerCorrelation:\s*CandidateProducerCorrelationFor<R>/);
  assert.match(ledger, /derives `producerCorrelation` from the complete pending role action/i);
  assert.match(ledger, /candidate\/model cannot supply or alter this correlation/i);
});

test('honest approximation rejection returns to the same active capability gap', async () => {
  const decision = await read('agent/contracts/workflow-decision.md');
  const ledger = await read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /acceptanceRouteId:\s*"initial-motion-spec";\s*producerRoleRouteId:\s*"initial-motion-planning";\s*recoveryState:\s*"MOTION_SPEC"/);
  assert.match(decision, /acceptanceRouteId:\s*"initial-motion-spec";\s*producerRoleRouteId:\s*"initial-gap-honest-approximation";\s*recoveryState:\s*"CAPABILITY_GAP"/);
  assert.match(decision, /acceptanceRouteId:\s*"rebuild-motion-spec";\s*producerRoleRouteId:\s*"rebuild-motion-planning";\s*recoveryState:\s*"REBUILD_AUTHORING"/);
  assert.match(decision, /acceptanceRouteId:\s*"rebuild-motion-spec";\s*producerRoleRouteId:\s*"rebuild-gap-honest-approximation";\s*recoveryState:\s*"CAPABILITY_GAP"/);
  assert.match(decision, /type CandidateRejectionRecoveryRoute\s*=\s*\n\s*CandidateRejectionContinuation extends infer C/);
  assert.match(decision, /producerCorrelation:[\s\S]+Extract<CandidateProducerCorrelationFor<C\["acceptanceRouteId"\]>/);
  assert.match(ledger, /type PendingCandidateRejectionActionFor<R extends CandidateRejectionRecoveryRoute>[\s\S]+producerCorrelation:\s*R\["producerCorrelation"\]/);
  assert.match(ledger, /ordinary MotionSpec refusal cannot select the honest-approximation recovery/i);
  assert.match(ledger, /Rejection never clears the gap/i);
});

test('honest approximation acceptance clears only its exactly bound gap', async () => {
  const ledger = await read('agent/contracts/workflow-ledger.md');

  assert.match(ledger, /acceptance success requires byte equality[\s\S]+recorded route decision[\s\S]+`activeCapabilityGap`/i);
  assert.match(ledger, /atomically clears `activeCapabilityGap` before taking[\s\S]+`VALIDATE` continuation/i);
  assert.match(ledger, /ordinary `initial-motion-planning` or `rebuild-motion-planning` MotionSpec candidate is accepted only when `activeCapabilityGap` is null/i);
});
