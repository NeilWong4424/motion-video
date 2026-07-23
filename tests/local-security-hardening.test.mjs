import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('local source IDs and persisted filenames cannot be caller-controlled path components', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));

  for (const type of ['SafeLocatorId', 'SafeSourceId', 'SafeAssetId']) {
    assert.match(acceptance, new RegExp(`type ${type}\\s*=`));
  }
  assert.match(acceptance, /adapter\/recorder allocates `locator-0001`, `source-0001`, and `asset-0001`/i);
  assert.match(acceptance, /caller\/model-provided IDs never select a destination component/i);
  assert.match(acceptance, /source\.<verified-format-extension>/);
  assert.match(artifacts, /track\.<verified-audio-extension>/);
  assert.doesNotMatch(`${acceptance}\n${artifacts}`, /sanitized-basename/);
  assert.match(artifacts, /localAudioLocatorId:\s*SafeLocatorId/);
  assert.ok(manifest.interfaces.find(({id}) => id === 'local-source-ingress').writes
    .includes('projects/<project-id>/sources/<source-id>/<content-hash>/source.<verified-format-extension>'));
});

test('all source, capability, receipt, and audio destinations use anchored no-follow handles', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const researcher = read('agent/prompts/researcher.md');

  assert.match(acceptance, /anchored destination writes and later reads/i);
  assert.match(acceptance, /openat[\s\S]+O_CREAT \| O_EXCL \| O_NOFOLLOW/i);
  assert.match(acceptance, /regular-file identity and link count one/i);
  assert.match(acceptance, /symmetric read rule[\s\S]+hash the exact opened handle/i);
  assert.match(acceptance, /protocol-derived path[\s\S]+anchored directory-handle[\s\S]+exclusive-create/i);
  assert.match(artifacts, /staged track through anchored repository handles[\s\S]+trackContentHash/i);
  assert.match(researcher, /anchored repository handle[\s\S]+recompute the accepted hash/i);
  assert.match(ledger, /anchored[\s\S]+O_CREAT[\s\S]+O_EXCL[\s\S]+O_NOFOLLOW/i);
});

test('render-image is raster-only and cannot execute or fetch through SVG', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const registry = JSON.parse(read('catalog/core-registry.json'));
  const image = registry.capabilities.find(({id}) => id === 'core.renderer.local-image');

  assert.match(image.intent, /static local raster/i);
  assert.match(image.intent, /SVG\/XML is not render substrate/i);
  assert.match(acceptance, /render-image` permits only[\s\S]+`png`, `jpg`, `webp`, or `avif`/i);
  assert.match(acceptance, /SVG\/XML[\s\S]+scripts[\s\S]+nested resources[\s\S]+never render substrate/i);
  assert.match(acceptance, /Browser\/renderer network access remains disabled/i);
});

test('runtime project data roots are ignored while the project template remains tracked', () => {
  const ignore = read('.gitignore');
  for (const path of [
    'projects/*/.workflow/',
    'projects/*/sources/',
    'projects/*/audio/',
    'projects/*/revisions/',
    'projects/*/capabilities/',
    'out/',
  ]) assert.ok(ignore.includes(path), `missing ignore ${path}`);
  assert.match(ignore, /!projects\/_template\/\*\*/);
});

test('path-bearing action IDs and capability files use closed grammars', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');

  assert.match(decision, /type ActionId\s*=/);
  assert.doesNotMatch(`${decision}\n${ledger}`, /actionId:\s*string/);
  assert.match(ledger, /`action-0001`/);
  assert.match(ledger, /caller\/model-selected[\s\S]+invalid/i);
  for (const forbidden of ['.git', '.codex', '.claude', 'node_modules', 'package.json']) {
    assert.match(ledger, new RegExp(forbidden.replace('.', '\\.')));
  }
  assert.match(ledger, /static import graph[\s\S]+authorized source files/i);
  assert.match(ledger, /dynamic import[\s\S]+bare[\s\S]+package resolution[\s\S]+forbidden/i);
});

test('durable text and high-impact human inputs have trusted provenance', () => {
  const ledger = read('agent/contracts/workflow-ledger.md');
  assert.match(ledger, /type DurableLocatorSafeText/);
  assert.match(ledger, /UI\/UX[\s\S]+preserv|ordinary slash[\s\S]+preserv/i);
  assert.match(ledger, /redacted-secret/i);
  assert.match(ledger, /type TrustedOperatorContext/);
  assert.match(ledger, /out-of-band[\s\S]+actual user turn/i);
  assert.match(ledger, /reject[\s\S]+model-authored[\s\S]+operator/i);
});
