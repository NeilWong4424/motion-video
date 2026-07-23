import type {z} from 'zod';

import {RenderPlanSchema, type RenderPlan, type EngineBuildIdentity} from '../../contracts/render-plan.js';
import type {ResolvedMotionIRSchema} from '../../contracts/resolved-motion.js';
import {sha256Canonical} from '../hash.js';

type ResolvedMotionIR = z.infer<typeof ResolvedMotionIRSchema>;

/**
 * Compile a ResolvedMotionIR into a canonical RenderPlan. Sorts nodes by layer,
 * zIndex then id; embeds the verified build identity and the two silent output
 * profiles; preserves the resolver's typed handoff contracts verbatim. The
 * compiler invents no pixel checks and alters no copy/layout/duration/easing.
 */
export function compileMotion(
  ir: ResolvedMotionIR,
  build: EngineBuildIdentity,
  revisionId = 'rev-0001',
): RenderPlan {
  const sortedNodes = [...ir.nodes].sort(
    (a, b) =>
      a.space.localeCompare(b.space) || a.zIndex - b.zIndex || a.id.localeCompare(b.id),
  );

  const previewLongEdge = 960;
  const scale = Math.min(1, previewLongEdge / Math.max(ir.canvas.width, ir.canvas.height));
  const previewWidth = Math.round(ir.canvas.width * scale);
  const previewHeight = Math.round(ir.canvas.height * scale);

  const seed = sha256Canonical({
    projectId: ir.projectId,
    motionSpecHash: ir.motionSpecHash,
    layoutArtifactHash: ir.layoutArtifactHash,
  });

  const plan: RenderPlan = {
    schemaVersion: 'render-plan@1',
    projectId: ir.projectId,
    revisionId,
    resolvedMotionHash: sha256Canonical(ir),
    canvas: ir.canvas,
    durationInFrames: ir.durationInFrames,
    seed,
    build,
    profiles: {
      preview: {
        kind: 'preview',
        longEdge: previewLongEdge,
        width: previewWidth,
        height: previewHeight,
        codec: 'h264',
        crf: 28,
        silent: true,
      },
      final: {
        kind: 'final',
        width: ir.canvas.width,
        height: ir.canvas.height,
        codec: 'h264',
        crf: 18,
        silent: true,
      },
    },
    nodes: sortedNodes.map((n) => ({
      ...n,
      key: n.id,
      layer: n.space,
    })),
    camera: {id: 'main-camera', samples: ir.cameraSamples},
    assets: [],
    handoffChecks: ir.handoffChecks,
  };

  return RenderPlanSchema.parse(plan);
}
