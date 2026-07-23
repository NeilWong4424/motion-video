import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadProjectFile} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {renderFinal} from '../../engine/renderer/render-final.js';
import {sha256Hex} from '../../engine/hash.js';
import {rejectUrlLike} from '../guards.js';

/**
 * Render the final silent master. Delegates to renderFinal(), which enforces the
 * QC + both reviews + approval gate before opening any output. No --force, no
 * environment bypass, no alternate entry point.
 */
export async function runRender(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const project = await loadProjectFile(paths);
  if (!project.currentRevisionId) {
    process.stderr.write('SOURCE_NOT_SNAPSHOTTED\n');
    return 1;
  }
  const current = findCurrentPlan(paths, project.currentRevisionId);
  if (!current) {
    process.stderr.write('RENDER_PLAN_MISSING\n');
    return 1;
  }
  const previewHash = sha256Hex(readFileSync(join(current.dir, 'render.plan.json')));
  const output = await renderFinal(context, current.plan, current.hash, current.dir, previewHash);
  process.stdout.write(`${output}\n`);
  return 0;
}
