import {relative} from 'node:path';

import {createProject} from '../../engine/project/create-project.js';
import {buildProjectRegistry} from '../../engine/project/build-project-registry.js';
import type {RepoContext} from '../../engine/project/paths.js';
import {anchorRepoRoot, initializeProject} from '../../engine/ledger/index.js';
import {rejectUrlLike} from '../guards.js';

export async function runNew(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = await createProject(context, projectId);
  await buildProjectRegistry(context);

  // Initialize the append-only Workflow Ledger for this project. `motion new` is a
  // direct CLI operation, not the governed adapter path, so it records CLI
  // provenance with an empty instruction: no brief was supplied at the command
  // line. This honestly records "a project was created via CLI" rather than
  // fabricating a user brief or an out-of-band trusted-host envelope.
  const anchor = anchorRepoRoot(context.repoRoot);
  initializeProject(anchor, {
    requestedProjectId: projectId,
    allocatedProjectId: projectId,
    requestClass: 'new-project',
    trustedHostId: 'claude-code',
    rawUserInstruction: '',
    suppliedLocalPathCount: 0,
    suppliedLocatorSetHash: null,
  });

  process.stdout.write(`${relative(context.repoRoot, paths.root).replaceAll('\\', '/')}\n`);
  return 0;
}
