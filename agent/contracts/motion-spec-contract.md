# MotionSpec documentation contract

This file is the normative, role-readable shape of `MotionSpec@1`, aligned to the approved design and implementation plan. It documents data only: no runtime type, JSON Schema, validator, resolver, renderer, or engine source is implemented in Part 1. Every union below is closed; an undeclared discriminator value is invalid.

`SafeAssetId` is the exact recorder-derived identifier type defined by [`artifact-acceptance.md`](artifact-acceptance.md); `DurableSemanticText` is the exact locator-safe semantic-prose alias in [`input-trust.md`](input-trust.md). This contract references both rather than widening either back to a free-form string.

## Segment, Range, track, and state primitives

```ts
type SegmentRef = {segmentId: string; progress: number}; // progress is 0..1
type SegmentRange = {from: SegmentRef; to: SegmentRef};
type NormalizedPoint = {x: number; y: number};            // each component is 0..1

type EasingId =
  | "linear"
  | "ease-in-quad"
  | "ease-out-quad"
  | "ease-in-out-cubic"
  | "ease-out-cubic"
  | "ease-out-quart"
  | "ease-in-out-quart"
  | "ease-out-expo"
  | "ease-in-out-expo";

type Keyframe<T> = {
  at: SegmentRef;
  value: T;
  interpolation: "hold" | "linear" | "cubic";
  easing?: EasingId;
};
type Track<T> = {id: string; keyframes: [Keyframe<T>, ...Keyframe<T>[]]};

type GeometryState = {x: number; y: number; width: number; height: number; rotationDegrees: number; scaleX: number; scaleY: number};
type StyleState = {opacity: number; fillTokenId?: string; strokeTokenId?: string; strokeWidthTokenId?: string};
type ContentState = {stateId: string; contentId: string; copyId?: string};
type CameraState = {x: number; y: number; zoom: number; rotationDegrees: number};

type CopyRegistryEntry = {
  id: string;
  text: DurableSemanticText;
};

type DesignTokenValue =
  | {kind: "string"; value: string}
  | {kind: "number"; value: number};

type DesignTokenEntry =
  | {id: string; semanticRole: "color"; value: Extract<DesignTokenValue, {kind: "string"}>}
  | {id: string; semanticRole: "font-family"; value: Extract<DesignTokenValue, {kind: "string"}>}
  | {id: string; semanticRole: "enum"; value: Extract<DesignTokenValue, {kind: "string"}>}
  | {id: string; semanticRole: "font-size" | "font-weight" | "line-height" | "spacing" | "stroke-width" | "corner-radius" | "opacity" | "scalar"; value: Extract<DesignTokenValue, {kind: "number"}>};

type PathVector = {x: number; y: number};

type PathCommand =
  | {op: "move-to"; to: PathVector}
  | {op: "line-to"; to: PathVector}
  | {op: "quadratic-to"; control: PathVector; to: PathVector}
  | {op: "cubic-to"; control1: PathVector; control2: PathVector; to: PathVector}
  | {op: "close-path"};

type PathState = {
  id: SafeIdSegment;
  commands: [PathCommand, ...PathCommand[]];
};

type PathStateRegistryLimits = {
  maxCommandCount: 2048;
  maxCanonicalPayloadBytes: 65536;
};
```

Token roles are closed. A `color` value is one supported literal color syntax; `font-family` names an already available local/system family and is never a loader; `enum` is a safe identifier from the consuming schema. A string token cannot contain a URL, repository/host path, traversal, base64/data payload, CSS resource function, executable/import text, or authored copy. Numeric values are finite, and the consuming renderer/effect schema constrains their range. A capability cannot reinterpret a token under another semantic role.

`EasingId` is the complete core easing vocabulary. Keyframes and camera moves may use only one literal member; arbitrary CSS timing strings, cubic-bezier text, spring programs, and project-supplied executable easing expressions are invalid. Extending this list requires a future versioned contract change, not an unregistered string.

