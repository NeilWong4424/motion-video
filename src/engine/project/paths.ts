import {existsSync, lstatSync, realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve, sep} from 'node:path';

import {ProjectIdSchema} from '../../contracts/common.js';

export type RepoContext = {repoRoot: string};

export type ProjectPaths = {
  root: string;
  source: string;
  revisions: string;
  assets: string;
  output: string;
};

/**
 * Resolve the repository root from the installed CLI module location. Finds the
 * package root (directory containing package.json) and validates its
 * package/template fingerprint. The root is never user-selectable.
 */
export function deriveRepoContext(cliModuleUrl: string): RepoContext {
  let dir = dirname(fileURLToPath(cliModuleUrl));
  // Walk up until we find package.json.
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'package.json'))) {
      const canonical = realpathSync(dir);
      if (!existsSync(join(canonical, 'projects', '_template'))) {
        throw new Error('REPO_FINGERPRINT_INVALID: missing projects/_template');
      }
      return {repoRoot: canonical};
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('REPO_ROOT_NOT_FOUND');
}

function assertNoSymlinkEscape(context: RepoContext, target: string): void {
  const projectsRoot = join(context.repoRoot, 'projects');
  // Reject symlinked projects root.
  if (existsSync(projectsRoot) && lstatSync(projectsRoot).isSymbolicLink()) {
    throw new Error('PROJECT_PATH_SYMLINK_FORBIDDEN');
  }
  // Reject any symlinked component of the target that already exists.
  let current = target;
  while (current.startsWith(projectsRoot) && current !== projectsRoot) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error('PROJECT_PATH_SYMLINK_FORBIDDEN');
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

/**
 * Resolve a project's paths from the validated project ID and repo root.
 * Rejects traversal and any resolution that escapes the projects root.
 */
export function resolveProjectPaths(context: RepoContext, projectId: string): ProjectPaths {
  const parsed = ProjectIdSchema.safeParse(projectId);
  if (!parsed.success) {
    throw new Error('PROJECT_ID_INVALID');
  }
  const projectsRoot = join(context.repoRoot, 'projects');
  const root = resolve(projectsRoot, projectId);
  const expectedPrefix = `${projectsRoot}${sep}`;
  if (!(`${root}${sep}`.startsWith(expectedPrefix) || root === join(projectsRoot, projectId))) {
    throw new Error('PROJECT_ID_INVALID');
  }
  if (!root.startsWith(expectedPrefix)) {
    throw new Error('PROJECT_ID_INVALID');
  }
  assertNoSymlinkEscape(context, root);

  return {
    root,
    source: root,
    revisions: join(root, 'revisions'),
    assets: join(root, 'assets'),
    output: join(context.repoRoot, 'out', projectId),
  };
}
