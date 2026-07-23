import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('capability identities and versions use one canonical safe ASCII grammar', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');
  const catalog = read('agent/contracts/catalog-registry-contract.md');
  const registry = JSON.parse(read('catalog/core-registry.json'));
  const combined = `${catalog}\n${motion}`;

  assert.match(catalog, /type CoreCapabilityId\s*=/);
  assert.match(catalog, /type ProjectCapabilityId\s*=/);
  assert.match(catalog, /type CapabilityId\s*=\s*CoreCapabilityId\s*\|\s*ProjectCapabilityId/);
  assert.match(catalog, /type CapabilityVersion\s*=/);
  assert.match(combined, /safe-id-segment\s*=\s*"\[a-z0-9\]"/i);
  assert.match(combined, /project-capability-id\s*=\s*"project\."/i);
  assert.match(combined, /canonical SemVer 2\.0\.0/i);
  assert.match(combined, /ASCII/i);
  assert.match(combined, /leading zero/i);
  assert.match(combined, /maximum[^\n]+(?:bytes|characters)/i);

  assert.doesNotMatch(motion, /id:\s*`project\.\$\{string\}`/);
  assert.doesNotMatch(motion, /type ProjectLocal(?:Renderer|Effect)Binding[\s\S]+?version:\s*string;/);
  assert.doesNotMatch(catalog, /type CoreCapability\s*=\s*\{[\s\S]+?version:\s*string;/);

  const coreIdBlock = catalog.match(/type CoreCapabilityId\s*=([\s\S]+?);/);
  assert.ok(coreIdBlock, 'missing closed CoreCapabilityId block');
  const documentedCoreIds = [...coreIdBlock[1].matchAll(/"(core\.[a-z0-9.-]+)"/g)].map((match) => match[1]);
  assert.deepEqual(documentedCoreIds, registry.capabilities.map(({id}) => id));
});

test('project catalog snapshots are exact descendants with receipt-backed additions only', () => {
  const catalog = read('agent/contracts/catalog-registry-contract.md');

  assert.match(catalog, /type CoreCatalogRegistrySnapshot\s*=/);
  assert.match(catalog, /type ProjectCatalogRegistrySnapshot\s*=/);
  assert.match(catalog, /type CatalogRegistrySnapshot\s*=\s*CoreCatalogRegistrySnapshot\s*\|\s*ProjectCatalogRegistrySnapshot/);
  assert.match(catalog, /projectId:\s*SafeProjectId/);
  assert.match(catalog, /parentSnapshotHash:\s*Sha256Hex/);
  assert.match(catalog, /implementationBindingHash:\s*Sha256Hex/);
  assert.match(catalog, /implementationBindingHashes:\s*\[Sha256Hex,/);
  assert.match(catalog, /byte-for-byte identical[\s\S]+parent/i);
  assert.match(catalog, /bijection[\s\S]+implementationBindingHashes/i);
  assert.match(catalog, /snapshot.+receipt self-reference|no snapshot.+receipt self-reference/i);
  assert.match(catalog, /usable only after[\s\S]+receipt[\s\S]+externally accepted/i);
  assert.match(catalog, /(?:extra|additional)[^\n]+(?:motion profile|style pack|resource)[^\n]+invalid/i);
  assert.match(catalog, /additionalProperties:\s*false/);
});

test('capability implementation binding breaks the snapshot and final-receipt hash cycle', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const catalog = read('agent/contracts/catalog-registry-contract.md');
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(acceptance, /type CapabilityImplementationBindingProjection\s*=\s*\{/);
  assert.match(acceptance, /purpose:\s*"registry-snapshot";\s*contentHash:\s*null/);
  assert.match(acceptance, /implementationBindingHash[^\n]+SHA-256[^\n]+RFC 8785/i);
  assert.match(acceptance, /snapshot contains this implementation binding hash, never the final receipt hash/i);
  assert.match(catalog, /Final accepted receipt hashes are tracked separately/i);
  assert.match(motion, /implementationBindingHashes:\s*Sha256Hex\[\]/);
  assert.match(motion, /acceptedImplementationReceiptHashes:\s*Sha256Hex\[\]/);
  assert.match(motion, /two lists are a bijection through each receipt's `implementationBindingHash`/i);
  assert.doesNotMatch(catalog, /implementationReceiptHashes/);
});

test('accepted project capability intent schemas are closed and payload-budgeted', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');
  const catalog = read('agent/contracts/catalog-registry-contract.md');
  const combined = `${catalog}\n${motion}`;

  assert.match(catalog, /type CapabilityIntentSchema\s*=/);
  assert.match(catalog, /type CapabilityIntentFieldDefinition\s*=/);
  assert.match(catalog, /fieldId:\s*SafeIdSegment/);
  assert.match(catalog, /semanticRole:/);
  assert.match(catalog, /assetKind:\s*"image"\s*\|\s*"font"\s*\|\s*"data"/);
  assert.match(catalog, /assetUse:\s*"render-image"\s*\|\s*"render-font"\s*\|\s*"render-data"/);
  assert.match(catalog, /minimum:\s*number;\s*maximum:\s*number/);
  assert.match(catalog, /numericPurpose:/);
  assert.match(catalog, /maxFieldCount:\s*32/);
  assert.match(catalog, /maxCanonicalPayloadBytes:\s*8192/);
  assert.match(catalog, /fields[\s\S]+unique[\s\S]+ascending/i);
  assert.match(combined, /URL[\s\S]+filesystem path[\s\S]+import[\s\S]+media bytes[\s\S]+literal copy/i);
  assert.match(motion, /accepted `CapabilityIntentSchema@1`/i);
  assert.match(motion, /kind[\s\S]+semanticRole[\s\S]+exactly match/i);
});

test('all easing values use a closed EasingId vocabulary', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type EasingId\s*=/);
  assert.match(motion, /easing\?:\s*EasingId/);
  assert.match(motion, /easing:\s*EasingId/);
  assert.doesNotMatch(motion, /easing\??:\s*string/);
});

test('core path rendering resolves a bounded numeric command registry and never SVG strings', () => {
  const motion = read('agent/contracts/motion-spec-contract.md');

  assert.match(motion, /type PathVector\s*=\s*\{x:\s*number;\s*y:\s*number\}/);
  assert.match(motion, /type PathCommand\s*=/);
  for (const operation of ['move-to', 'line-to', 'quadratic-to', 'cubic-to', 'close-path']) {
    assert.match(motion, new RegExp(`op: "${operation}"`), `missing numeric command ${operation}`);
  }
  assert.match(motion, /type PathState\s*=/);
  assert.match(motion, /commands:\s*\[PathCommand,/);
  assert.match(motion, /paths:\s*PathState\[\]/);
  assert.match(motion, /pathStateId:\s*SafeIdSegment/);
  assert.doesNotMatch(motion, /pathStateId:\s*string/);
  assert.match(motion, /pathStateId[\s\S]+resolves[\s\S]+registries\.paths/i);
  assert.match(motion, /(?:SVG|path markup)[^\n]+(?:forbidden|invalid|never)/i);
  assert.match(motion, /maxCommandCount:\s*2048/);
  assert.match(motion, /maxCanonicalPayloadBytes:\s*65536/);
});
