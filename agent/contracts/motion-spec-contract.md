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

Every adjacent ordered Beat pair has exactly one bridge. The bridge IDs must name that exact adjacent ordered Beat pair: `fromBeatId` is the earlier member and `toBeatId` is the immediately following member. All bridges carry only this identity/boundary base:

```ts
type TransitionFamily =
  | "shared-element"
  | "camera-navigation"
  | "morph-into-target"
  | "match-on-action"
  | "directional-push";

type BridgeIdentityBase = {
  id: string;
  fromBeatId: string;
  toBeatId: string;
  durationFrames: number;
  bridgeRange: SegmentRange;
  narrativeReason: string;
  eyeTrace: {
    outgoing: {nodeId: string; point: NormalizedPoint};
    incoming: {nodeId: string; point: NormalizedPoint};
  };
};

type PositiveDurationBridgeBase = BridgeIdentityBase & {
  transitionFamily: TransitionFamily;
  vocabularyRole: "ordinary" | "signature";
  motionOwnership: "camera" | "node" | "camera-and-node-semantic";
  combinationMeaning?: string;
};
```

Within every member, `fromBeatId` and `toBeatId` form the exact adjacent ordered Beat pair; neither field may point to a merely nearby or non-adjacent Beat.

`combinationMeaning` is required when semantically combined camera and node motion is used. The closed union has exactly six variants:

```ts
type SharedElementBridge = PositiveDurationBridgeBase & {
  mode: "shared-element";
  transitionFamily: "shared-element";
  nodeId: string;
  motionRange: SegmentRange;
};

type CameraNavigationBridge = PositiveDurationBridgeBase & {
  mode: "camera-navigation";
  transitionFamily: "camera-navigation";
  cameraSegmentId: string;
  destinationNodeId: string;
  spatialRelationship: string;
  cameraRange: SegmentRange;
};

type MorphIntoTargetBridge = PositiveDurationBridgeBase & {
  mode: "morph-into-target";
  transitionFamily: "morph-into-target";
  sourceNodeId: string;
  targetNodeId: string;
  motionRange: SegmentRange;
  preRollFrames: number;
  settleFrames: number;
};

type MatchOnActionBridge = PositiveDurationBridgeBase & {
  mode: "match-on-action";
  transitionFamily: "match-on-action";
  outgoingNodeId: string;
  incomingNodeId: string;
  actionAt: SegmentRef;
  motionRange: SegmentRange;
  action: "translate" | "scale" | "rotate" | "draw" | "expand" | "collapse";
};

type DirectionalPushBridge = PositiveDurationBridgeBase & {
  mode: "directional-push";
  transitionFamily: "directional-push";
  direction: "left" | "right" | "up" | "down";
  semanticDirection: "forward" | "back" | "parallel";
  outgoingNodeIds: [string, ...string[]];
  incomingNodeIds: [string, ...string[]];
  motionRange: SegmentRange;
};

type ChapterCutBridge = BridgeIdentityBase & {
  mode: "chapter-cut";
  exceptionRole: "chapter-cut";
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

For adjacent Beats derive `fromBeatStartFrame`, `boundaryFrame` (the outgoing Beat's exclusive end and incoming Beat's start), and `toBeatEndFrame`. For every positive-duration bridge, resolve `bridgeRange` to `[bridgeStartFrame, bridgeEndFrameExclusive)` and enforce this exact seam-straddling inequality:

```text
fromBeatStartFrame < bridgeStartFrame < boundaryFrame < bridgeEndFrameExclusive < toBeatEndFrame
```

This makes `durationFrames` a positive integer of at least two, with `bridgeEndFrameExclusive - bridgeStartFrame === durationFrames`. It also guarantees that `beforeFrame = bridgeStartFrame - 1` is in the outgoing Beat and `afterFrame = bridgeEndFrameExclusive` is in the incoming Beat. A positive bridge that lies wholly inside one Beat, merely touches the boundary, or targets any non-adjacent pair is invalid.

Every variant's literal `transitionFamily` must equal its `mode` and must be authorized by the Treatment's positive-duration `transitionVocabulary`. Each `motionRange` and `cameraRange` must have the exact same resolved start and end as `bridgeRange`, not merely the same duration. Every node/camera reference must resolve to the actual participant. `cameraSegmentId` must name the move whose range is that exact `cameraRange`. Their downstream evidence is before/midpoint/after.

A `chapter-cut` is a closed, zero-duration Treatment-budgeted exception outside `transitionVocabulary`; it is not a sixth positive transition family. `ChapterCutBridge` deliberately omits `transitionFamily`, `vocabularyRole`, `motionOwnership`, and `combinationMeaning`. Its `bridgeRange.from`, `bridgeRange.to`, and `boundaryAt` must all resolve to the exact adjacent-Beat `boundaryFrame`. It instead requires outgoing-last, incoming-first, incoming-held, and full-frame-change evidence. It additionally requires a real break, available `TreatmentSpec.chapterCutBudget`, and `maxEyeTraceDistanceNormalized` greater than zero and `<= 0.15`; measured Euclidean distance above that declaration emits `EYE_TRACE_JUMP`. The entire film has at most one chapter cut and no adjacent cuts.

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
  briefHash: string;
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

The accepted Brief is a direct identity and timing parent, not merely an ancestor hidden behind the Treatment. `MotionSpec.projectId` and `BriefSpec.projectId` must be exactly equal; `briefHash` must be the canonical hash of that exact accepted Brief, and `treatmentHash` must bind a Treatment carrying the same `briefHash`. `MotionSpec.canvas.width`, `MotionSpec.canvas.height`, and `MotionSpec.canvas.fps` must equal the corresponding `BriefSpec` values. The ordered Beat registry covers the complete film with no hidden tail or gap, and `sum(Beat.durationFrames) === BriefSpec.durationInFrames`.

## Salience and anti-slide invariants

At each boundary, the continuity anchor must be the focal node, a focal ancestor, or carry at least **10%** of opacity-, projected-area-, and focal-importance-weighted visible salience. The 10% threshold is the minimum accepted weighted anchor salience; a decorative speck cannot qualify.

Validation performs a whole-film repeated-full-frame check using weighted visible-content replacement and layout fingerprints, not node count alone. It rejects repeated full-page composition/timing or high full-frame replacement even when one small node persists. Resolved validation must prove the declared bridge is realized by actual node/camera/content tracks and must reject undeclared content pops, fake identity, fake preroll, transform-ownership conflicts, or an unresolved target.
