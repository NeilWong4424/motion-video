import {z} from 'zod';

import {
  CanvasSchema,
  KeyframeSchema,
  NodeKindSchema,
  NormalizedPointSchema,
  ProjectIdSchema,
  SegmentRangeSchema,
  SegmentRefSchema,
  Sha256Schema,
} from './common.js';

// --- Beats -----------------------------------------------------------------

export const BeatSchema = z.strictObject({
  id: z.string().min(1),
  durationFrames: z.number().int().positive(),
  objective: z.string().min(1),
  message: z.string().min(1),
  focalNodeId: z.string().min(1),
  liveContentNodeIds: z.array(z.string().min(1)),
  settleAt: SegmentRefSchema,
  holdRange: SegmentRangeSchema,
});
export type Beat = z.infer<typeof BeatSchema>;

// --- Continuity bridges ----------------------------------------------------

const BridgeBaseShape = {
  id: z.string().min(1),
  fromBeatId: z.string().min(1),
  toBeatId: z.string().min(1),
  narrativeReason: z.string().min(1),
  transitionFamily: z.string().min(1),
  vocabularyRole: z.enum(['ordinary', 'signature']),
  eyeTrace: z.strictObject({
    outgoing: z.strictObject({nodeId: z.string().min(1), point: NormalizedPointSchema}),
    incoming: z.strictObject({nodeId: z.string().min(1), point: NormalizedPointSchema}),
  }),
  motionOwnership: z.enum(['camera', 'node', 'camera-and-node-semantic']),
  combinationMeaning: z.string().min(1).optional(),
};

const PositiveDuration = z.number().int().positive();

export const SharedElementBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: PositiveDuration,
  mode: z.literal('shared-element'),
  nodeId: z.string().min(1),
  motionRange: SegmentRangeSchema,
});

export const CameraNavigationBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: PositiveDuration,
  mode: z.literal('camera-navigation'),
  cameraSegmentId: z.string().min(1),
  destinationNodeId: z.string().min(1),
  spatialRelationship: z.string().min(1),
});

export const MorphIntoTargetBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: PositiveDuration,
  mode: z.literal('morph-into-target'),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  motionRange: SegmentRangeSchema,
  preRollFrames: z.number().int().positive(),
  settleFrames: z.number().int().nonnegative(),
});

export const MatchOnActionBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: PositiveDuration,
  mode: z.literal('match-on-action'),
  outgoingNodeId: z.string().min(1),
  incomingNodeId: z.string().min(1),
  actionAt: SegmentRefSchema,
  action: z.enum(['translate', 'scale', 'rotate', 'draw', 'expand', 'collapse']),
});

export const DirectionalPushBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: PositiveDuration,
  mode: z.literal('directional-push'),
  direction: z.enum(['left', 'right', 'up', 'down']),
  semanticDirection: z.enum(['forward', 'back', 'parallel']),
});

export const ChapterCutBridgeSchema = z.strictObject({
  ...BridgeBaseShape,
  durationFrames: z.literal(0),
  mode: z.literal('chapter-cut'),
  reason: z.enum(['new-chapter', 'time-jump', 'location-jump', 'emotional-impact']),
  exceptionJustification: z.string().min(1),
  maxEyeTraceDistanceNormalized: z.number().gt(0).max(0.15),
});

export const ContinuityBridgeSchema = z.discriminatedUnion('mode', [
  SharedElementBridgeSchema,
  CameraNavigationBridgeSchema,
  MorphIntoTargetBridgeSchema,
  MatchOnActionBridgeSchema,
  DirectionalPushBridgeSchema,
  ChapterCutBridgeSchema,
]);
export type ContinuityBridge = z.infer<typeof ContinuityBridgeSchema>;

// --- Persistent nodes ------------------------------------------------------

const GeometryStateSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  scale: z.number().optional(),
  rotationDeg: z.number().optional(),
});

