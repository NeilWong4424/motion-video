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
})).sort((a, b) => a.id.localeCompare(b.id));

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
