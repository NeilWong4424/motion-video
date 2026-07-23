import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ledger = await readFile(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');
const examples = await readFile(new URL('../examples/invocations.md', import.meta.url), 'utf8');

test('actor-free human envelopes distribute over concrete operator-input variants', () => {
  assert.match(ledger, /type ActorFree<I>\s*=\s*I extends HumanWorkflowOperatorInput\s*\?\s*Omit<I, "actor">\s*:\s*never/);
  assert.match(ledger, /type EphemeralHumanOperatorInputEnvelope<I extends HumanWorkflowOperatorInput>\s*=\s*I extends HumanWorkflowOperatorInput/);
  assert.match(ledger, /request-changes[\s\S]{0,220}retains `sourceUserInstruction`/);
  assert.match(ledger, /decision:"approve"` forbids it/);
});

test('preview request-changes never smuggles a new locator route', () => {
  assert.match(examples, /request-changes[\s\S]{0,220}routes only to `REVISION_INTERPRET`/);
  assert.match(examples, /new local locators[\s\S]{0,260}separate new `visual-revision` invocation/);
  assert.match(examples, /route to `REVISION_SOURCE_UPDATE` before Revision Interpreter/);
  assert.doesNotMatch(examples, /request-changes[\s\S]{0,180}route to `REVISION_INTERPRET` or `REVISION_SOURCE_UPDATE`/);
});
