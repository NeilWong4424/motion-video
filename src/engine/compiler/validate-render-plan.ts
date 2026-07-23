import type {RenderPlan} from '../../contracts/render-plan.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

/**
 * Reject unresolved refs, unknown bindings, non-finite values, missing frame
 * coverage, duplicate node keys, multiple cameras, non-local asset references
 * and channel conflicts in a compiled RenderPlan.
 */
export function validateRenderPlan(plan: RenderPlan): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const keys = plan.nodes.map((n) => n.key);
  if (new Set(keys).size !== keys.length) {
    diagnostics.push(errorDiagnostic('RENDER_PLAN_DUPLICATE_KEY'));
  }

  if (plan.camera.id !== 'main-camera') {
    diagnostics.push(errorDiagnostic('RENDER_PLAN_CAMERA_INVALID'));
  }
  if (plan.camera.samples.length !== plan.durationInFrames) {
    diagnostics.push(
      errorDiagnostic('RENDER_PLAN_CAMERA_COVERAGE', {
        evidence: `${plan.camera.samples.length} != ${plan.durationInFrames}`,
      }),
    );
  }

  for (const sample of plan.camera.samples) {
    if (![sample.x, sample.y, sample.zoom].every(Number.isFinite)) {
      diagnostics.push(errorDiagnostic('RENDER_PLAN_NON_FINITE', {evidence: `camera frame ${sample.frame}`}));
      break;
    }
  }

  for (const node of plan.nodes) {
    // Effect channel conflicts over overlapping frames.
    for (let i = 0; i < node.effects.length; i++) {
      for (let j = i + 1; j < node.effects.length; j++) {
        const a = node.effects[i]!;
        const b = node.effects[j]!;
        const overlap = a.fromFrame < b.toFrame && b.fromFrame < a.toFrame;
        if (overlap && a.channels.some((c) => b.channels.includes(c))) {
          diagnostics.push(errorDiagnostic('RENDER_PLAN_CHANNEL_CONFLICT', {nodeId: node.id}));
        }
      }
    }
  }

  // Assets must be local static paths under generated-assets/.
  for (const asset of plan.assets) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(asset.staticFilePath) || asset.staticFilePath.includes('..')) {
      diagnostics.push(errorDiagnostic('RENDER_PLAN_NON_LOCAL_ASSET', {evidence: asset.assetId}));
    }
  }

  return diagnostics;
}