The path registry is numeric vector data, never an SVG string. Every `PathVector` component is finite and has absolute value at most 1,000,000. A `PathState` is an exact object; its ID is a safe stable ID, unique and ascending in the registry, and its RFC 8785 bytes are at most the fixed `PathStateRegistryLimits.maxCanonicalPayloadBytes: 65536`. It has 1–`maxCommandCount: 2048` commands. The first command and the first command after a `close-path` are `move-to`; `close-path` can only close a contour that has drawn at least one segment. Empty contours, non-finite/oversized vectors, unexpected keys, string coordinates, SVG/path markup, URLs, filesystem paths, and encoded blobs are forbidden. Command order is authored geometry order and is not re-sorted.

Each Beat is the segment registry: `Beat.segmentId` is unique and establishes one ordered timeline segment. Its global half-open interval uses cumulative duration: `[sum(previous Beat.durationFrames), sum(previous and current Beat.durationFrames))`. `resolveBoundary(ref)` resolves as `segmentStartFrame + floor(ref.progress * durationFrames)`; equivalently, every `SegmentRef` uses that formula. `progress: 1` resolves only as an exclusive range end or exact next-Beat boundary, never as a sampled frame inside that segment. The MotionSpec Range type is exactly `SegmentRange`; it resolves to a half-open `[fromFrame, toFrameExclusive)` interval and must not run backward. Source data never substitutes raw global frames for these references.

## Beat

```ts
type Beat = {
  id: string;
  treatmentBeatIntentionId: string;
  segmentId: string;
  durationFrames: number;          // positive integer
  objective: DurableSemanticText;
  message: DurableSemanticText;
  focalNodeId: string;
  liveContentNodeIds: string[];    // non-empty, unique, resolvable
  settleAt: SegmentRef;
  holdRange: SegmentRange;
};
```

A Beat is a narrative information state, not a slide. `settleAt` and the positive readable `holdRange` must resolve inside that Beat.

`MotionSpec.timeline.beats` is an ordered bijection with `TreatmentSpec.beatIntentions`. It has the same length and same order, with no missing intention, no extra Beat, and no duplicate `treatmentBeatIntentionId`. Each Beat's `treatmentBeatIntentionId` equals the exact stable ID of its same-position Treatment intention. For that matched member, `Beat.objective === matched BeatIntention.objective` and `Beat.message === matched BeatIntention.message`; Motion planning may realize focal, timing, node, and track detail but cannot rewrite Treatment intent.

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
  treatmentCameraRationaleId: string;
  durationFrames: number;
  bridgeRange: SegmentRange;
  narrativeReason: DurableSemanticText;
  eyeTrace: {
    outgoing: {nodeId: string; point: NormalizedPoint};
    incoming: {nodeId: string; point: NormalizedPoint};
  };
};

type PositiveDurationBridgeBase = BridgeIdentityBase & {
  transitionFamily: TransitionFamily;
  vocabularyRole: "ordinary" | "signature";
  motionOwnership: "camera" | "node" | "camera-and-node-semantic";
  combinationMeaning?: DurableSemanticText;
};
```

Within every member, `fromBeatId` and `toBeatId` form the exact adjacent ordered Beat pair; neither field may point to a merely nearby or non-adjacent Beat.

`combinationMeaning` is required when semantically combined camera and node motion is used. The closed union has exactly six variants:

```ts
type SharedElementBridge = PositiveDurationBridgeBase & {
  mode: "shared-element";
  transitionFamily: "shared-element";
  motionOwnership: "node";
  nodeId: string;
  motionRange: SegmentRange;
};

type CameraNavigationBridge = PositiveDurationBridgeBase & {
  mode: "camera-navigation";
  transitionFamily: "camera-navigation";
  motionOwnership: "camera" | "camera-and-node-semantic";
  cameraSegmentId: string;
  destinationNodeId: string;
  spatialRelationship: DurableSemanticText;
  cameraRange: SegmentRange;
};

type MorphIntoTargetBridge = PositiveDurationBridgeBase & {
  mode: "morph-into-target";
  transitionFamily: "morph-into-target";
  motionOwnership: "node";
  sourceNodeId: string;
  targetNodeId: string;
  motionRange: SegmentRange;
  preRollFrames: number;
  settleFrames: number;
};

