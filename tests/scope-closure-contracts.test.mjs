import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('rebuild authorization is constrained by owner and rebuild boundary', () => {
  const revision = read('agent/contracts/revision-contract.md');
  const interpreter = read('agent/prompts/revision-interpreter.md');

  assert.match(revision, /type BriefRebuildTarget\s*=\s*Extract<SemanticImpactTarget,\s*\{entity:\s*"brief"\}>/i);
  assert.match(revision, /type CreativeRebuildTarget\s*=\s*Extract<SemanticImpactTarget,\s*\{entity:\s*"treatment"\s*\|\s*"treatment-arc-step"\s*\|\s*"beat-intention"\s*\|\s*"camera-rationale"\}>/i);
  assert.match(revision, /type MotionRebuildTarget\s*=\s*Extract<SemanticImpactTarget,\s*\{[\s\S]{0,100}entity:[\s\S]+"beat"[\s\S]+"token"[\s\S]{0,20}\}>/i);
  assert.match(revision, /owner:\s*"brief-planner";\s*target:\s*BriefRebuildTarget/i);
  assert.match(revision, /owner:\s*"creative-direction";\s*target:\s*CreativeRebuildTarget/i);
  assert.match(revision, /owner:\s*"motion-planner";\s*target:\s*MotionRebuildTarget/i);
  assert.match(revision, /rebuildFrom:\s*"treatment";[\s\S]+authorizedScopes:\s*\[TreatmentOrMotionRebuildScope,/i);
  assert.match(revision, /rebuildFrom:\s*"motion-spec";[\s\S]+authorizedScopes:\s*\[MotionOnlyRebuildScope,/i);
  assert.match(interpreter, /owner-target pair[\s\S]+rebuildFrom/i);
});

test('visual source and MotionSpec contracts expose no audio render substrate', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const motion = read('agent/contracts/motion-spec-contract.md');
  const planner = read('agent/prompts/motion-planner.md');

  assert.doesNotMatch(acceptance, /render-audio/i);
  assert.doesNotMatch(motion, /render-audio/i);
  assert.match(acceptance, /audio[\s\S]{0,240}research-reference/i);
  assert.match(acceptance, /ManualAudioIngressRequest[\s\S]{0,260}(?:separate|outside)[\s\S]{0,160}MotionSpec/i);
  assert.match(planner, /audio[\s\S]{0,240}(?:not|never)[\s\S]{0,240}(?:node|render substrate|MotionSpec)/i);
});

test('capability receipt path is authorization-hash addressed and immutable', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const authority = read('agent/contracts/authority-matrix.md');
  const gap = read('docs/workflows/capability-gap.md');
  const builder = read('agent/prompts/capability-builder.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const iface = manifest.interfaces.find(({id}) => id === 'project-local-capability-implementation-and-registration');
  const receiptPath = 'projects/<project-id>/capabilities/<capability-id>/<capability-version>/receipts/<implementation-authorization-hash>/implementation-receipt.json';

  assert.ok(iface, 'missing project-local capability implementation interface');
  assert.ok(iface.writes.includes(receiptPath), 'manifest must use immutable authorization-hash receipt path');
  assert.ok(!iface.writes.includes('projects/<project-id>/capabilities/<capability-id>/implementation-receipt.json'));
  assert.match(acceptance, /receiptPath:\s*string/);
  assert.ok(acceptance.includes(receiptPath));
  assert.match(acceptance, /receipt path[\s\S]{0,240}(?:must not|excluded from)[\s\S]{0,160}exactFileManifest/i);
  assert.match(acceptance, /no pre-existing target or overwrite is accepted/i);
  assert.match(acceptance, /different bytes at the same derived path refuse/i);
  assert.match(authority, /protocol-derived[\s\S]{0,180}receipt/i);
  assert.match(gap, /authorization-hash[\s\S]{0,220}receipt/i);
  assert.match(builder, /futureExactFileManifest[\s\S]{0,260}(?:must not|excludes?)[\s\S]{0,180}implementation receipt/i);
});

test('stale capability route evidence remains a recoverable CAPABILITY_GAP pause', () => {
  const contract = read('agent/contracts/capability-gap-contract.md');
  const workflow = read('agent/video-workflow.md');

  assert.match(contract, /stale or mismatched decision[\s\S]{0,220}remain in `CAPABILITY_GAP`/i);
  assert.match(workflow, /stale\/mismatched[\s\S]{0,220}CAPABILITY_GAP[\s\S]{0,220}(?:pause|recover)/i);
  assert.doesNotMatch(workflow, /decline\/stale\/unsupported\s*→\s*terminal/i);
  assert.match(workflow, /explicit human decline[\s\S]{0,180}terminal/i);
});
