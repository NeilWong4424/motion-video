import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadSourceArtifacts} from '../../engine/project/load-project.js';
import {resolveMotion} from '../../engine/resolver/resolve-motion.js';
import {DeterministicLayoutService} from '../../engine/resolver/resolve-layout.js';
import {createCoreRegistry} from '../../capabilities/index.js';
import {hasErrors} from '../../contracts/diagnostic.js';
import {rejectUrlLike} from '../guards.js';

export async function runValidate(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const source = await loadSourceArtifacts(paths);
  const layout = new DeterministicLayoutService();
  const result = resolveMotion({
    brief: source.brief,
    treatment: source.treatment,
    motion: source.motion,
    layout,
    registry: createCoreRegistry(),
  });
  const diagnostics = [...result.diagnostics, ...layout.diagnostics];
  process.stdout.write(`${JSON.stringify(diagnostics, null, 2)}\n`);
  return hasErrors(diagnostics) ? 1 : 0;
}
