import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadProjectFile} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {renderStills, type StillRequest} from '../../engine/renderer/render-stills.js';
import {rejectUrlLike} from '../guards.js';

export async function runStills(
  context: RepoContext,
  projectId: string,
  frames: readonly number[],
): Promise<number> {
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
  const requests: StillRequest[] = frames.map((frame) => ({frame, label: 'still'}));
  const paths2 = await renderStills(context, current.plan, current.hash, current.dir, requests);
  process.stdout.write(`${paths2.join('\n')}\n`);
  return 0;
}
