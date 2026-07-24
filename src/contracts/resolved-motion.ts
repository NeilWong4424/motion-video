import {z} from 'zod';

import {CanvasSchema, NodeKindSchema, NormalizedPointSchema, ProjectIdSchema, Sha256Schema} from './common.js';

/** A resolved keyframe at an exact integer global frame. */
export const ResolvedKeyframeSchema = z.strictObject({
  frame: z.number().int().nonnegative(),
  value: z.unknown(),
  interpolation: z.enum(['hold', 'linear', 'ease']),
  easing: z.string().min(1).optional(),
});

export const ResolvedRegionSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

const CapabilityBindingSchema = z.strictObject({
  id: z.string().min(1),
  version: z.string().min(1),
  implementationHash: Sha256Schema,
  scope: z.string().min(1),
});

export const ResolvedNodeSchema = z.strictObject({
  id: z.string().min(1),
  kind: NodeKindSchema,
  space: z.enum(['world', 'screen']),
  semanticRole: z.enum(['content', 'decorative', 'background', 'overlay']),
  zIndex: z.number().int(),
  localBounds: ResolvedRegionSchema,
  worldBounds: ResolvedRegionSchema,
  renderer: CapabilityBindingSchema,
  rendererProps: z.unknown(),
  resolvedLines: z
    .array(z.strictObject({text: z.string(), x: z.number(), y: z.number(), fontSize: z.number().positive()}))
    .optional(),
  effects: z.array(
    CapabilityBindingSchema.extend({
      fromFrame: z.number().int().nonnegative(),
      toFrame: z.number().int().nonnegative(),
      channels: z.array(z.string().min(1)),
      // The validated effect intent (author props parsed against the capability's
      // intent schema, defaults filled). `z.unknown()` mirrors `rendererProps`;
      // per-capability validation already happened at bind time.
      intent: z.unknown(),
    }),
  ),
  geometryTrack: z.array(ResolvedKeyframeSchema),
  styleTrack: z.array(ResolvedKeyframeSchema),
  contentTrack: z.array(ResolvedKeyframeSchema),
  visibleTrack: z.array(ResolvedKeyframeSchema),
});

export const HandoffCheckSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('exact-visual'),
    bridgeId: z.string().min(1),
    sourceFrame: z.number().int().nonnegative(),
    targetFrame: z.number().int().nonnegative(),
    anchorNodeId: z.string().min(1),
    cropOrMask: ResolvedRegionSchema,
    minPsnrDb: z.number().positive(),
    maxGeometryDriftPx: z.number().nonnegative(),
  }),
  z.strictObject({
    mode: z.literal('geometry-only'),
    bridgeId: z.string().min(1),
    sourceFrame: z.number().int().nonnegative(),
    targetFrame: z.number().int().nonnegative(),
    anchorNodeId: z.string().min(1),
    maxGeometryDriftPx: z.number().nonnegative(),
  }),
  z.strictObject({
    mode: z.literal('continuous-motion'),
    bridgeId: z.string().min(1),
    sourceFrame: z.number().int().nonnegative(),
    targetFrame: z.number().int().nonnegative(),
    anchorNodeId: z.string().min(1),
    maxPositionJumpPx: z.number().nonnegative(),
    maxVelocityDeltaPxPerFrame: z.number().nonnegative(),
  }),
  z.strictObject({
    mode: z.literal('chapter-cut-evidence'),
    bridgeId: z.string().min(1),
    sourceFrame: z.number().int().nonnegative(),
    targetFrame: z.number().int().nonnegative(),
    incomingHeldFrame: z.number().int().nonnegative(),
    outgoingEyeTrace: NormalizedPointSchema,
    incomingEyeTrace: NormalizedPointSchema,
    maxEyeTraceDistanceNormalized: z.number().gt(0).max(0.15),
    measuredEyeTraceDistanceNormalized: z.number().nonnegative(),
  }),
]);
export type HandoffCheck = z.infer<typeof HandoffCheckSchema>;

export const ResolvedTimelineSegmentSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(['beat', 'bridge']),
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
  cutAtFrame: z.number().int().nonnegative().optional(),
});

export const ResolvedMotionIRSchema = z.strictObject({
  schemaVersion: z.literal('resolved-motion@1'),
  projectId: ProjectIdSchema,
  motionSpecHash: Sha256Schema,
  layoutArtifactHash: Sha256Schema,
  canvas: CanvasSchema,
  durationInFrames: z.number().int().positive(),
  segments: z.array(ResolvedTimelineSegmentSchema).min(1),
  nodes: z.array(ResolvedNodeSchema).min(1),
  cameraSamples: z.array(
    z.strictObject({frame: z.number().int().nonnegative(), x: z.number(), y: z.number(), zoom: z.number()}),
  ),
  handoffChecks: z.array(HandoffCheckSchema),
});
export type ResolvedMotionIR = z.infer<typeof ResolvedMotionIRSchema>;
