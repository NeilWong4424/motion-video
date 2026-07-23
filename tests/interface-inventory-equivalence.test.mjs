import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const quotedMembers = (block) => [...block.matchAll(/\|\s*"([^"]+)"/g)].map((match) => match[1]);

test('manifest workflow and closed result union expose the same interface inventory', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const decision = read('agent/contracts/workflow-decision.md');
  const engine = read('agent/contracts/engine-interface.md');
  const idBlock = /type WorkflowInterfaceId\s*=([\s\S]*?);\n\ntype OutOfScopeCode/.exec(decision)?.[1] ?? '';
  const workflowIds = quotedMembers(idBlock).sort();
  const manifestIds = manifest.interfaces
    .map(({id}) => id)
    .filter((id) => !['workflow-ledger-recorder', 'trusted-candidate-writer'].includes(id))
    .sort();

  assert.deepEqual(manifestIds, workflowIds);
  assert.match(engine, /Workflow ledger recorder/i);
  assert.match(engine, /Trusted candidate writer/i);
  for (const id of workflowIds) {
    assert.match(engine, new RegExp(`interfaceId: "${id}"`), `closed result union omits ${id}`);
  }
  for (const entry of manifest.interfaces) {
    assert.ok(existsSync(resolve(root, entry.contract)), `${entry.id} contract is missing`);
  }
});

test('diagnostic code map is exhaustive and every route has a workflow consumer', () => {
  const diagnostics = read('agent/contracts/diagnostics.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const codeBlock = /type DiagnosticCode\s*=([\s\S]*?);\n\n/.exec(diagnostics)?.[1] ?? '';
  const mapBlock = /type DiagnosticRouteMap\s*=\s*\{([\s\S]*?)\n\};/.exec(diagnostics)?.[1] ?? '';
  const routeBlock = /type DiagnosticRouteId\s*=([\s\S]*?);\n\n/.exec(diagnostics)?.[1] ?? '';
  const codes = quotedMembers(codeBlock).sort();
  const mappedCodes = [...mapBlock.matchAll(/^\s{2}([A-Z][A-Z0-9_]+):/gm)].map((match) => match[1]).sort();
  const routeIds = quotedMembers(routeBlock);

  assert.deepEqual(mappedCodes, codes);
  for (const routeId of routeIds) {
    assert.match(decision, new RegExp(`"${routeId}"`), `workflow has no consumer for ${routeId}`);
  }
});
