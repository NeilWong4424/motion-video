import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadProjectFile} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {renderStills} from '../../engine/renderer/render-stills.js';
import {sampleReviewFrames} from '../../engine/qc/frame-sampler.js';
import {runTechnicalQc} from '../../engine/qc/technical-qc.js';
import {createQcReport} from '../../engine/qc/create-qc-report.js';
import {writeCanonicalFileSync} from '../../engine/project/atomic-write.js';
import {sha256Hex} from '../../engine/hash.js';
import {ResolvedMotionIRSchema} from '../../contracts/resolved-motion.js';
import {rejectUrlLike} from '../guards.js';

export async function runQc(context: RepoContext, projectId: string): Promise<number> {
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

  const irPath = join(current.dir, 'motion.resolved.json');
  const ir = ResolvedMotionIRSchema.parse(JSON.parse(readFileSync(irPath, 'utf8')));
  const sampled = sampleReviewFrames(ir, current.plan);

  // Render the sampled review frames plus the exact handoff frames.
  const handoffFrames = new Set<number>();
  for (const check of current.plan.handoffChecks) {
    handoffFrames.add(check.sourceFrame);
    handoffFrames.add(check.targetFrame);
  }
  const allFrames = new Map<number, string>();
  for (const s of sampled) allFrames.set(s.frame, s.label);
  for (const f of handoffFrames) if (!allFrames.has(f)) allFrames.set(f, 'handoff');

  const requests = [...allFrames.entries()].map(([frame, label]) => ({frame, label}));
  await renderStills(context, current.plan, current.hash, current.dir, requests);

  const framePath = (frame: number): string | null => {
    const label = allFrames.get(frame);
    if (label === undefined) return null;
    const path = join(current.dir, `${frame}-${label}.png`);
    return existsSync(path) ? path : null;
  };

  const result = runTechnicalQc(current.plan, framePath);
  const previewHash = sha256Hex(readFileSync(join(current.dir, 'render.plan.json')));
  const report = createQcReport(current.plan, current.hash, previewHash, result);

  writeCanonicalFileSync(join(current.dir, 'review', 'technical-qc.json'), report);
  process.stdout.write(`${JSON.stringify({decision: report.decision, diagnostics: report.diagnostics}, null, 2)}\n`);
  return report.decision === 'pass' ? 0 : 1;
}
