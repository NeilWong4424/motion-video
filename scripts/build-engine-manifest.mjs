import {createHash, randomUUID} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync, renameSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, relative, resolve} from 'node:path';

// Deterministically hash the browser Runtime/easing/host source graph separately
// from the Node-side resolver/compiler/renderer graph, plus pnpm-lock.yaml and
// pinned versions, and emit src/generated/engine-build-manifest.ts. Handwritten
// or stale values fail --check.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');

// Allowlisted source directories per graph. Missing dirs contribute an empty
// sentinel so adding files later necessarily changes the hash.
const RUNTIME_DIRS = ['src/engine/runtime', 'src/capabilities'];
const TOOLING_DIRS = ['src/engine/resolver', 'src/engine/compiler', 'src/engine/renderer', 'src/engine/project', 'src/engine/revision', 'src/engine/qc', 'src/engine/audio'];

function collectFiles(relDir) {
  const abs = join(repoRoot, relDir);
  if (!existsSync(abs)) return [];
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, {withFileTypes: true})) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
    }
  };
  walk(abs);
  return out.sort();
}

function hashGraph(dirs) {
  const hash = createHash('sha256');
  let any = false;
  for (const dir of dirs) {
    for (const file of collectFiles(dir)) {
      any = true;
      const rel = relative(repoRoot, file).replaceAll('\\', '/');
      const bytes = readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
      hash.update(rel + '\0' + bytes + '\0');
    }
  }
  if (!any) hash.update('EMPTY-DIRECTORY-SENTINEL');
  return hash.digest('hex');
}

function hashFile(rel) {
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) return '0'.repeat(64);
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const pinnedNode = readFileSync(join(repoRoot, '.nvmrc'), 'utf8').trim();

const identity = {
  runtimeImplementationHash: hashGraph(RUNTIME_DIRS),
  renderToolingImplementationHash: hashGraph(TOOLING_DIRS),
  lockfileHash: hashFile('pnpm-lock.yaml'),
  nodeVersion: pinnedNode,
  reactVersion: pkg.dependencies.react,
  remotionVersion: pkg.dependencies.remotion,
};

const source = `import type {EngineBuildIdentity} from '../contracts/render-plan.js';

export const engineBuildIdentity: EngineBuildIdentity = ${JSON.stringify(identity, null, 2)};
`;

const target = join(repoRoot, 'src', 'generated', 'engine-build-manifest.ts');

if (checkMode) {
  if (!existsSync(target)) {
    console.error('ENGINE_MANIFEST_MISSING');
    process.exit(1);
  }
  const current = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
  if (current !== source) {
    console.error('ENGINE_MANIFEST_STALE: run pnpm engine:manifest');
    process.exit(1);
  }
  console.log('engine build manifest: up to date');
  process.exit(0);
}

const tmp = join(dirname(target), `.${randomUUID()}.tmp`);
writeFileSync(tmp, source);
renameSync(tmp, target);
console.log('engine build manifest: written');
