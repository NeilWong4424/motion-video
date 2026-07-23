import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {resolveProject} from '../../engine/renderer/resolve-project.js';
import {buildProjectRegistry} from '../../engine/project/build-project-registry.js';
import {hasErrors} from '../../contracts/diagnostic.js';
import {rejectUrlLike} from '../guards.js';

export async function runResolve(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const result = await resolveProject(paths);

  if (!result.renderPlan || hasErrors(result.diagnostics)) {
    process.stdout.write(`${JSON.stringify(result.diagnostics, null, 2)}\n`);
    return 1;
  }
  await buildProjectRegistry(context);
  process.stdout.write(`${result.renderPlanHash}\n`);
  return 0;
}
