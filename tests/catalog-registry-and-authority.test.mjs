import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('a fresh project has one local validated catalog and capability-registry cold start', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const registry = JSON.parse(read('catalog/core-registry.json'));
  const contract = read('agent/contracts/catalog-registry-contract.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const engine = read('agent/contracts/engine-interface.md');
  const treatment = read('agent/contracts/treatment-contract.md');

  assert.ok(manifest.contracts.includes('agent/contracts/catalog-registry-contract.md'));
  assert.deepEqual(
    manifest.interfaces.find(({id}) => id === 'catalog-registry-snapshot'),
    {
      id: 'catalog-registry-snapshot',
      status: 'required-not-implemented',
      contract: 'agent/contracts/catalog-registry-contract.md',
      reads: ['catalog/core-registry.json'],
      writes: [],
    },
  );

  assert.equal(registry.schemaVersion, 'catalog-registry-snapshot@1');
  assert.equal(registry.scope, 'core');
  assert.equal(registry.parentSnapshotHash, null);
  assert.deepEqual(registry.implementationBindingHashes, []);
  for (const key of ['motionProfiles', 'stylePacks', 'capabilities']) {
    assert.ok(registry[key].length > 0, `${key} is empty`);
    const ids = registry[key].map(({id}) => id);
    assert.deepEqual(ids, [...ids].sort(), `${key} is not sorted`);
    assert.equal(new Set(ids).size, ids.length, `${key} IDs are not unique`);
  }
  assert.ok(registry.capabilities.every(({implementationStatus}) => implementationStatus === 'part2-required'));
  assert.doesNotMatch(JSON.stringify(registry), /https?:\/\/|api[_ -]?key|remote provider/i);

  assert.match(contract, /registrySnapshotHash[\s\S]+RFC 8785/i);
  assert.match(decision, /"catalog-registry-snapshot"/);
  assert.match(decision, /fromState: "TREATMENT"; toState: "TREATMENT"; interfaceId: "catalog-registry-snapshot"/);
  assert.match(decision, /fromState: "MOTION_SPEC"; toState: "MOTION_SPEC"; interfaceId: "catalog-registry-snapshot"/);
  assert.match(engine, /Catalog\/registry snapshot[\s\S]+registrySnapshotHash/i);
  assert.match(engine, /interfaceId: "catalog-registry-snapshot"[\s\S]+continuationState: S/i);
  assert.match(treatment, /catalogRegistrySnapshotHash: string/);
});

test('FACT_CHECK route authority remains with orchestration rather than an unreachable Brief role', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const brief = read('agent/prompts/brief-planner.md');
  const authority = read('agent/contracts/authority-matrix.md');
  const briefRole = manifest.roles.find(({id}) => id === 'brief-planner');

  assert.ok(!briefRole.authority.includes('fact-check'));
  assert.doesNotMatch(brief, /Own[^\n]+`FACT_CHECK` decision/i);
  assert.match(brief, /orchestrator alone owns the `FACT_CHECK` state/i);
  assert.match(authority, /`FACT_CHECK` closure and `facts-closed` route \| Orchestrator/i);
});

test('role semantic-output manifests enumerate attempt roots while direct writes stay empty', () => {
  const manifestText = read('agent/prompt-manifest.json');
  const manifest = JSON.parse(manifestText);
  const role = (id) => manifest.roles.find((entry) => entry.id === id);

  assert.doesNotMatch(manifestText, /<candidate-root>/);
  for (const entry of manifest.roles) assert.deepEqual(entry.writes, [], `${entry.id} has direct writes`);
  assert.deepEqual(role('researcher').candidateOutputs, [
    'projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/research.findings.json',
  ]);
  for (const [id, file] of [
    ['brief-planner', 'brief.spec.json'],
    ['creative-direction', 'treatment.json'],
  ]) {
    assert.deepEqual(role(id).candidateOutputs, [
      `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/${file}`,
      `projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/${file}`,
    ]);
  }
  assert.ok(role('motion-planner').candidateOutputs.includes('projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/motion.spec.json'));
  assert.ok(role('motion-planner').candidateOutputs.includes('projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/motion.spec.json'));

  for (const path of [
    'agent/prompts/brief-planner.md',
    'agent/prompts/researcher.md',
    'agent/prompts/creative-direction.md',
    'agent/prompts/motion-planner.md',
  ]) assert.doesNotMatch(read(path), /<candidate-root>/, path);
});

test('Sound Designer consumes a valid approval artifact without inventing an approval decision field', () => {
  const sound = read('agent/prompts/sound-designer.md');
  const craft = read('craft/sound-design.md');

  assert.doesNotMatch(sound, /PreviewApproval@1` with decision|Preview Approval is not `approved`/i);
  assert.match(sound, /artifact has no separate `decision` field/i);
  assert.match(craft, /loaded only for Sound Designer in `AUDIO_BRIEF`/i);
  assert.match(craft, /`AUDIO_PROMPT` never reloads this creative craft/i);
  assert.doesNotMatch(craft, /Read an existing AudioBrief only/i);
});