type MatchOnActionBridge = PositiveDurationBridgeBase & {
  mode: "match-on-action";
  transitionFamily: "match-on-action";
  motionOwnership: "node";
  outgoingNodeId: string;
  incomingNodeId: string;
  actionAt: SegmentRef;
  motionRange: SegmentRange;
  action: "translate" | "scale" | "rotate" | "draw" | "expand" | "collapse";
};

type DirectionalPushBridge = PositiveDurationBridgeBase & {
  mode: "directional-push";
  transitionFamily: "directional-push";
  motionOwnership: "node";
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
  exceptionJustification: DurableSemanticText;
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

`MotionSpec.timeline.bridges` is also an ordered bijection with `TreatmentSpec.cameraTravelRationale`: same length and order, no missing rationale, no extra bridge, and no duplicate `treatmentCameraRationaleId`. A bridge's `treatmentCameraRationaleId` resolves to the same-position stable Treatment rationale. That rationale's `fromBeatId` and `toBeatId` must equal the exact adjacent pair's outgoing and incoming `treatmentBeatIntentionId` values. A rationale for a merely nearby pair is invalid even if its prose appears compatible.

A `camera-navigation` bridge consumes only its matching rationale with `travelIntent === "travel"`. Its `spatialRelationship === matched rationale.revealedSpatialRelation`, and the move named by `cameraSegmentId` must satisfy `reveals.spatialRelationship === matched rationale.revealedSpatialRelation`. Every other non-camera bridge—including a chapter cut—consumes only its matching rationale with `travelIntent === "hold"` and cannot introduce camera travel across that boundary. Thus a bridge mode cannot reinterpret or silently upgrade the Treatment's camera decision.

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
  continuityRole: "in-node-state-change";
  preservesNodeIdentity: true;
  fullFrameReset: false;
};

type CoreTextRendererBinding = {
  id: "core.renderer.text";
  version: "1.0.0";
  intentSchemaId: "core.schema.renderer.text.intent@1";
  resolvedSchemaId: "core.schema.renderer.text.resolved@1";
  props: {
    copyId: string;
    fontAssetId: string | null;
    fontFamilyTokenId: string;
    fontSizeTokenId: string;
    fontWeightTokenId: string;
    lineHeightTokenId: string;
    colorTokenId: string;
    align: "left" | "center" | "right";
    maxLines: number;
  };
};

type CoreShapeRendererBinding = {
  id: "core.renderer.shape";
  version: "1.0.0";
  intentSchemaId: "core.schema.renderer.shape.intent@1";
  resolvedSchemaId: "core.schema.renderer.shape.resolved@1";
  props: {
    primitive: "rectangle" | "ellipse" | "polygon";
    polygonSides: number | null;
    fillTokenId: string | null;
    strokeTokenId: string | null;
    strokeWidthTokenId: string | null;
    cornerRadiusTokenId: string | null;
  };
};

type CorePathRendererBinding = {
  id: "core.renderer.path";
  version: "1.0.0";
  intentSchemaId: "core.schema.renderer.path.intent@1";
  resolvedSchemaId: "core.schema.renderer.path.resolved@1";
  props: {
    pathStateId: SafeIdSegment;
    fillTokenId: string | null;
    strokeTokenId: string | null;
    strokeWidthTokenId: string | null;
    fillRule: "nonzero" | "evenodd";
  };
};

type CoreLocalImageRendererBinding = {
  id: "core.renderer.local-image";
  version: "1.0.0";
  intentSchemaId: "core.schema.renderer.local-image.intent@1";
  resolvedSchemaId: "core.schema.renderer.local-image.resolved@1";
  props: {
    assetId: SafeAssetId;
    fit: "contain" | "cover" | "fill";
    positionX: number;
    positionY: number;
    preserveAspectRatio: boolean;
  };
};

type CoreGroupRendererBinding = {
  id: "core.renderer.group";
  version: "1.0.0";
  intentSchemaId: "core.schema.renderer.group.intent@1";
  resolvedSchemaId: "core.schema.renderer.group.resolved@1";
  props: {
    layout: "free" | "stack-horizontal" | "stack-vertical";
    gapTokenId: string | null;
    align: "start" | "center" | "end" | "stretch";
    clipChildren: boolean;
    isolateOpacity: boolean;
  };
};

