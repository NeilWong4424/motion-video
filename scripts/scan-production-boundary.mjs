import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

import {scanProductionSource} from '../src/engine/boundary/scan-production-source.js';

// CLI wrapper around the reusable production-source scanner. It scans the actual
// filesystem under production/config paths so the gate works before the first
// commit and inside archive fixtures. It excludes non-executable template text,
// user assets, prior revisions, tests, and caches.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ROOTS = [
  'src',
  'scripts',
  'agent',
  'craft',
  'projects',
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'remotion.config.ts',
];

const EXCLUDE_DIRS = [
  'revisions',
  'references',
  'audio',
  'assets',
  'node_modules',
  'out',
  '.cache',
  '.remotion',
  'generated-assets',
  'project-capabilities',
];

const diagnostics = scanProductionSource({
  kind: 'roots',
  baseDir: repoRoot,
  roots: ROOTS,
  excludeDirs: EXCLUDE_DIRS,
});

if (diagnostics.length === 0) {
  console.log('production-source boundary: clean');
  process.exit(0);
}

for (const d of diagnostics) {
  console.error(`${d.code} ${d.file}:${d.line}  ${d.message}\n    ${d.evidence}`);
}
console.error(`\nproduction-source boundary: ${diagnostics.length} finding(s)`);
process.exit(1);
