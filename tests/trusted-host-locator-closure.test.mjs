import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const block = (text, start, end) => {
  const value = new RegExp(`${start}([\\s\\S]*?)${end}`).exec(text)?.[1];
  assert.ok(value, `missing block ${start}`);
  return value;
};

test('host identity comes only from an out-of-band trusted adapter context', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');
  const invocation = block(decision, 'type WorkflowInvocation\\s*=\\s*\\{', '\\n\\};');

  assert.match(decision, /type TrustedHostContext/);
  assert.doesNotMatch(invocation, /host:\s*HostId/);
  assert.match(ledger, /InvocationReceivedPayload[\s\S]+trustedHostId:\s*HostId/);
  assert.match(ledger, /EphemeralHostPreviewApprovalEnvelope/);
  assert.match(ledger, /derive[^\n]+\{type:\s*"host",\s*id:\s*trustedHostContext\.hostId\}/i);
  assert.match(engine, /trustedHostContext[^\n]+out-of-band/i);
  assert.match(engine, /reject[^\n]+invocation[^\n]+mismatch/i);
});

test('local locator sets have one canonical preimage and durable text is locator-tokenized', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(acceptance, /locatorSetHash[^\n]+SHA-256[^\n]+RFC 8785[^\n]+\{locators\}/i);
  assert.match(acceptance, /locatorId[^\n]+unique[^\n]+(?:ascending|canonical order)/i);
  assert.match(acceptance, /locatorSetHash[^\n]+omitted[^\n]+preimage/i);
  assert.match(ledger, /type DurableInstructionText/);
  assert.match(ledger, /replace[^\n]+locator[^\n]+stable[^\n]+token/i);
  assert.match(ledger, /reject[^\n]+surviving[^\n]+locator bytes/i);
  const invocationPayload = block(ledger, 'type InvocationReceivedPayload\\s*=\\s*\\{', '\\n\\};');
  assert.doesNotMatch(invocationPayload, /userRequest:\s*string/);
  assert.match(invocationPayload, /sourceUserInstruction:\s*DurableInstructionText/);
  const answer = block(ledger, 'type RequiredUserAnswer\\s*=\\s*\\{', '\\n\\};');
  assert.doesNotMatch(answer, /verbatimAnswer/);
  assert.match(answer, /tokenizedAnswer:\s*DurableInstructionText/);
});

test('durable text keeps ordinary slash and colon prose while redacting strong locator forms', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');

  for (const literal of ['`UI/UX`', '`24/7`', '`CTA:`']) assert.match(ledger, new RegExp(literal.replace('/', '\\/')));
  assert.match(ledger, /strong locator prefix/i);
  assert.match(ledger, /`\/`,\s*`\.\/`,\s*`\.\.\/`,\s*`~\/`/);
  assert.match(ledger, /scheme:\/\//i);
  assert.match(ledger, /closed `file:` and `data:`/i);
  assert.doesNotMatch(ledger, /contains a slash\/backslash between two non-separator bytes/i);
  assert.doesNotMatch(ledger, /ASCII URI scheme followed by colon(?! plus two slashes)/i);
  for (const form of ['`.\\`', '`..\\`', '`~\\`', '`C:foo`', '`CON`', '`COM1`', '`LPT9`']) {
    assert.match(ledger, new RegExp(form.replaceAll('\\', '\\\\')));
  }
});

test('durable text redacts secrets before every append and API-key refusal', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const workflow = read('agent/video-workflow.md');

  assert.match(ledger, /\[\[redacted-secret:<ordinal>\]\]/);
  for (const pattern of ['Bearer', 'Basic', '_KEY', '_TOKEN', '_PASSWORD', 'sk-', 'github_pat_', 'xox']) {
    assert.match(ledger, new RegExp(pattern, 'i'));
  }
  assert.match(ledger, /generic secret token[^\n]+exactly 32–256 ASCII/i);
  assert.match(ledger, /idempotent[^\n]+identical bytes/i);
  assert.match(ledger, /before computing any hash[^\n]+written durably/i);
  assert.match(ledger, /exact secret bytes[^\n]+never[^\n]+Ledger|never[^\n]+exact secret bytes/i);
  assert.match(workflow, /credential[^\n]+saniti[sz]e[^\n]+out-of-scope/i);
});

