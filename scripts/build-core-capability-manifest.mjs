import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync, renameSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

// Deterministically hash each core capability's source file (its stable static
// implementation) and emit src/generated/core-capability-manifest.ts. Handwritten
// or stale hashes fail the --check gate.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');

// Each core capability: id, version, source file (relative to repoRoot).
const CORE_CAPABILITIES = [
  {kind: 'renderer', id: 'base.text', version: '1.0.0', file: 'src/capabilities/base/text-node.tsx', supportedNodeKinds: ['text']},
  {kind: 'renderer', id: 'base.shape', version: '1.0.0', file: 'src/capabilities/base/shape-node.tsx', supportedNodeKinds: ['shape']},
  {kind: 'renderer', id: 'base.path', version: '1.0.0', file: 'src/capabilities/base/path-node.tsx', supportedNodeKinds: ['path']},
  {kind: 'renderer', id: 'base.group', version: '1.0.0', file: 'src/capabilities/base/group-node.tsx', supportedNodeKinds: ['group', 'ui', 'chart', 'logo']},
  {kind: 'renderer', id: 'base.image', version: '1.0.0', file: 'src/capabilities/base/image-node.tsx', supportedNodeKinds: ['image', 'logo']},
  {kind: 'effect', id: 'text.mask-rise', version: '1.0.0', file: 'src/capabilities/text/mask-rise.tsx', supportedNodeKinds: ['text'], ownedChannels: ['geometry', 'opacity'], family: 'text'},
  {kind: 'effect', id: 'text.word-stagger', version: '1.0.0', file: 'src/capabilities/text/word-stagger.tsx', supportedNodeKinds: ['text'], ownedChannels: ['opacity'], family: 'text'},
  {kind: 'effect', id: 'text.line-reveal', version: '1.0.0', file: 'src/capabilities/text/line-reveal.tsx', supportedNodeKinds: ['text'], ownedChannels: ['geometry'], family: 'text'},
  {kind: 'effect', id: 'text.tracking-resolve', version: '1.0.0', file: 'src/capabilities/text/tracking-resolve.tsx', supportedNodeKinds: ['text'], ownedChannels: ['style'], family: 'text'},
  {kind: 'effect', id: 'text.highlight-sweep', version: '1.0.0', file: 'src/capabilities/text/highlight-sweep.tsx', supportedNodeKinds: ['text'], ownedChannels: ['filter'], family: 'text'},
  {kind: 'effect', id: 'text.word-replace', version: '1.0.0', file: 'src/capabilities/text/word-replace.tsx', supportedNodeKinds: ['text'], ownedChannels: ['content'], family: 'text'},
  {kind: 'effect', id: 'shape.shape-reveal', version: '1.0.0', file: 'src/capabilities/shape/shape-reveal.tsx', supportedNodeKinds: ['shape'], ownedChannels: ['geometry', 'opacity'], family: 'shape'},
  {kind: 'effect', id: 'shape.geometry-morph', version: '1.0.0', file: 'src/capabilities/shape/geometry-morph.tsx', supportedNodeKinds: ['shape'], ownedChannels: ['geometry'], family: 'shape'},
  {kind: 'effect', id: 'path.path-draw', version: '1.0.0', file: 'src/capabilities/path/path-draw.tsx', supportedNodeKinds: ['path'], ownedChannels: ['path'], family: 'path'},
  {kind: 'effect', id: 'path.connector-draw', version: '1.0.0', file: 'src/capabilities/path/connector-draw.tsx', supportedNodeKinds: ['path'], ownedChannels: ['path'], family: 'path'},
  {kind: 'effect', id: 'data.bar-grow', version: '1.0.0', file: 'src/capabilities/data/bar-grow.tsx', supportedNodeKinds: ['shape', 'chart'], ownedChannels: ['geometry'], family: 'data'},
  {kind: 'effect', id: 'diagram.node-connect', version: '1.0.0', file: 'src/capabilities/diagram/node-connect.tsx', supportedNodeKinds: ['shape', 'group'], ownedChannels: ['geometry', 'opacity'], family: 'diagram'},
  {kind: 'effect', id: 'ui.card-lift', version: '1.0.0', file: 'src/capabilities/ui/card-lift.tsx', supportedNodeKinds: ['ui', 'shape', 'group'], ownedChannels: ['geometry', 'filter'], family: 'ui'},
  {kind: 'effect', id: 'identity.logo-assemble', version: '1.0.0', file: 'src/capabilities/identity/logo-assemble.tsx', supportedNodeKinds: ['logo', 'path', 'group'], ownedChannels: ['geometry', 'opacity'], family: 'identity'},
  {kind: 'effect', id: 'ambient.drift', version: '1.0.0', file: 'src/capabilities/ambient/drift.tsx', supportedNodeKinds: ['shape', 'group', 'image'], ownedChannels: ['geometry'], family: 'ambient'},
];

function hashFile(relPath) {
  const bytes = readFileSync(join(repoRoot, relPath), 'utf8').replaceAll('\r\n', '\n');
  return createHash('sha256').update(bytes).digest('hex');
}

const entries = CORE_CAPABILITIES.map((cap) => ({
  kind: cap.kind,
  id: cap.id,
  version: cap.version,
  implementationHash: hashFile(cap.file),
  scope: 'core',
  supportedNodeKinds: cap.supportedNodeKinds,
  ...(cap.ownedChannels ? {ownedChannels: cap.ownedChannels} : {}),
  ...(cap.family ? {family: cap.family} : {}),
})).sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind.localeCompare(b.kind)));

const body = entries.map((e) => `  ${JSON.stringify(e)},`).join('\n');
const source = `import type {CapabilityManifestEntry} from '../engine/capability/types.js';

export const coreCapabilityManifest = [
${body}
] satisfies readonly CapabilityManifestEntry[];
`;

const target = join(repoRoot, 'src', 'generated', 'core-capability-manifest.ts');

if (checkMode) {
  if (!existsSync(target)) {
    console.error('CORE_CAPABILITY_MANIFEST_MISSING');
    process.exit(1);
  }
  const current = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
  if (current !== source) {
    console.error('CORE_CAPABILITY_MANIFEST_STALE: run pnpm capabilities:manifest');
    process.exit(1);
  }
  console.log('core capability manifest: up to date');
  process.exit(0);
}

mkdirSync(dirname(target), {recursive: true});
const tmp = join(dirname(target), `.${randomUUID()}.tmp`);
writeFileSync(tmp, source);
renameSync(tmp, target);
console.log(`core capability manifest: wrote ${entries.length} entries`);
