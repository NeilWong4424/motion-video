import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadSourceArtifacts} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {rejectUrlLike} from '../guards.js';

export async function runInspect(context: RepoContext, projectId: string): Promise<number> {
  rejectUrlLike(projectId);
  const paths = resolveProjectPaths(context, projectId);
  const source = await loadSourceArtifacts(paths);

  const summary: Record<string, unknown> = {
    projectId: source.project.projectId,
    status: source.project.status,
    currentRevisionId: source.project.currentRevisionId,
    canvas: source.motion.canvas,
    beats: source.motion.timeline.beats.length,
    bridges: source.motion.timeline.bridges.map((b) => ({id: b.id, mode: b.mode})),
    nodes: source.motion.world.nodes.map((n) => `${n.renderer.id}@${n.renderer.version}`),
  };

  if (source.project.currentRevisionId) {
    const current = findCurrentPlan(paths, source.project.currentRevisionId);
    summary.resolved = current
      ? {renderPlanHash: current.hash, durationInFrames: current.plan.durationInFrames}
      : 'unresolved (run motion resolve)';
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return 0;
}