type SchemaBoundCapabilityProp =
  | {fieldId: string; kind: "node-id"; valueId: string}
  | {fieldId: string; kind: "copy-id"; valueId: string}
  | {fieldId: string; kind: "token-id"; valueId: string}
  | {fieldId: string; kind: "asset-id"; valueId: string}
  | {fieldId: string; kind: "track-id"; valueId: string}
  | {fieldId: string; kind: "path-state-id"; valueId: SafeIdSegment}
  | {fieldId: string; kind: "number"; value: number}
  | {fieldId: string; kind: "boolean"; value: boolean}
  | {fieldId: string; kind: "enum-id"; valueId: string};

type ProjectLocalRendererBinding = {
  id: ProjectCapabilityId;
  version: CapabilityVersion;
  intentSchemaId: CapabilityIntentSchemaId;
  resolvedSchemaId: CapabilityResolvedSchemaId;
  props: {fields: SchemaBoundCapabilityProp[]};
};

type RendererBinding =
  | CoreTextRendererBinding
  | CoreShapeRendererBinding
  | CorePathRendererBinding
  | CoreLocalImageRendererBinding
  | CoreGroupRendererBinding
  | ProjectLocalRendererBinding;

type CoreOpacityTransformEffectBinding = {
  id: "core.effect.opacity-transform";
  version: "1.0.0";
  intentSchemaId: "core.schema.effect.opacity-transform.intent@1";
  resolvedSchemaId: "core.schema.effect.opacity-transform.resolved@1";
  range: SegmentRange;
  props: {
    geometryTrackId: string | null;
    styleTrackId: string | null;
    visibleTrackId: string | null;
  };
};

type CoreClipMaskEffectBinding = {
  id: "core.effect.clip-mask";
  version: "1.0.0";
  intentSchemaId: "core.schema.effect.clip-mask.intent@1";
  resolvedSchemaId: "core.schema.effect.clip-mask.resolved@1";
  range: SegmentRange;
  props: {
    maskNodeId: string;
    mode: "alpha" | "luminance" | "geometric";
    invert: boolean;
    featherTokenId: string | null;
  };
};

type CoreContentTransitionEffectBinding = {
  id: "core.effect.content-transition";
  version: "1.0.0";
  intentSchemaId: "core.schema.effect.content-transition.intent@1";
  resolvedSchemaId: "core.schema.effect.content-transition.resolved@1";
  range: SegmentRange;
  props: {contentTransitionId: string};
};

type CorePathTrimEffectBinding = {
  id: "core.effect.path-trim";
  version: "1.0.0";
  intentSchemaId: "core.schema.effect.path-trim.intent@1";
  resolvedSchemaId: "core.schema.effect.path-trim.resolved@1";
  range: SegmentRange;
  props: {
    pathNodeId: string;
    fromProgress: number;
    toProgress: number;
    direction: "forward" | "reverse";
  };
};

type ProjectLocalEffectBinding = {
  id: ProjectCapabilityId;
  version: CapabilityVersion;
  intentSchemaId: CapabilityIntentSchemaId;
  resolvedSchemaId: CapabilityResolvedSchemaId;
  range: SegmentRange;
  props: {fields: SchemaBoundCapabilityProp[]};
};

type EffectBinding =
  | CoreOpacityTransformEffectBinding
  | CoreClipMaskEffectBinding
  | CoreContentTransitionEffectBinding
  | CorePathTrimEffectBinding
  | ProjectLocalEffectBinding;