const StyleStateSchema = z.strictObject({
  opacity: z.number().min(0).max(1).optional(),
  color: z.string().min(1).optional(),
  backgroundColor: z.string().min(1).optional(),
});

const ContentStateSchema = z.strictObject({
  text: z.string().optional(),
  stateId: z.string().min(1).optional(),
});

export const ContentTransitionSchema = z.strictObject({
  fromStateId: z.string().min(1),
  toStateId: z.string().min(1),
  range: SegmentRangeSchema,
  mode: z.enum(['crossfade', 'masked-reveal', 'shared-text-morph', 'replace-on-action']),
});

export const PersistentNodeSchema = z.strictObject({
  id: z.string().min(1),
  kind: NodeKindSchema,
  parentId: z.string().min(1).optional(),
  space: z.enum(['world', 'screen']),
  semanticRole: z.enum(['content', 'decorative', 'background', 'overlay']),
  renderer: z.strictObject({
    id: z.string().min(1),
    version: z.string().min(1),
    props: z.unknown(),
  }),
  effects: z.array(
    z.strictObject({
      id: z.string().min(1),
      version: z.string().min(1),
      range: SegmentRangeSchema,
      props: z.unknown(),
    }),
  ),
  geometryTrack: z.array(KeyframeSchema(GeometryStateSchema)),
  styleTrack: z.array(KeyframeSchema(StyleStateSchema)),
  contentTrack: z.array(KeyframeSchema(ContentStateSchema)).optional(),
  contentTransitions: z.array(ContentTransitionSchema).optional(),
  visibleTrack: z.array(KeyframeSchema(z.number().min(0).max(1))),
});
export type PersistentNode = z.infer<typeof PersistentNodeSchema>;

// --- Camera ----------------------------------------------------------------

const CameraStateSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
  rotationDeg: z.number().optional(),
});

export const CameraTrackSchema = z.strictObject({
  id: z.literal('main-camera'),
  segments: z
    .array(
      z.discriminatedUnion('mode', [
        z.strictObject({
          id: z.string().min(1),
          mode: z.literal('hold'),
          segmentId: z.string().min(1),
          state: CameraStateSchema,
        }),
        z.strictObject({
          id: z.string().min(1),
          mode: z.literal('move'),
          segmentId: z.string().min(1),
          from: CameraStateSchema,
          to: CameraStateSchema,
          verb: z.enum(['pan', 'zoom', 'orbit']),
          easing: z.string().min(1),
          reveals: z.string().min(1),
        }),
      ]),
    )
    .min(1),
});
export type CameraTrack = z.infer<typeof CameraTrackSchema>;

// --- Motion cues -----------------------------------------------------------

export const MotionCueSchema = z.strictObject({
  id: z.string().min(1),
  at: SegmentRefSchema,
  role: z.enum(['hero-reveal', 'camera-travel', 'morph-handoff', 'payoff', 'resolve']),
  description: z.string().min(1),
});
export type MotionCue = z.infer<typeof MotionCueSchema>;

// --- MotionSpec ------------------------------------------------------------

export const MotionSpecSchema = z.strictObject({
  schemaVersion: z.literal('motion-spec@1'),
  projectId: ProjectIdSchema,
  treatmentHash: Sha256Schema,
  canvas: CanvasSchema,
  timeline: z.strictObject({
    beats: z.array(BeatSchema).min(1),
    bridges: z.array(ContinuityBridgeSchema),
  }),
  world: z.strictObject({
    coordinateSpace: z.literal('composition-pixels'),
    origin: z.literal('top-left'),
    transformOrigin: z.literal('top-left'),
    childGeometry: z.literal('parent-local'),
    nodes: z.array(PersistentNodeSchema).min(1),
  }),
  camera: CameraTrackSchema,
  motionCues: z.array(MotionCueSchema),
});
export type MotionSpec = z.infer<typeof MotionSpecSchema>;
