import {relative} from 'node:path';

import {createProject} from '../../engine/project/create-project.js';
import {buildProjectRegistry} from '../../engine/project/build-project-registry.js';
import type {RepoContext} from '../../engine/project/paths.js';
import {rejectUrlLike} from '../guards.js';

export async function runNew(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = await createProject(context, projectId);
  await buildProjectRegistry(context);
  process.stdout.write(`${relative(context.repoRoot, paths.root).replaceAll('\\', '/')}\n`);
  return 0;
}
