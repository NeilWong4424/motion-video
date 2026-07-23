import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('artifact producer-state rows use one literal discriminator each', async () => {
  const decision = await read('agent/contracts/workflow-decision.md');
  const block = /type ArtifactProducerStateRule\s*=([\s\S]*?);\n\ntype AcceptanceProducerStateFor/.exec(decision)?.[1] ?? '';
  const rows = [...block.matchAll(/acceptanceRouteId:\s*([^;]+);\s*producerState:/g)].map((match) => match[1]);

  assert.ok(rows.length > 0, 'ArtifactProducerStateRule rows were not found');
  for (const discriminator of rows) {
    assert.match(discriminator, /^"[^"]+"$/, `union-valued discriminator row: ${discriminator}`);
    assert.doesNotMatch(discriminator, /\|/);
  }
});

test('recovered result kind is derived distributively from original action kind', async () => {
  const engine = await read('agent/contracts/engine-interface.md');

  assert.match(engine, /type RecoveredResultBindingForAction<A extends PendingNormalAction>/);
  assert.match(engine, /originalAction:\s*A;/);
  assert.match(engine, /resultKind:\s*A\["kind"\] extends "role" \? "role-result" : "interface-result"/);
  assert.match(engine, /type RecoveredResultBindingFor<S extends NormalActionExecutionState>[\s\S]+A extends PendingNormalAction[\s\S]+RecoveredResultBindingForAction<A>/);
  assert.doesNotMatch(engine, /type RecoveredResultBindingFor<S extends NormalActionExecutionState>\s*=\s*\{[\s\S]{0,180}resultKind:\s*"role-result"\s*\|\s*"interface-result"/);
});
