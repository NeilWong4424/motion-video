import {cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';

import type {RepoContext} from '../../src/engine/project/paths.js';

const realRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Create a render-capable repo context: copies the exact engine trees needed to
 * bundle and render (package.json, lockfile, src/, public/, node_modules,
 * configs) into a temp root. Reuses the real node_modules via a junction-free
 * copy is too slow, so we symlink node_modules and the browser cache read-only.
 */
export function createRenderRepoContext(): RepoContext {
  const root = mkdtempSync(join(tmpdir(), 'motion-render-'));
  for (const entry of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'remotion.config.ts', '.nvmrc']) {
    cpSync(join(realRepoRoot, entry), join(root, entry));
  }
  cpSync(join(realRepoRoot, 'src'), join(root, 'src'), {recursive: true});
  cpSync(join(realRepoRoot, 'public'), join(root, 'public'), {recursive: true});
  cpSync(join(realRepoRoot, 'projects', '_template'), join(root, 'projects', '_template'), {recursive: true});
  // Reuse the installed dependencies and provisioned browser via symlink.
  try {
    symlinkSync(join(realRepoRoot, 'node_modules'), join(root, 'node_modules'), 'junction');
  } catch {
    cpSync(join(realRepoRoot, 'node_modules'), join(root, 'node_modules'), {recursive: true});
  }
  mkdirSync(join(root, 'out'), {recursive: true});
  return {repoRoot: root};
}

/**
 * Create an isolated temporary repository context containing the tracked
 * projects/_template, a minimal generated directory and a package.json marker.
 * No real projects are copied. The returned context is injected directly into
 * command functions; it is never exposed as a CLI flag.
 */
export function createTestRepoContext(): RepoContext {
  const root = mkdtempSync(join(tmpdir(), 'motion-repo-'));

  // Minimal package.json fingerprint so deriveRepoContext-style checks pass and
  // the root is a valid package boundary.
  writeFileSync(join(root, 'package.json'), JSON.stringify({name: 'motion-video', private: true}));

  // Copy the tracked template.
  cpSync(join(realRepoRoot, 'projects', '_template'), join(root, 'projects', '_template'), {
    recursive: true,
  });

  // Minimal generated registry directory.
  mkdirSync(join(root, 'src', 'generated'), {recursive: true});
  writeFileSync(
    join(root, 'src', 'generated', 'project-registry.ts'),
    'export const projectRegistry = [] as const;\n',
  );

  mkdirSync(join(root, 'out'), {recursive: true});

  return {repoRoot: root};
}
