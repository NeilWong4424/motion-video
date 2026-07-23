import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('ProjectPolicy has one typed human request and one mechanical candidate producer route', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const decision = read('agent/contracts/workflow-decision.md');
  const engine = read('agent/contracts/engine-interface.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));

  assert.match(artifacts, /type ProjectPolicy\s*=/i);
  assert.match(ledger, /type ProjectPolicyIngressRequest\s*=/i);
  for (const field of [
    'kind: "project-policy-ingress-request"',
    'pauseId: string',
    'projectId: string',
    'previousProjectPolicyHash: string | null',
    'previewApproval:',
    'actor:',
    'reason: DurableInstructionText',
  ]) {
    assert.ok(ledger.includes(field), `ProjectPolicyIngressRequest lacks ${field}`);
  }
  assert.match(ledger, /type WorkflowOperatorInput\s*=[\s\S]+\| ProjectPolicyIngressRequest/i);
  assert.match(decision, /"project-policy-ingress"/i);
  assert.match(decision, /fromState:\s*"PREVIEW_GATE";\s*toState:\s*"PREVIEW_GATE";\s*interfaceId:\s*"project-policy-ingress"/i);
  assert.match(engine, /type ProjectPolicyIngressSuccess\s*=/i);
  assert.match(engine, /ProjectPolicyIngressSuccess[\s\S]+artifactKind:\s*"project-policy"[\s\S]+continuationState:\s*"PREVIEW_GATE"/i);
  assert.ok(manifest.interfaces.some(({id}) => id === 'project-policy-ingress'));
});

test('accepted ProjectPolicy uses immutable candidate identity recorded in the checkpoint', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const policyInterface = manifest.interfaces.find(({id}) => id === 'project-policy-ingress');

  const immutablePath = /projects\/<project-id>\/\.workflow\/candidates\/<request-id>\/<candidate-attempt-id>\/project\.policy\.json/i;
  assert.match(acceptance, immutablePath);
  assert.match(artifacts, /ProjectPolicy@1[^\n]+immutable candidate path/i);
  assert.ok(policyInterface?.writes.some((path) => immutablePath.test(path)), 'policy ingress lacks immutable candidate write');
  assert.match(ledger, /type CurrentProjectPolicyIdentity\s*=\s*\{[\s\S]+path:\s*string;[\s\S]+contentHash:\s*string;[\s\S]+acceptanceHash:\s*string;[\s\S]+acceptanceResultReceiptHash:\s*string;/i);
  assert.match(ledger, /currentProjectPolicy:\s*CurrentProjectPolicyIdentity\s*\|\s*null/i);
  assert.match(ledger, /accepted project-policy[\s\S]+updates `currentProjectPolicy`/i);
  assert.doesNotMatch(acceptance, /`project-policy`[^\n]+`projects\/<project-id>\/project\.policy\.json`/i);
});

test('LocalSource ingress request closes every locator rights and intended-use declaration', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(acceptance, /type LocalSourceDeclaration\s*=/i);
  for (const field of [
    'sourceId: SafeSourceId',
    'assetId: SafeAssetId',
    'locatorId: SafeLocatorId',
    'kind: LocalAssetKind',
    'requestedUses: [AssetUse',
    'rights:',
    'status:',
    'holder: DurableLocatorSafeText | null',
    'evidence:',
    'allowedUses: AssetUse[]',
    'attribution: DurableLocatorSafeText | null',
    'useLimits: DurableLocatorSafeText[]',
  ]) {
    assert.ok(acceptance.includes(field), `LocalSourceDeclaration lacks ${field}`);
  }
  assert.match(acceptance, /type EphemeralLocalSourceLocatorSet\s*=\s*\{[\s\S]+localLocator:\s*string/i);
  assert.match(acceptance, /localLocator[\s\S]+never persisted|never persisted[\s\S]+localLocator/i);
  assert.match(ledger, /type LocalSourceIngressRequest\s*=\s*\{[\s\S]+kind:\s*"local-source-ingress-request"[\s\S]+originState:\s*LocalSourceIngressState[\s\S]+previousLocalAssetManifestHash:\s*string\s*\|\s*null[\s\S]+declarations:\s*\[LocalSourceDeclaration/i);
  assert.match(ledger, /type WorkflowOperatorInput\s*=[\s\S]+\| LocalSourceIngressRequest/i);
  assert.match(acceptance, /operator-input-recorded[\s\S]+sourceEventHash[\s\S]+tokenizedStatement:\s*DurableInstructionText/i);
  assert.doesNotMatch(acceptance, /verbatimStatement/);
  assert.match(acceptance, /every requested use[\s\S]+allowed uses/i);
});

test('LocalSource result binds origin state to its sole acceptance context and immutable bytes', () => {
  const engine = read('agent/contracts/engine-interface.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const sourceInterface = manifest.interfaces.find(({id}) => id === 'local-source-ingress');

  assert.match(engine, /type LocalSourceAcceptanceContextByState\s*=\s*\{[\s\S]+INTAKE:[^\n]+initial-local-assets[\s\S]+REVISION_SOURCE_UPDATE:[^\n]+source-update-local-assets/i);
  assert.match(engine, /artifactCandidate:[^\n]+LocalSourceAcceptanceContextByState\[S\]/i);
  assert.match(acceptance, /\.workflow\/candidates\/<request-id>\/<candidate-attempt-id>\/assets\.manifest\.json/i);
  assert.match(acceptance, /sources\/<source-id>\/<content-hash>\/source\.<verified-format-extension>/i);
  assert.ok(sourceInterface?.writes.includes('projects/<project-id>/sources/<source-id>/<content-hash>/source.<verified-format-extension>'));
});
