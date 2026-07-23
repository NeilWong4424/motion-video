import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('MotionSpec uses closed core renderer and effect bindings with semantic references', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.doesNotMatch(motion, /renderer:\s*\{[^}]+props:\s*unknown/s);
  assert.doesNotMatch(motion, /effects:\s*Array<\{[^}]+props:\s*unknown/s);
  assert.match(motion, /type RendererBinding\s*=/);
  assert.match(motion, /type EffectBinding\s*=/);

  for (const id of [
    'core.renderer.text',
    'core.renderer.shape',
    'core.renderer.path',
    'core.renderer.local-image',
    'core.renderer.group',
    'core.effect.opacity-transform',
    'core.effect.clip-mask',
    'core.effect.content-transition',
    'core.effect.path-trim',
  ]) assert.match(motion, new RegExp(id.replaceAll('.', '\\.'), 'i'), `missing closed binding ${id}`);

  for (const semanticRef of ['copyId', 'tokenId', 'assetId']) {
    assert.match(motion, new RegExp(semanticRef, 'i'), `missing ${semanticRef} reference rule`);
  }
  assert.match(motion, /renderer\/effect props[^\n]+(?:URL|path|base64)[^\n]+(?:forbidden|invalid)/i);
  assert.match(motion, /literal copy[^\n]+(?:forbidden|invalid|must not)/i);
});

test('ContentTransition is positive-duration in-node continuity and cannot disguise a chapter cut', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type ContentTransition[\s\S]+preservesNodeIdentity:\s*true[\s\S]+fullFrameReset:\s*false/i);
  assert.match(motion, /ContentTransition[\s\S]+positive[^\n]+half-open[^\n]+range/i);
  assert.match(motion, /ContentTransition[\s\S]+cannot[^\n]+chapter[- ]cut[^\n]+budget/i);
  assert.match(motion, /full-frame[^\n]+replacement[^\n]+(?:refused|invalid|reject)/i);
});

test('every core capability binds stable intent and resolved schema IDs', () => {
  const registry = JSON.parse(read('catalog/core-registry.json'));
  const contract = read('agent/contracts/catalog-registry-contract.md');

  assert.ok(registry.capabilities.some(({kind}) => kind === 'camera'));
  for (const capability of registry.capabilities) {
    assert.equal(typeof capability.intentSchemaId, 'string', `${capability.id} intentSchemaId`);
    assert.equal(typeof capability.resolvedSchemaId, 'string', `${capability.id} resolvedSchemaId`);
    assert.match(capability.intentSchemaId, /^core\.schema\.[a-z0-9.-]+\.intent@1$/);
    assert.match(capability.resolvedSchemaId, /^core\.schema\.[a-z0-9.-]+\.resolved@1$/);
  }
  assert.equal(new Set(registry.capabilities.map(({intentSchemaId}) => intentSchemaId)).size, registry.capabilities.length);
  assert.equal(new Set(registry.capabilities.map(({resolvedSchemaId}) => resolvedSchemaId)).size, registry.capabilities.length);
  assert.match(contract, /intentSchemaId:\s*string/);
  assert.match(contract, /resolvedSchemaId:\s*string/);
  assert.match(contract, /schema IDs[\s\S]+exact declared mapping[\s\S]+refuses/i);
});

test('capability implementation authorization is version-rooted, new-file-only, and tuple-exact', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const roleResult = read('agent/contracts/role-result.md');
  const builder = read('agent/prompts/capability-builder.md');

  const versionRoot = 'projects/<project-id>/capabilities/<capability-id>/<capability-version>/';
  for (const text of [ledger, acceptance, roleResult, builder]) assert.ok(text.includes(versionRoot), 'missing canonical version root');

  assert.match(ledger, /type CapabilityImplementationAuthorization[\s\S]+capabilityId:\s*string[\s\S]+capabilityVersion:\s*string/i);
  assert.match(ledger, /type CapabilityAuthorizedFile[\s\S]+relativePath:\s*string[\s\S]+path:\s*string[\s\S]+purpose:/i);
  for (const word of ['overwrite', 'traversal', 'symlink', 'glob', 'absolute']) {
    assert.match(ledger, new RegExp(word, 'i'), `missing ${word} denial`);
  }
  for (const reserved of ['.workflow', 'revisions', 'sources', 'out', 'catalog', 'agent', 'craft', 'shared']) {
    assert.match(ledger, new RegExp(reserved.replace('.', '\\.'), 'i'), `missing reserved path ${reserved}`);
  }
  assert.match(ledger, /every required purpose[\s\S]+represented/i);
  assert.match(acceptance, /strip(?:ping)? only `?contentHash`?[\s\S]+exactly equal[\s\S]+authorization/i);
  assert.match(acceptance, /projectId[\s\S]+capabilityId[\s\S]+capabilityVersion[\s\S]+exact(?:ly)? match[\s\S]+authorization/i);
  assert.match(acceptance, /no (?:pre-existing|existing) target|target[^\n]+must not already exist/i);
  assert.match(acceptance, /<capability-version>\/receipts\/<implementation-authorization-hash>\/implementation-receipt\.json/);
});