test('human operator inputs require out-of-band actual-user-turn provenance', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const decision = read('agent/contracts/workflow-decision.md');

  assert.match(ledger, /type TrustedOperatorContext/);
  assert.match(ledger, /provenance:\s*"out-of-band-operator-adapter"/);
  assert.match(ledger, /operatorEnvelopeHash:\s*Sha256/);
  assert.match(ledger, /type EphemeralHumanOperatorInputEnvelope/);
  assert.match(ledger, /actor-free/i);
  assert.match(ledger, /actual user turn/i);
  assert.match(ledger, /derives the persisted human actor/i);
  assert.match(ledger, /role, orchestrator, model[^\n]+cannot/i);
  assert.match(decision, /operatorInput:\s*OperatorInputEventBindingFor<R>/);
});

test('execution decisions bind typed route inputs and cannot use free-form evidence paths', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type ActionInvocationInputFor<R extends NormalActionRoute>/);
  assert.match(decision, /inputBindingHash[^\n]+SHA-256[^\n]+JCS|SHA-256[^\n]+JCS[^\n]+inputBindingHash/i);
  assert.match(decision, /actionId:\s*ActionId/);
  assert.match(decision, /resultRouteId:/);
  assert.doesNotMatch(decision, /evidenceRefs:\s*string\[\]/);
  assert.match(decision, /type SafeAuditEvidenceId/);
  assert.match(decision, /kind:\s*"accepted-artifact"/);
  assert.match(decision, /kind:\s*"operator-input"/);
  assert.match(decision, /kind:\s*"current-revision"/);
  assert.match(ledger, /PendingRoleActionFor<R extends RoleDelegationRoute>[\s\S]+invocationInput:\s*ActionInvocationInputFor<R>/);
  assert.match(ledger, /PendingNormalInterfaceActionFor<R extends NormalInterfaceInvocationRoute>[\s\S]+invocationInput:\s*ActionInvocationInputFor<R>/);
});

test('ledger and result sidecars use one anchored inode and crash-safe append', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(ledger, /trusted repository-root directory descriptor/i);
  assert.match(ledger, /same opened Ledger inode/i);
  assert.match(ledger, /rechecks device\/inode, size, and exact tail/i);
  assert.match(ledger, /file `fsync`[\s\S]+parent directory/i);
  assert.match(ledger, /action-result sidecar[\s\S]+O_CREAT \| O_EXCL \| O_NOFOLLOW/i);
  assert.match(ledger, /fstat[^\n]+regular file with link count one/i);
});

test('local source ingress has closed byte dimension and decompression budgets', () => {
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(engine, /type LocalSourceIngressResourceBudget/);
  for (const field of [
    'maxLocatorCount',
    'maxEncodedBytesPerAsset',
    'maxEncodedBytesTotal',
    'maxDecodedBytesPerAsset',
    'maxExpansionRatio',
    'maxRasterWidth',
    'maxRasterHeight',
    'maxRasterPixels',
    'maxArchiveEntries',
  ]) assert.match(engine, new RegExp(`${field}:\\s*\\d+`));
  assert.match(engine, /reads are streaming/i);
  assert.match(engine, /decompression bomb/i);
  assert.match(engine, /checked integer arithmetic/i);
});

test('persisted human actor IDs and operator prose cannot smuggle locator bytes', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const gap = read('agent/contracts/capability-gap-contract.md');
  const operatorContracts = `${ledger}\n${artifacts}\n${gap}`;

  assert.match(ledger, /type HumanActorId/);
  assert.match(ledger, /HumanActorId[^\n]+cannot contain a slash, backslash, URI delimiter/i);
  assert.doesNotMatch(operatorContracts, /actor:\s*\{type:\s*"human";\s*id:\s*string\}/);
  assert.doesNotMatch(artifacts, /sourceLabel:\s*string|statement:\s*string/);
  assert.match(artifacts, /sourceLabel:\s*DurableInstructionText/);
  assert.match(artifacts, /statement:\s*DurableInstructionText/);
  assert.match(gap, /reason:\s*DurableInstructionText/);
});
