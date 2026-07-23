import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {resolveProjectPaths, type RepoContext} from '../../engine/project/paths.js';
import {loadProjectFile} from '../../engine/project/load-project.js';
import {findCurrentPlan} from '../../engine/renderer/resolve-project.js';
import {TechnicalQCReportSchema, CreativeReviewSchema, MotionReviewSchema} from '../../contracts/review.js';
import {PreviewApprovalSchema} from '../../contracts/approval.js';
import {writeCanonicalFileSync} from '../../engine/project/atomic-write.js';
import {sha256Canonical, sha256Hex} from '../../engine/hash.js';
import {rejectUrlLike} from '../guards.js';

export type ApproveOptions = {
  reviewedPlan: string;
  actor: 'human' | 'codex' | 'claude-code';
  reason: string;
};

/**
 * Record a Preview Approval. Reloads the current revision, RenderPlan, preview
 * bytes, passing QC and both hash-bound reviews; rejects fix/rebuild, stale
 * hashes and empty reason. Host approval is accepted only under an explicit
 * project opt-in and only after both reviews say ship.
 */
export async function runApprove(context: RepoContext, projectId: string, options: ApproveOptions): Promise<number> {
  rejectUrlLike(projectId);
  if (!options.reason || options.reason.trim().length === 0) {
    process.stderr.write('APPROVAL_REASON_REQUIRED\n');
    return 1;
  }
  const paths = resolveProjectPaths(context, projectId);
  const project = await loadProjectFile(paths);
  if (!project.currentRevisionId) {
    process.stderr.write('SOURCE_NOT_SNAPSHOTTED\n');
    return 1;
  }
  const current = findCurrentPlan(paths, project.currentRevisionId);
  if (!current || current.hash !== options.reviewedPlan) {
    process.stderr.write('APPROVAL_PLAN_MISMATCH\n');
    return 1;
  }

  const reviewDir = join(current.dir, 'review');
  const files = {
    qc: join(reviewDir, 'technical-qc.json'),
    creative: join(reviewDir, 'creative-review.json'),
    motion: join(reviewDir, 'motion-review.json'),
  };
  for (const [name, path] of Object.entries(files)) {
    if (!existsSync(path)) {
      process.stderr.write(`APPROVAL_EVIDENCE_MISSING: ${name}\n`);
      return 1;
    }
  }
  const qc = TechnicalQCReportSchema.parse(JSON.parse(readFileSync(files.qc, 'utf8')));
  const creative = CreativeReviewSchema.parse(JSON.parse(readFileSync(files.creative, 'utf8')));
  const motion = MotionReviewSchema.parse(JSON.parse(readFileSync(files.motion, 'utf8')));

  if (qc.decision !== 'pass' || creative.decision !== 'ship' || motion.decision !== 'ship') {
    process.stderr.write('APPROVAL_NOT_SHIP\n');
    return 1;
  }
  if (!creative.complete || !motion.complete) {
    process.stderr.write('APPROVAL_REVIEW_INCOMPLETE\n');
    return 1;
  }

  // Host approval requires explicit opt-in.
  if (options.actor !== 'human') {
    const policy = project.previewApproval;
    if (policy.mode !== 'host-allowed' || !policy.allowedHosts.includes(options.actor)) {
      process.stderr.write('APPROVAL_HOST_NOT_ALLOWED\n');
      return 1;
    }
  }

  const previewHash = sha256Hex(readFileSync(join(current.dir, 'render.plan.json')));

  const approval = PreviewApprovalSchema.parse({
    schemaVersion: 'preview-approval@1',
    projectId,
    revisionId: project.currentRevisionId,
    renderPlanHash: current.hash,
    reviewedPreviewHash: previewHash,
    technicalQcHash: sha256Canonical(qc),
    creativeReviewHash: sha256Canonical(creative),
    motionReviewHash: sha256Canonical(motion),
    decision: 'approved',
    actor: options.actor,
    reason: options.reason,
  });

  writeCanonicalFileSync(join(reviewDir, 'preview-approval.json'), approval);
  process.stdout.write('approved\n');
  return 0;
}
