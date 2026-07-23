import {readFileSync} from 'node:fs';

import type {RenderPlan} from '../../contracts/render-plan.js';
import {validateRenderPlan} from '../compiler/validate-render-plan.js';
import {errorDiagnostic, warningDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';
import {decodePng, compareCrop} from './seam-check.js';
import {detectDeadFrame} from './dead-frame-check.js';
import {checkCameraMotion} from './camera-motion-check.js';
import type {QcMetric} from './types.js';

export type RenderedFrameLookup = (frame: number) => string | null;

export type TechnicalQcResult = {
  diagnostics: Diagnostic[];
  metrics: QcMetric[];
  decision: 'pass' | 'fail';
};

const BACKGROUND = {r: 11, g: 12, b: 16};

/**
 * Run technical QC over a RenderPlan and rendered frames. Re-validates the plan,
 * executes each typed handoff contract by mode against rendered pixels/geometry,
 * checks dead frames and camera jerk. Returns a pass/fail decision.
 */
export function runTechnicalQc(plan: RenderPlan, getFramePath: RenderedFrameLookup): TechnicalQcResult {
  const diagnostics: Diagnostic[] = [];
  const metrics: QcMetric[] = [];

  diagnostics.push(...validateRenderPlan(plan));
  diagnostics.push(
    ...checkCameraMotion(plan.camera.samples.map((s) => ({frame: s.frame, x: s.x, y: s.y, zoom: s.zoom}))),
  );

  for (const check of plan.handoffChecks) {
    if (check.mode === 'exact-visual') {
      const srcPath = getFramePath(check.sourceFrame);
      const dstPath = getFramePath(check.targetFrame);
      if (srcPath && dstPath) {
        const result = compareCrop(
          decodePng(readFileSync(srcPath)),
          decodePng(readFileSync(dstPath)),
          check.cropOrMask,
        );
        metrics.push({bridgeId: check.bridgeId, mode: 'exact-visual', psnrDb: result.psnrDb, maxGeometryDriftPx: result.maxGeometryDriftPx});
        if (result.psnrDb < check.minPsnrDb) {
          diagnostics.push(errorDiagnostic('TRANSITION_ENDPOINT_MISMATCH', {bridgeId: check.bridgeId, evidence: `psnr ${result.psnrDb.toFixed(1)} < ${check.minPsnrDb}`}));
        }
      }
    } else if (check.mode === 'chapter-cut-evidence') {
      metrics.push({bridgeId: check.bridgeId, mode: 'chapter-cut-evidence', measuredEyeTraceDistanceNormalized: check.measuredEyeTraceDistanceNormalized});
      if (check.measuredEyeTraceDistanceNormalized > check.maxEyeTraceDistanceNormalized) {
        diagnostics.push(errorDiagnostic('EYE_TRACE_JUMP', {bridgeId: check.bridgeId}));
      }
    } else {
      metrics.push({bridgeId: check.bridgeId, mode: check.mode});
    }
  }

  // Dead-frame check across sampled frames.
  for (const sample of plan.camera.samples.filter((_, i) => i % Math.max(1, Math.round(plan.durationInFrames / 12)) === 0)) {
    const path = getFramePath(sample.frame);
    if (!path) continue;
    const result = detectDeadFrame(decodePng(readFileSync(path)), {backgroundColor: BACKGROUND});
    if (result.code === 'DEAD_FRAME_DETECTED') {
      diagnostics.push(errorDiagnostic('DEAD_FRAME_DETECTED', {frameRange: {from: sample.frame, to: sample.frame}, evidence: `${(result.backgroundFraction * 100).toFixed(1)}% background`}));
    }
  }

  if (metrics.length === 0 && plan.handoffChecks.length > 0) {
    diagnostics.push(warningDiagnostic('QC_NO_METRICS'));
  }

  const decision = diagnostics.some((d) => d.severity === 'error') ? 'fail' : 'pass';
  return {diagnostics, metrics, decision};
}
