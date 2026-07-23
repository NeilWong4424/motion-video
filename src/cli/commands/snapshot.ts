import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {snapshotProject} from '../../engine/project/snapshot.js';
import {buildProjectRegistry} from '../../engine/project/build-project-registry.js';
import {rejectUrlLike} from '../guards.js';

export async function runSnapshot(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const revisionId = await snapshotProject(paths);
  await buildProjectRegistry(context);
  process.stdout.write(`${revisionId}\n`);
  return 0;
}
