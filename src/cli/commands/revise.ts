import {readFileSync} from 'node:fs';

import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {SemanticPatchSchema} from '../../contracts/revision.js';
import {commitRevision} from '../../engine/revision/commit-revision.js';
import {buildProjectRegistry} from '../../engine/project/build-project-registry.js';
import {rejectUrlLike} from '../guards.js';

export type ReviseOptions = {patch: string; apply: boolean};

/**
 * motion revise --patch <local-json> --apply: applies a validated SemanticPatch
 * as a new immutable revision. Without --apply it only validates. Direct source
 * edits are never the rebuild mechanism; every change goes through this flow.
 */
export async function runRevise(context: RepoContext, projectId: string, options: ReviseOptions): Promise<number> {
  rejectUrlLike(projectId);
  rejectUrlLike(options.patch);
  const paths = resolveProjectPaths(context, projectId);

  const patch = SemanticPatchSchema.parse(JSON.parse(readFileSync(options.patch, 'utf8')));

  if (!options.apply) {
    process.stdout.write('patch valid (dry run; pass --apply to commit)\n');
    return 0;
  }

  const result = await commitRevision(paths, patch);
  if (!result.ok) {
    process.stdout.write(`${JSON.stringify(result.diagnostics, null, 2)}\n`);
    return 1;
  }
  await buildProjectRegistry(context);
  process.stdout.write(`${result.revisionId}\n`);
  return 0;
}