test('capability authorization closes path grammar imports and destination TOCTOU', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');

  for (const forbidden of ['.git', '.codex', '.claude', 'node_modules', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']) {
    assert.match(ledger, new RegExp(forbidden.replaceAll('.', '\\.'), 'i'), `missing forbidden capability target ${forbidden}`);
  }
  assert.match(ledger, /dot-prefixed component/i);
  assert.match(ledger, /relativePath[^\n]+240 UTF-8 bytes/i);
  assert.match(ledger, /component[^\n]+64 ASCII bytes/i);
  assert.match(ledger, /purpose[^\n]+extension/i);
  assert.match(ledger, /static import graph/i);
  assert.match(ledger, /only[^\n]+authorized[^\n]+purpose:\s*`?source`?/i);
  for (const deniedImport of ['built-in', 'dynamic import', 'bare specifier', 'package resolution']) {
    assert.match(ledger, new RegExp(deniedImport, 'i'));
  }
  assert.match(ledger, /trusted repository-root directory descriptor/i);
  assert.match(ledger, /openat[^\n]+O_NOFOLLOW/i);
  assert.match(ledger, /O_CREAT\s*\|\s*O_EXCL\s*\|\s*O_NOFOLLOW/i);
  assert.match(ledger, /fstat[^\n]+regular file[^\n]+link count[^\n]+one/i);
  for (const escapedGlobal of ['process', 'fetch', 'WebSocket', 'eval', 'Function', 'WebAssembly', 'child-process']) {
    assert.match(ledger, new RegExp(escapedGlobal, 'i'), `missing executable global denial ${escapedGlobal}`);
  }
  assert.match(ledger, /network and child processes disabled/i);
  assert.match(ledger, /repository mounted read-only/i);
  assert.match(ledger, /bounded CPU\/memory\/time\/file descriptors/i);
  assert.match(ledger, /outside the closed capability ABI/i);
});

test('capability implementation has one exact fail-closed resource budget across every phase', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  const engine = read('agent/contracts/engine-interface.md');

  assert.match(ledger, /type CapabilityImplementationBudget\s*=\s*\{[\s\S]+maxSourceBytesPerFile:\s*262144[\s\S]+maxEvidenceBytesPerFile:\s*1048576[\s\S]+maxTotalAuthorizedBytes:\s*8388608[\s\S]+maxAstNodesPerSource:\s*50000[\s\S]+maxAstDepth:\s*128[\s\S]+maxCpuMillisecondsPerPhase:\s*30000[\s\S]+maxWallMillisecondsPerPhase:\s*60000[\s\S]+maxMemoryBytes:\s*536870912[\s\S]+maxStdoutBytes:\s*1048576[\s\S]+maxStderrBytes:\s*1048576[\s\S]+maxTemporaryBytes:\s*0[\s\S]+maxOutputBytes:\s*8388608[\s\S]+maxOpenFileDescriptors:\s*64[\s\S]+maxChildProcesses:\s*0[\s\S]+\}/i);
  assert.match(ledger, /before (?:creating|creation of) any destination/i);
  assert.match(ledger, /validation, tests, performance checks, and (?:preview\/final )?render/i);
  assert.match(ledger, /unknown, unmeasurable, overflow, or limit breach[\s\S]+refus/i);
  assert.match(engine, /CapabilityImplementationBudget[\s\S]+implementation[\s\S]+validation[\s\S]+tests[\s\S]+performance[\s\S]+render/i);
});

test('CapabilityGap records capability ID and version as separate closed fields', () => {
  const gap = read('agent/contracts/capability-gap-contract.md');
  const planner = read('agent/prompts/motion-planner.md');

  assert.match(gap, /type AttemptedCapabilityVersion\s*=\s*\{[\s\S]+id:\s*string;[\s\S]+version:\s*string;/i);
  assert.match(gap, /attemptedCapabilities:\s*\[AttemptedCapabilityVersion/i);
  assert.doesNotMatch(gap, /attemptedCapabilityIds/);
  assert.match(planner, /"attemptedCapabilities":\s*\[\{"id":\s*"core\.renderer\.shape",\s*"version":\s*"1\.0\.0"\}\]/i);
  assert.doesNotMatch(planner, /attemptedCapabilityIds/);
});

test('written RoleResult correlates role with its exact candidate producer', () => {
  const result = read('agent/contracts/role-result.md');

  assert.match(result, /type ArtifactOwningRoleRoute\s*=\s*RoleDelegationRoute extends infer R[\s\S]+AllowedAcceptanceRouteIdForRoleRoute<R> extends never \? never : R/i);
  assert.match(result, /type WrittenRoleResultFor<R extends ArtifactOwningRoleRoute>[\s\S]+RoleResultBaseFor<R>[\s\S]+artifactCandidate:\s*AllowedArtifactCandidateForRoleRoute<R>/i);
  assert.match(result, /type WrittenRoleResult\s*=\s*ArtifactOwningRoleRoute extends infer R[\s\S]+WrittenRoleResultFor<R>/i);
  assert.match(result, /capability-builder[^\n]+cannot construct `written`/i);
});
