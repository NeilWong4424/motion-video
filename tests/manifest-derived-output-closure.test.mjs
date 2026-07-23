import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('every multi-output derived hash has a declared immutable artifact or closed projection', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const byId = new Map(manifest.interfaces.map((entry) => [entry.id, entry]));

  assert.ok(byId.get('resolver-compiler').writes.some((path) => path.endsWith('/resolved-motion-ir.json')));
  assert.ok(byId.get('resolver-compiler').writes.some((path) => path.endsWith('/render-plan.json')));
  assert.ok(byId.get('local-alignment-mux').writes.some((path) => path.endsWith('/alignment-manifest.json')));
  assert.ok(byId.get('local-alignment-mux').writes.some((path) => path.endsWith('/mux-manifest.json')));
  assert.ok(byId.get('local-alignment-mux').writes.some((path) => path.endsWith('/mixed-master.mp4')));
  assert.ok(byId.get('preview-evidence-renderer').writes.some((path) => path.endsWith('/evidence-manifest.json')));
  assert.ok(byId.get('preview-evidence-renderer').writes.some((path) => path.includes('/evidence/items/<evidence-id>')));
  assert.ok(byId.get('technical-qc').writes.some((path) => path.endsWith('/technical-qc.json')));
  assert.ok(byId.get('approval-recorder').writes.some((path) => path.endsWith('/preview-approval.json')));
  assert.ok(byId.get('silent-final-renderer').writes.some((path) => path.endsWith('/render-manifest.json')));
  assert.ok(byId.get('delivery-packager').writes.some((path) => path.endsWith('/delivery-manifest.json')));

  for (const type of [
    'ResolvedMotionIR', 'RenderPlan', 'SampledEvidenceManifest', 'TechnicalQCReport',
    'PreviewApproval', 'RenderManifestArtifact', 'AudioAlignmentManifest', 'MuxManifest',
    'DeliveryManifest',
  ]) {
    assert.match(artifacts, new RegExp(`type ${type}\\s*=`), `missing closed ${type}`);
  }
  for (const identity of [
    'resolvedMotionIrHash', 'renderPlanHash', 'sampledEvidenceManifestHash', 'technicalQcHash',
    'previewApprovalHash', 'renderManifestHash', 'alignmentManifestHash', 'muxManifestHash',
    'mixedMasterHash', 'deliveryManifestHash',
  ]) {
    assert.match(artifacts, new RegExp(`${identity}[^\\n]+SHA-256|SHA-256[^\\n]+${identity}`, 'i'), `missing hash law ${identity}`);
  }
  assert.match(artifacts, /type MuxManifest[\s\S]+mixedMasterHash:\s*string/);
  assert.match(artifacts, /type DeliveryManifest[\s\S]+selection:\s*DeliveryAudioSelection/);
  assert.match(artifacts, /DeliveryManifest[^\n]+contains no self identity/i);
});

test('motion planner manifest includes both initial and rebuild capability-gap candidates', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const outputs = manifest.roles.find(({id}) => id === 'motion-planner').candidateOutputs;
  assert.ok(outputs.includes('projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/capability-gap.json'));
  assert.ok(outputs.includes('projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/capability-gap.json'));
});

test('manifest resource inventory covers normative procedures and every operator template', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  assert.match(manifest.resourceInventoryScope, /every non-role local file directly loaded/i);
  const paths = manifest.resources.map(({path}) => path);
  const ids = manifest.resources.map(({id}) => id);
  assert.deepEqual(ids, [...ids].sort());
  assert.equal(new Set(paths).size, paths.length);

  for (const path of [
    'agent/templates/music-prompt-document.md',
    'catalog/core-registry.json',
    'craft/skill-manifest.json',
    'docs/workflows/audio-handoff.md',
    'docs/workflows/capability-gap.md',
    'docs/workflows/revision.md',
    'projects/_template/BRIEF_INPUT.md',
    'projects/_template/LOCAL_SOURCES.md',
    'projects/_template/REVISION_REQUEST.md',
    'projects/_template/project.policy.example.json',
  ]) {
    assert.ok(paths.includes(path), `resource inventory missing ${path}`);
    assert.ok(existsSync(resolve(root, path)), `missing resource ${path}`);
  }
});
