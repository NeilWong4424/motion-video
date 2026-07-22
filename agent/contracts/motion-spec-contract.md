# MotionSpec documentation contract

This file is the normative, role-readable shape of `MotionSpec@1`, aligned to the approved design and implementation plan. It documents data only: no runtime type, JSON Schema, validator, resolver, renderer, or engine source is implemented in Part 1. Every union below is closed; an undeclared discriminator value is invalid.

## Segment, Range, track, and state primitives

```ts
type SegmentRef = {segmentId: string; progress: number}; // progress is 0..1
type SegmentRange = {from: SegmentRef; to: SegmentRef};
type NormalizedPoint = {x: number; y: number};            // each component is 0..1

type Keyframe<T> = {
  at: SegmentRef;
  value: T;
  interpolation: "hold" | "linear" | "cubic";
  easing?: string;
};
type Track<T> = {id: string; keyframes: [Keyframe<T>, ...Keyframe<T>[]]};

type GeometryState = {x: number; y: number; width: number; height: number; rotationDegrees: number; scaleX: number; scaleY: number};
type StyleState = {opacity: number; fill?: string; stroke?: string; strokeWidth?: number};
type ContentState = {stateId: string; contentId: string};
type CameraState = {x: number; y: number; zoom: number; rotationDegrees: number};
```

Each Beat is the segment registry: `Beat.segmentId` is unique and establishes one ordered timeline segment. Its global half-open interval uses cumulative duration: `[sum(previous Beat.durationFrames), sum(previous and current Beat.durationFrames))`. `resolveBoundary(ref)` resolves as `segmentStartFrame + floor(ref.progress * durationFrames)`; equivalently, every `SegmentRef` uses that formula. `progress: 1` resolves only as an exclusive range end or exact next-Beat boundary, never as a sampled frame inside that segment. The MotionSpec Range type is exactly `SegmentRange`; it resolves to a half-open `[fromFrame, toFrameExclusive)` interval and must not run backward. Source data never substitutes raw global frames for these references.

## Beat

```ts
type Beat = {
  id: string;
  segmentId: string;
  durationFrames: number;          // positive integer
  objective: string;
  message: string;
  focalNodeId: string;
  liveContentNodeIds: string[];    // non-empty, unique, resolvable
  settleAt: SegmentRef;
  holdRange: SegmentRange;
};
```

A Beat is a narrative information state, not a slide. `settleAt` and the positive readable `holdRange` must resolve inside that Beat.

## ContinuityBridge

Every adjacent ordered Beat pair has exactly one bridge. All bridges carry this exact base:

```ts
type BridgeBase = {
  id: string;
  fromBeatId: string;
  toBeatId: string;
  durationFrames: number;
  bridgeRange: SegmentRange;
  narrativeReason: string;
  transitionFamily: string;
  vocabularyRole: "ordinary" | "signature";
  motionOwnership: "camera" | "node" | "camera-and-node-semantic";
  combinationMeaning?: string;
  eyeTrace: {
    outgoing: {nodeId: string; point: NormalizedPoint};
    incoming: {nodeId: string; point: NormalizedPoint};
  };
};
```

`combinationMeaning` is required when semantically combined camera and node motion is used. The closed union has exactly six variants:

```ts
type SharedElementBridge = BridgeBase & {
  mode: "shared-element";
  nodeId: string;
  motionRange: SegmentRange;
};

type CameraNavigationBridge = BridgeBase & {
  mode: "camera-navigation";
  cameraSegmentId: string;
  destinationNodeId: string;
  spatialRelationship: string;
  cameraRange: SegmentRange;
};

type MorphIntoTargetBridge = BridgeBase & {
  mode: "morph-into-target";
  sourceNodeId: string;
  targetNodeId: string;
  motionRange: SegmentRange;
  preRollFrames: number;
  settleFrames: number;
};

type MatchOnActionBridge = BridgeBase & {
  mode: "match-on-action";
  outgoingNodeId: string;
  incomingNodeId: string;
  actionAt: SegmentRef;
  motionRange: SegmentRange;
  action: "translate" | "scale" | "rotate" | "draw" | "expand" | "collapse";
};

type DirectionalPushBridge = BridgeBase & {
  mode: "directional-push";
  direction: "left" | "right" | "up" | "down";
  semanticDirection: "forward" | "back" | "parallel";
  outgoingNodeIds: [string, ...string[]];
  incomingNodeIds: [string, ...string[]];
  motionRange: SegmentRange;
};

type ChapterCutBridge = BridgeBase & {
  mode: "chapter-cut";
  durationFrames: 0;
  reason: "new-chapter" | "time-jump" | "location-jump" | "emotional-impact";
  exceptionJustification: string;
  maxEyeTraceDistanceNormalized: number;
  boundaryAt: SegmentRef;
  outgoingNodeId: string;
  incomingNodeId: string;
};

type ContinuityBridge =
  | SharedElementBridge
  | CameraNavigationBridge
  | MorphIntoTargetBridge
  | MatchOnActionBridge
  | DirectionalPushBridge
  | ChapterCutBridge;
```