type PersistentNode = {
  id: string;
  kind: "text" | "shape" | "path" | "image" | "ui" | "chart" | "logo" | "group";
  parentId?: string;
  copyId?: string;
  assetIds: SafeAssetId[];
  assetUses: Array<{
    assetId: SafeAssetId;
    use: "render-image" | "render-font" | "render-data";
  }>;
  tokenIds: string[];
  space: "world" | "screen";
  semanticRole: "content" | "decorative" | "background" | "overlay";
  renderer: RendererBinding;
  effects: EffectBinding[];
  geometryTrack: Track<GeometryState>;
  styleTrack: Track<StyleState>;
  contentTrack?: Track<ContentState>;
  contentTransitions?: ContentTransition[];
  visibleTrack: Track<number>;
};
```

Every `ContentTransition.range` resolves to a positive-duration half-open range: its end is strictly after its start, both endpoints resolve inside the owning node's declared timeline, and `fromStateId !== toStateId`. The two state IDs resolve in that same stable node's `contentTrack`; `preservesNodeIdentity: true` and `fullFrameReset: false` are literal invariants, not author assertions. A ContentTransition changes only that node's content state. It cannot remount or replace the node/root, switch its renderer, replace siblings or descendants as a scene stack, move the camera, blank the frame, or exempt changed pixels/salience from whole-film replacement measurement.

When a ContentTransition overlaps an adjacent-Beat boundary, that boundary still requires its own declared positive-duration `ContinuityBridge`, and the transition range must participate in that bridge's continuous before/midpoint/after evidence. A ContentTransition cannot disguise a zero-frame full-frame reset, cannot consume or bypass the chapter-cut budget, and cannot justify a hard cut. Any full-frame replacement, frame blanking, simultaneous world reset, or chapter-cut-equivalent change realized through one or more ContentTransitions is invalid and refused.

All renderer/effect bindings are discriminated by exact `(id, version, intentSchemaId, resolvedSchemaId)`. `ProjectCapabilityId`, `CapabilityVersion`, and capability schema-ID aliases refer to the canonical safe ASCII grammar and opaque validated values in `catalog-registry-contract.md`; no binding accepts a raw open string. Core members use only the literal schema IDs declared by `catalog/core-registry.json`; project-local members use only the exact schema IDs in the accepted implementation receipt and bound descendant snapshot. The snapshot's intent schema validates authored props and its resolved schema validates the deterministic resolved state. A schema mismatch, extra field, missing field, undeclared enum member, or absent capability is invalid. Core token references also enforce semantic role: font-family/color/font-size/font-weight/line-height, color/stroke-width/corner-radius, spacing, feather, and style-track fields may resolve only to their matching declared token roles; null never means an inline fallback.

Renderer/effect props contain only stable semantic IDs, finite numbers, booleans, and closed enums. Stable IDs use the repository's safe identifier grammar and resolve in the bound MotionSpec or capability schema; they are not string escape hatches. A renderer/effect props URL, filesystem path, traversal, base64/data payload, executable/import reference, media bytes, literal authored copy, literal path markup, or unregistered token value is forbidden and invalid. Literal copy inside props is forbidden; text always uses `copyId`. Editable visual values use `*TokenId`; local images and fonts use rights-accepted `assetId`; path geometry uses schema-resolved `pathStateId`, never inline SVG/path data. Every referenced copy/token/asset/node/track/transition ID must resolve exactly once and must also appear in the owning node's matching `copyId`, `tokenIds`, `assetIds`/`assetUses`, track, or transition declaration as applicable.

For `core.effect.opacity-transform`, at least one of the three track IDs is non-null and every non-null ID equals the owning node's matching track ID. Every declared ContentTransition is referenced by exactly one `core.effect.content-transition` binding on that same node; `props.contentTransitionId` resolves that transition and the effect range equals the transition range. `core.effect.path-trim` may target only a declared path node, and both progress values are finite in `[0, 1]`. Project-local `SchemaBoundCapabilityProp.fieldId` and every `valueId` are safe stable IDs; `enum-id` values must be members of the exact accepted intent schema, not arbitrary strings.

For each project-local binding, the receipt- and snapshot-bound accepted `CapabilityIntentSchema@1` must carry the same capability ID, version, schema ID, and renderer/effect kind. Prop fields are unique and ascending. Each prop `kind` and its schema field `semanticRole` must exactly match the corresponding closed `CapabilityIntentFieldDefinition`; required/optional membership, token role, asset kind/use, track kind, numeric purpose/range, enum membership, count, and 8192-byte canonical payload budget are revalidated. An `asset-id` must also resolve through the owning node's `assetUses`; a `copy-id`, token, node, track, or `path-state-id` must resolve in the matching MotionSpec registry. The resolved schema cannot reinterpret a field or introduce an undeclared channel.

`PersistentNode.assetUses` is a closed visual-source union. Audio-kind local assets are research evidence only and cannot appear in `assetIds`/`assetUses`, become a node or renderer substrate, or enter MotionSpec through an opaque prop. Optional post-lock music is handled later by the separate manual-audio ingress and mux workflow; it is never MotionSpec source.

The base renderer owns static markup; effects own declared animation channels only within their ranges. Overlapping effects cannot own the same channel. Camera motion remains in `CameraTrack` and boundary motion remains in `ContinuityBridge`.

Copy-registry IDs are unique, and design-token-registry IDs are unique. Registry order is canonical but is not presentation order. Every `PersistentNode.copyId` and `ContentState.copyId` resolves to exactly one `CopyRegistryEntry`; every member of `PersistentNode.tokenIds` is unique within that node and resolves to exactly one `DesignTokenEntry`. Every member of `PersistentNode.assetIds` is unique and has exactly one matching `assetUses` entry. That entry resolves to one eligible LocalAssetManifest item whose `requestedUses` and `allowedUses` both contain the exact declared render use and whose kind/use pair is compatible under `artifact-acceptance.md`. Research/reference eligibility alone is not renderable use. When `MotionSpec.assetManifestHash` is `null`, all node `assetIds` and `assetUses` arrays are empty. Missing, duplicate, excluded, rights-incompatible, reference-only, or cross-manifest targets are invalid.

User-visible authored copy rendered in picture lives only in the copy registry. A renderer, effect, track, or capability prop references the stable `copyId`; it must not duplicate editable literal copy inside opaque props. Likewise, an editable visual constant is represented by a stable design-token ID and referenced through `tokenIds`, rather than hidden as the semantic source inside renderer/effect props. `contentId` remains an identity for a capability-local content state; it is not an alternate literal-copy store. Registry IDs remain stable across bounded revisions, including when their `text` or discriminated token `value` changes.

Stable identity and target preroll are different proofs. A `shared-element` uses one `nodeId`, one mounted node root, and its actual geometry track across both Beats. A `morph-into-target` uses two honest identities: the real `targetNodeId` must already be mounted and frozen for positive `preRollFrames`, then settle for declared `settleFrames`; a hand-built lookalike is invalid. Persistent nodes are mounted for the film even when their visibility is zero; their roots and continuity-owned subnodes must not remount at a boundary.

## CameraTrack and MotionCue

```ts
type CameraTrack = {
  id: "main-camera";
  capability: {
    id: "core.camera.global-2d";
    version: "1.0.0";
    intentSchemaId: "core.schema.camera.global-2d.intent@1";
    resolvedSchemaId: "core.schema.camera.global-2d.resolved@1";
  };
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
        combinationRationale?: DurableSemanticText;
        easing: EasingId;
        sourceFocalNodeId: string;
        destinationFocalNodeId: string;
        eyeTrace: {
          outgoing: {nodeId: string; point: NormalizedPoint};
          incoming: {nodeId: string; point: NormalizedPoint};
        };
        reveals: {nodeId: string; spatialRelationship: DurableSemanticText};
      }
  >;
};

