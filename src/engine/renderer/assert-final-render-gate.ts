import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {TechnicalQCReportSchema, CreativeReviewSchema, MotionReviewSchema} from '../../contracts/review.js';
import {PreviewApprovalSchema} from '../../contracts/approval.js';
import {sha256Canonical} from '../hash.js';

export type FinalGateResult = {ok: true} | {ok: false; code: string; reason: string};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Load QC/Creative/Motion reviews and the Preview Approval from the plan's
 * review directory and verify every envelope/hash binding against the selected
 * revision, RenderPlan hash and reviewed preview bytes. All gates must pass with
 * ship/pass/approved. There is no --force or environment bypass.
 */
export function assertFinalRenderGate(outputDir: string, renderPlanHash: string, previewHash: string): FinalGateResult {
  const reviewDir = join(outputDir, 'review');
  const files = {
    qc: join(reviewDir, 'technical-qc.json'),
    creative: join(reviewDir, 'creative-review.json'),
    motion: join(reviewDir, 'motion-review.json'),
    approval: join(reviewDir, 'preview-approval.json'),
  };
  for (const [name, path] of Object.entries(files)) {
    if (!existsSync(path)) {
      return {ok: false, code: 'FINAL_GATE_INCOMPLETE', reason: `missing ${name}`};
    }
  }

  const qc = TechnicalQCReportSchema.parse(readJson(files.qc));
  const creative = CreativeReviewSchema.parse(readJson(files.creative));
  const motion = MotionReviewSchema.parse(readJson(files.motion));
  const approval = PreviewApprovalSchema.parse(readJson(files.approval));

  // Bindings must match the selected plan and preview.
  for (const artifact of [qc, creative, motion, approval]) {
    if (artifact.renderPlanHash !== renderPlanHash) {
      return {ok: false, code: 'FINAL_GATE_HASH_MISMATCH', reason: 'renderPlanHash'};
    }
    if (artifact.reviewedPreviewHash !== previewHash) {
      return {ok: false, code: 'RENDER_PLAN_STALE', reason: 'reviewedPreviewHash'};
    }
  }

  if (qc.decision !== 'pass') return {ok: false, code: 'FINAL_GATE_QC_FAILED', reason: qc.decision};
  if (!creative.complete || creative.decision !== 'ship') {
    return {ok: false, code: 'FINAL_GATE_CREATIVE_NOT_SHIP', reason: creative.decision};
  }
  if (!motion.complete || motion.decision !== 'ship') {
    return {ok: false, code: 'FINAL_GATE_MOTION_NOT_SHIP', reason: motion.decision};
  }
  if (approval.decision !== 'approved') {
    return {ok: false, code: 'FINAL_GATE_NOT_APPROVED', reason: 'not approved'};
  }

  // Approval must bind the exact review hashes.
  if (
    approval.technicalQcHash !== sha256Canonical(qc) ||
    approval.creativeReviewHash !== sha256Canonical(creative) ||
    approval.motionReviewHash !== sha256Canonical(motion)
  ) {
    return {ok: false, code: 'FINAL_GATE_HASH_MISMATCH', reason: 'approval review binding'};
  }

  return {ok: true};
}
