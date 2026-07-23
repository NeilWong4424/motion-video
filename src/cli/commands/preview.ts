import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadProjectFile} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {renderProfile, previewOutputPath} from '../../engine/renderer/render-preview.js';
import {rejectUrlLike} from '../guards.js';

export async function runPreview(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const project = await loadProjectFile(paths);
  if (!project.currentRevisionId) {
    process.stderr.write('SOURCE_NOT_SNAPSHOTTED\n');
    return 1;
  }
  const current = findCurrentPlan(paths, project.currentRevisionId);
  if (!current) {
    process.stderr.write('RENDER_PLAN_MISSING: run motion resolve first\n');
    return 1;
  }
  const output = previewOutputPath(current.dir);
  await renderProfile(context, current.plan, current.hash, 'preview', output);
  process.stdout.write(`${output}\n`);
  return 0;
}
