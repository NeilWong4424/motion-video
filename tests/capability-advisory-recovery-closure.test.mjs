import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('capability advisory payload cannot cross initial/rebuild context or decision branch', async () => {
  const result = await read('agent/contracts/role-result.md');

  assert.match(result, /type CapabilityGapRouteDecisionFor<[\s\S]+Omit<CapabilityGapRouteDecision, "decision" \| "originPlanningContext">[\s\S]+decision:\s*D;[\s\S]+originPlanningContext:\s*C/);
  assert.match(result, /type ProjectLocalCapabilityProposal<C extends OriginPlanningContext>\s*=\s*\{/);
  assert.match(result, /routeDecision:\s*CapabilityGapRouteDecisionFor<"future-project-local-proposal", C>/);
  assert.doesNotMatch(result, /Extract<CapabilityGapRouteDecision,\s*\{decision:\s*"future-project-local-proposal"\}>/);
  assert.match(result, /originPlanningContext:\s*C/);
  assert.match(result, /nonCanonicalPayload:\s*ProjectLocalCapabilityProposal<Extract<OriginPlanningContext,\s*\{kind:\s*R\["originPlanningKind"\]\}>>/);
  assert.match(result, /byte equality[^\n]+already recorded decision/i);
  assert.match(result, /cross-context[^\n]+invalid/i);
});

test('recovered advisory uses its stable result receipt through authorization and receipt acceptance', async () => {
  const ledger = await read('agent/contracts/workflow-ledger.md');
  const acceptance = await read('agent/contracts/artifact-acceptance.md');
  const workflow = await read('agent/video-workflow.md');
  const procedure = await read('docs/workflows/capability-gap.md');
  const examples = await read('examples/invocations.md');

  assert.match(ledger, /activeCapabilityGap:[\s\S]+advisoryResultReceiptHash:\s*string \| null/);
  assert.match(ledger, /normal `role-result-recorded` reducer and a reconciliation `matching-result-found` reducer[^\n]+same stable receipt identity/i);
  assert.match(ledger, /Recovery never depends on an event[^\n]+pre-append crash/i);
  assert.match(ledger, /awaiting-capability-implementation[\s\S]+advisoryResultReceiptHash:\s*string/);
  assert.match(ledger, /type CapabilityImplementationAuthorization[\s\S]+advisoryResultReceiptHash:\s*string/);
  assert.match(acceptance, /Parent<"advisoryResultReceiptHash">/);
  assert.match(acceptance, /`future-project-local-proposal` route decision authorizes no writes/);
  assert.match(acceptance, /type CapabilityImplementationReceipt[\s\S]+advisoryResultReceiptHash:\s*string/);
  assert.match(workflow, /stable advisoryResultReceiptHash/);
  const corpus = `${ledger}\n${acceptance}\n${workflow}\n${procedure}\n${examples}`;
  assert.doesNotMatch(corpus, /advisoryEventHash|advisory-event hash|advisory event/i);
});