type MotionCue = {
  id: string;
  at: SegmentRef;
  event: "hero-reveal" | "camera-travel" | "morph-handoff" | "payoff" | "resolve";
  label: DurableSemanticText;
  beatId: string;
  bridgeId?: string;
  nodeIds: string[];
};
```

There is exactly one `main-camera`. Its literal capability and intent/resolved schema IDs exactly equal the camera entry in the bound registry snapshot; camera states and segments are the only accepted core-camera intent/resolved payload and cannot carry opaque props. Camera segment `range` values partition and cover the complete half-open film timeline without gaps and without overlaps. One `primaryVerb` is the default. `combinedVerbs` must be unique and has a maximum of one distinct secondary verb (therefore two verbs total); when present it requires a non-empty `combinationRationale`. The secondary must differ from `primaryVerb` and use only the closed `pan | zoom | track` 2D vocabulary. Without a secondary verb, both `combinedVerbs` and `combinationRationale` are omitted. Every move binds real source/destination focal nodes, an explicit continuous normalized `eyeTrace`, and a non-empty `reveals` node/spatial relationship. Each verb needs a semantic—not decorative—reason. Decorative always-moving camera drift and undefined 3D orbit semantics are invalid. Motion cues identify continuous film events, not pages, and do not grant audio-generation authority.

## Top-level MotionSpec

```ts
type MotionSpec = {
  schemaVersion: "motion-spec@1";
  projectId: string;
  briefHash: string;
  treatmentHash: string;
  researchFindingsHash: string | null;
  assetManifestHash: string | null;
  capabilityRegistryBinding: {
    registrySnapshotHash: Sha256Hex;
    implementationBindingHashes: Sha256Hex[];
    acceptedImplementationReceiptHashes: Sha256Hex[];
  };
  registries: {
    copy: CopyRegistryEntry[];
    tokens: DesignTokenEntry[];
    paths: PathState[];
  };
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

The accepted Brief is a direct identity and timing parent, not merely an ancestor hidden behind the Treatment. `MotionSpec.projectId` and `BriefSpec.projectId` must be exactly equal; `briefHash` must be the canonical hash of that exact accepted Brief, and `treatmentHash` must bind a Treatment carrying the same `briefHash`. `researchFindingsHash` and `assetManifestHash` must exactly equal the accepted Brief and Treatment declarations; a MotionSpec cannot swap evidence or assets. `MotionSpec.canvas.width`, `MotionSpec.canvas.height`, and `MotionSpec.canvas.fps` must equal the corresponding `BriefSpec` values. The ordered Beat registry covers the complete film with no hidden tail or gap, and `sum(Beat.durationFrames) === BriefSpec.durationInFrames`.

`capabilityRegistryBinding.registrySnapshotHash` names the exact future local capability registry used to validate every renderer/effect/capability ID and version. At cold start it equals `TreatmentSpec.catalogRegistrySnapshotHash`. After an accepted project-local capability implementation, it may name only a descendant snapshot that binds the prior snapshot, preserves the Treatment's selected motion-profile/style-pack IDs, and adds exact non-circular implementation bindings. `implementationBindingHashes` is the unique ascending list copied exactly from that snapshot. `acceptedImplementationReceiptHashes` is a separate unique ascending list of the final externally accepted `CapabilityImplementationReceipt@1` identities that attest those bindings and snapshot; it is empty for built-ins only. The two lists are a bijection through each receipt's `implementationBindingHash`, but their hash values are not aliases. The ArtifactCandidate parent tuple carries the registry snapshot and `capabilityReceiptSetHash`, which is computed only from the final accepted receipt list. A MotionSpec cannot use an advisory, authorization, unaccepted receipt, unrelated snapshot/binding, or capability absent from the bound registry.

`registries.paths` is the only path-geometry registry. Its entries obey the closed numeric `PathState`/`PathCommand` grammar and fixed limits above; IDs are unique and ascending. Every `CorePathRendererBinding.props.pathStateId` and every project-local `path-state-id` prop resolves exactly once in `registries.paths`, and unused entries are invalid. The resolved renderer receives numeric commands, never an SVG string, DOM markup, CSS path, file locator, or parser input. Path states are immutable authored registry values for one accepted MotionSpec; animation selects or transforms registered numeric state through declared tracks/effects rather than replacing the registry with opaque bytes.

## Salience and anti-slide invariants

At each boundary, the continuity anchor must be the focal node, a focal ancestor, or carry at least **10%** of opacity-, projected-area-, and focal-importance-weighted visible salience. The 10% threshold is the minimum accepted weighted anchor salience; a decorative speck cannot qualify.

Validation performs a whole-film repeated-full-frame check using weighted visible-content replacement and layout fingerprints, not node count alone. It rejects repeated full-page composition/timing or high full-frame replacement even when one small node persists. Resolved validation must prove the declared bridge is realized by actual node/camera/content tracks and must reject undeclared content pops, fake identity, fake preroll, transform-ownership conflicts, or an unresolved target.