All non-cut variants require positive `durationFrames`; resolved `bridgeRange` length must equal `durationFrames`. For every `motionRange`, its resolved durationFrames and the bridge `durationFrames` must be equal; `cameraRange` likewise equals the declared bridge range. Every node/camera reference must resolve to the actual participant. `cameraSegmentId` must name a move whose range equals `cameraRange`. Their downstream evidence is before/midpoint/after. A `chapter-cut` has zero transition frames: `bridgeRange.from`, `bridgeRange.to`, and `boundaryAt` are the same adjacent-Beat boundary. It instead requires outgoing-last, incoming-first, incoming-held, and full-frame-change evidence. It additionally requires a real break, Treatment exception budget, and `maxEyeTraceDistanceNormalized` greater than zero and `<= 0.15`; measured Euclidean distance above that declaration emits `EYE_TRACE_JUMP`. The entire film has at most one chapter cut and no adjacent cuts.

## ContentTransition and PersistentNode

```ts
type ContentTransition = {
  id: string;
  fromStateId: string;
  toStateId: string;
  range: SegmentRange;
  mode: "crossfade" | "masked-reveal" | "shared-text-morph" | "replace-on-action";
};

type PersistentNode = {
  id: string;
  kind: "text" | "shape" | "path" | "image" | "ui" | "chart" | "logo" | "group";
  parentId?: string;
  space: "world" | "screen";
  semanticRole: "content" | "decorative" | "background" | "overlay";
  renderer: {id: string; version: string; props: unknown};
  effects: Array<{
    id: string;
    version: string;
    range: SegmentRange;
    props: unknown;
  }>;
  geometryTrack: Track<GeometryState>;
  styleTrack: Track<StyleState>;
  contentTrack?: Track<ContentState>;
  contentTransitions?: ContentTransition[];
  visibleTrack: Track<number>;
};
```

The base renderer owns static markup; effects own declared animation channels only within their ranges. Overlapping effects cannot own the same channel. Camera motion remains in `CameraTrack` and boundary motion remains in `ContinuityBridge`.

Stable identity and target preroll are different proofs. A `shared-element` uses one `nodeId`, one mounted node root, and its actual geometry track across both Beats. A `morph-into-target` uses two honest identities: the real `targetNodeId` must already be mounted and frozen for positive `preRollFrames`, then settle for declared `settleFrames`; a hand-built lookalike is invalid. Persistent nodes are mounted for the film even when their visibility is zero; their roots and continuity-owned subnodes must not remount at a boundary.

## CameraTrack and MotionCue

```ts
type CameraTrack = {
  id: "main-camera";
  segments: Array<
    | {id: string; mode: "hold"; range: SegmentRange; state: CameraState}
    | {
        id: string;
        mode: "move";
        range: SegmentRange;
        from: CameraState;
        to: CameraState;
        primaryVerb: "pan" | "zoom" | "track";
        combinedVerbs?: ["pan" | "zoom" | "track"];
        combinationRationale?: string;
        easing: string;
        sourceFocalNodeId: string;
        destinationFocalNodeId: string;
        eyeTrace: {
          outgoing: {nodeId: string; point: NormalizedPoint};
          incoming: {nodeId: string; point: NormalizedPoint};
        };
        reveals: {nodeId: string; spatialRelationship: string};
      }
  >;
};

type MotionCue = {
  id: string;
  at: SegmentRef;
  event: "hero-reveal" | "camera-travel" | "morph-handoff" | "payoff" | "resolve";
  label: string;
  beatId: string;
  bridgeId?: string;
  nodeIds: string[];
};
```

There is exactly one `main-camera`. Camera segment `range` values partition and cover the complete half-open film timeline without gaps and without overlaps. One `primaryVerb` is the default. `combinedVerbs` must be unique and has a maximum of one distinct secondary verb (therefore two verbs total); when present it requires a non-empty `combinationRationale`. The secondary must differ from `primaryVerb` and use only the closed `pan | zoom | track` 2D vocabulary. Without a secondary verb, both `combinedVerbs` and `combinationRationale` are omitted. Every move binds real source/destination focal nodes, an explicit continuous normalized `eyeTrace`, and a non-empty `reveals` node/spatial relationship. Each verb needs a semantic—not decorative—reason. Decorative always-moving camera drift and undefined 3D orbit semantics are invalid. Motion cues identify continuous film events, not pages, and do not grant audio-generation authority.

## Top-level MotionSpec

```ts
type MotionSpec = {
  schemaVersion: "motion-spec@1";
  projectId: string;
  treatmentHash: string;
  canvas: {
    width: number;
    height: number;
    fps: 24 | 25 | 30 | 50 | 60;
  };
  timeline: {beats: Beat[]; bridges: ContinuityBridge[]};
  world: {
    coordinateSpace: "composition-pixels";
    origin: "top-left";
    transformOrigin: "top-left";
    childGeometry: "parent-local";
    nodes: PersistentNode[];
  };
  camera: CameraTrack;
  motionCues: MotionCue[];
};
```

## Salience and anti-slide invariants

At each boundary, the continuity anchor must be the focal node, a focal ancestor, or carry at least **10%** of opacity-, projected-area-, and focal-importance-weighted visible salience. The 10% threshold is the minimum accepted weighted anchor salience; a decorative speck cannot qualify.

Validation performs a whole-film repeated-full-frame check using weighted visible-content replacement and layout fingerprints, not node count alone. It rejects repeated full-page composition/timing or high full-frame replacement even when one small node persists. Resolved validation must prove the declared bridge is realized by actual node/camera/content tracks and must reject undeclared content pops, fake identity, fake preroll, transform-ownership conflicts, or an unresolved target.
