# Semantic revision documentation contract

`SemanticPatch@1` describes one authorized semantic change. In bounded mode it is consumed by the future deterministic revision applier. In rebuild mode it is a scope directive consumed first by the three existing semantic owners and only then by validation/commit. It never carries another owner's replacement payload. This is documentation, not an implemented JSON Schema, patch engine, or source mutation tool.

`DurableLocatorSafeText` and `DurableInstructionText` are the exact recorder-projected text types defined by [`workflow-ledger.md`](workflow-ledger.md); `DurableSemanticText` is their exact semantic-prose alias in [`input-trust.md`](input-trust.md). They are referenced here without widening.

## Exact semantic target unions

Targets use stable semantic IDs and optional named fields, never user-authored array indices or raw JSON Pointers.

```ts
type SemanticLockTarget =
  | {entity: "brief"; id: string; field?: string}
  | {entity: "treatment"; id: string; field?: string}
  | {entity: "treatment-arc-step"; id: string; field?: string}
  | {entity: "beat-intention"; id: string; field?: string}
  | {entity: "camera-rationale"; id: string; field?: string}
  | {entity: "beat"; id: string; field?: string}
  | {entity: "bridge"; id: string; field?: string}
  | {entity: "node"; id: string; field?: string}
  | {entity: "node-track"; id: string; nodeId: string; channel: "geometry" | "style" | "content" | "visibility"; field?: string}
  | {entity: "node-effect"; id: string; nodeId: string; field?: string}
  | {entity: "content-transition"; id: string; nodeId: string; field?: string}
  | {entity: "camera"; id: "main-camera"; field?: string}
  | {entity: "camera-segment"; id: string; cameraId: "main-camera"; field?: string}
  | {entity: "motion-cue"; id: string; field?: string}
  | {entity: "copy"; id: string; field?: "text"}
  | {entity: "token"; id: string; field?: "value"};

type SemanticImpactTarget = SemanticLockTarget;
```

The target union is discriminated by `entity`. `SemanticImpactTarget` is the same exact union: added, removed, changed, reordered, or derivationally retimed entities and affected parents are each named by stable semantic target. A camera segment uses its segment ID plus `cameraId`; a node track uses its track ID, parent `nodeId`, and closed channel; an effect or content transition uses its own stable ID plus parent `nodeId`. A parent `node` or `camera` target never substitutes for an individually affected child dependency.

## Exact patch operation union

```ts
type PositiveBridgeMode = "shared-element" | "camera-navigation" | "morph-into-target" | "match-on-action" | "directional-push";
type BridgeMode = PositiveBridgeMode | "chapter-cut";

type BridgeEyeTrace = {
  outgoing: {nodeId: string; point: {x: number; y: number}};
  incoming: {nodeId: string; point: {x: number; y: number}};
};

type PositiveBridgeBaseChanges = {
  narrativeReason?: DurableSemanticText;
  vocabularyRole?: "ordinary" | "signature";
  eyeTrace?: BridgeEyeTrace;
};

type PositiveBridgeChangeOperation =
  | {
      op: "set-continuity-bridge";
      bridgeId: string;
      expectedMode: "shared-element";
      changes: PositiveBridgeBaseChanges & {transitionFamily?: "shared-element"; motionOwnership?: "node"};
    }
  | {
      op: "set-continuity-bridge";
      bridgeId: string;
      expectedMode: "camera-navigation";
      changes: PositiveBridgeBaseChanges & {
        transitionFamily?: "camera-navigation";
        motionOwnership?: "camera" | "camera-and-node-semantic";
        combinationMeaning?: DurableSemanticText;
      };
    }
  | {
      op: "set-continuity-bridge";
      bridgeId: string;
      expectedMode: "morph-into-target";
      changes: PositiveBridgeBaseChanges & {transitionFamily?: "morph-into-target"; motionOwnership?: "node"};
    }
  | {
      op: "set-continuity-bridge";
      bridgeId: string;
      expectedMode: "match-on-action";
      changes: PositiveBridgeBaseChanges & {transitionFamily?: "match-on-action"; motionOwnership?: "node"};
    }
  | {
      op: "set-continuity-bridge";
      bridgeId: string;
      expectedMode: "directional-push";
      changes: PositiveBridgeBaseChanges & {transitionFamily?: "directional-push"; motionOwnership?: "node"};
    };

type ChapterCutChangeOperation = {
  op: "set-continuity-bridge";
  bridgeId: string;
  expectedMode: "chapter-cut";
  changes: {
    narrativeReason?: DurableSemanticText;
    eyeTrace?: BridgeEyeTrace;
    reason?: "new-chapter" | "time-jump" | "location-jump" | "emotional-impact";
    exceptionJustification?: DurableSemanticText;
    maxEyeTraceDistanceNormalized?: number;
  };
};

type RetimeBridgeOperation =
  | {
      op: "retime-bridge";
      bridgeId: string;
      expectedMode: "camera-navigation";
      expectedBoundary: {fromBeatId: string; toBeatId: string; boundaryAt: SegmentRef};
      durationFrames: number;
      bridgeRange: SegmentRange;
      cameraRange: SegmentRange;
    }
  | {
      op: "retime-bridge";
      bridgeId: string;
      expectedMode: "shared-element" | "morph-into-target" | "match-on-action" | "directional-push";
      expectedBoundary: {fromBeatId: string; toBeatId: string; boundaryAt: SegmentRef};
      durationFrames: number;
      bridgeRange: SegmentRange;
      motionRange: SegmentRange;
    };

type SetNodeStateOperation =
  | {op: "set-node-state"; nodeId: string; track: "geometry"; keyframes: [Keyframe<GeometryState>, ...Keyframe<GeometryState>[]]}
  | {op: "set-node-state"; nodeId: string; track: "style"; keyframes: [Keyframe<StyleState>, ...Keyframe<StyleState>[]]}
  | {op: "set-node-state"; nodeId: string; track: "content"; keyframes: [Keyframe<ContentState>, ...Keyframe<ContentState>[]]}
  | {op: "set-node-state"; nodeId: string; track: "visibility"; keyframes: [Keyframe<number>, ...Keyframe<number>[]]};

type PatchOperation =
  | {op: "replace-copy"; copyId: string; value: DurableSemanticText}
  | {op: "set-token"; tokenId: string; expectedValueKind: "string"; value: string}
  | {op: "set-token"; tokenId: string; expectedValueKind: "number"; value: number}
  | {op: "retime-beat"; beatId: string; durationFrames: number; timingPolicy: "recompute-segment-and-shift-following"}
  | RetimeBridgeOperation
  | SetNodeStateOperation
  | {op: "swap-renderer"; nodeId: string; renderer: RendererBinding}
  | {op: "set-effects"; nodeId: string; effects: EffectBinding[]}
  | PositiveBridgeChangeOperation
  | ChapterCutChangeOperation
  | {op: "set-lock"; target: SemanticLockTarget}
  | {op: "remove-lock"; target: SemanticLockTarget};
```

`SegmentRange`, keyframe/state types, `RendererBinding`, `EffectBinding`, and other Motion entities are the exact closed types in `motion-spec-contract.md`. A renderer/effect patch must use one complete discriminated binding with the exact bound capability and intent/resolved schema tuple. It cannot introduce open props, literal copy/style values, locators, executable data, or an unregistered capability. Every semantic ID is re-resolved and every core/project-local schema constraint is revalidated before application.

`replace-copy.copyId` resolves exactly one `MotionSpec.registries.copy` member and changes only its `text`. It never targets a node or searches renderer props. `set-token.tokenId` resolves exactly one `MotionSpec.registries.tokens` member; `expectedValueKind` must equal that entry's current discriminated value kind, and the selected operation variant preserves both kind and closed `semanticRole`. The new value must pass that role's color/font/enum/finite-number grammar and every consuming capability's range constraint; a URL, path, base64/data payload, resource function, import/code text, or authored-copy token is refused. A missing, duplicate, or mismatched registry ID refuses the patch. The exact semantic impacts are `{entity:"copy", id:copyId, field:"text"}` and `{entity:"token", id:tokenId, field:"value"}`, plus every individually identified node/track/effect whose resolved output actually changes.

`set-continuity-bridge` is a bounded update of one existing bridge only. `changes` is non-empty and may change only the fields declared by its exact mode variant. A positive bridge's optional `transitionFamily` is the literal matching its unchanged `expectedMode`; it cannot switch families. The chapter-cut variant deliberately has no `transitionFamily`, `vocabularyRole`, `motionOwnership`, or `combinationMeaning`. No variant can change `id`, `mode`, Beat adjacency, `durationFrames`, `bridgeRange`, participant node/camera IDs, mechanism ranges, add/remove/reorder a bridge, or replace the variant payload. `expectedMode` must equal the current bridge mode. A mode/mechanism/participant change or bridge addition/removal/reorder is structural and requires a rebuild directive beginning at `motion-spec` with a complete authorized scope and declared semantic impact.

In other words, `set-continuity-bridge` preserves the same current mode/variant and the same participants and ranges.

### Deterministic bridge-retime semantics

`RetimeBridgeOperation` targets only an existing positive-duration bridge. A `chapter-cut` cannot be retimed: it remains zero duration, and converting it to a positive bridge or moving its cut boundary is a structural rebuild. `expectedMode`, `expectedBoundary.fromBeatId`, and `expectedBoundary.toBeatId` must equal the current bridge's unchanged mode and exact adjacent ordered Beat pair. `expectedBoundary.boundaryAt` must resolve to that pair's real adjacent-Beat boundary.

The operation atomically replaces `durationFrames`, `bridgeRange`, and the exact mode mechanism range: `cameraRange` for `camera-navigation`, otherwise `motionRange`. The new `bridgeRange` and mechanism range have the exact same resolved endpoints, not merely the same duration; their resolved length equals the positive integer `durationFrames`. They must straddle the actual adjacent-Beat boundary and satisfy the MotionSpec inequality while remaining strictly inside the same outgoing and incoming Beats. The operation cannot change a participant, mode, transition family, Treatment rationale, or boundary.

For `camera-navigation`, the applier resolves the existing `cameraSegmentId` and must also atomically update that segment's range to the supplied `cameraRange`. To preserve complete camera coverage deterministically, it requires exactly one immediately preceding and one immediately following `hold` segment; it changes only the preceding hold's exclusive end to `cameraRange.from` and the following hold's start to `cameraRange.to`, preserving their opposite endpoints and states. It refuses if either neighbor is absent, is not a hold, becomes non-positive, is undeclared in impact, or is locked. It then revalidates complete gap-free/non-overlapping camera coverage. For a node-owned bridge, the applier verifies that the named participant tracks/effects and any companion explicit operations realize the supplied `motionRange`; it refuses rather than silently stretching undeclared keyframes or effects. Every changed bridge, camera segment, node track/effect, cue, hold, content transition, and derived timing projection appears separately in `declaredImpactSet`, and every applicable lock is checked before any write.

### Deterministic Beat-retime semantics

`retime-beat` has exactly one policy: `recompute-segment-and-shift-following`. It changes only the named Beat's source `durationFrames`; it must not implicitly remap or rewrite any `SegmentRef`, range endpoint, keyframe, cue, bridge, camera segment, effect, content transition, settle point, or hold range. The canonical cumulative timeline is then recomputed. Consequently, the named segment's resolved timing changes and all later Beats' global frame positions shift by the duration delta.

The future interpreter/applier must compute that transitive timing dependency set before accepting the patch. `declaredImpactSet` includes every Beat, bridge, camera segment, node track/effect/content transition, motion cue, Treatment timing promise, and affected parent whose resolved timing changes—even when its source JSON bytes do not. Every semantic lock protects both its literal source value and its derived/resolved timing projection. A lock conflict in any transitive dependency refuses the patch; omitting that dependency is `IMPACT_SET_MISMATCH`, not a way around the lock.

After recomputation, all MotionSpec invariants are revalidated, including positive holds, `settleAt`, complete camera coverage, `bridgeRange`/mechanism-range duration equality, Beat adjacency, and total duration. `retime-bridge` is a separate explicit operation; it is never inferred. If a Beat retime would require range remapping, bridge/participant changes, or a different trim location, the current bounded operation cannot express it: use an explicitly authorized rebuild or block. A request such as “shorten Beat 2 but keep transition, camera, and logo timing locked” therefore blocks unless current source and dependency evidence prove that none of those locked resolved projections changes.

## Exact bounded/rebuild discriminated union

```ts
type SemanticPatchBase = {
  schemaVersion: "semantic-patch@1";
  projectId: string;
  revisionAttemptId: string;
  proposedRevisionId: string;
  baseRevisionId: string;
  expectedSourceHashes: {
    localAssetManifest: string | null;
    researchFindings: string | null;
    brief: string;
    treatment: string;
    motion: string;
  };
  stagedParentHashes: {
    localAssetManifest: string | null;
    researchFindings: string | null;
  };
  expectedLockSetHash: string;
  reason: DurableLocatorSafeText;
  cause: PatchCause;
};

type PatchCause =
  | {
      kind: "user-request";
      sourceUserInstruction: DurableInstructionText;
      triggeringReviewIssueIds?: never;
      repairCycleId?: never;
    }
  | {
      kind: "review-repair";
      sourceUserInstruction: DurableInstructionText;
      triggeringReviewIssueIds: [string, ...string[]];
      repairCycleId: string;
    };

type RebuildAllowedChange =
  | "replace-field"
  | "add-child"
  | "remove-child"
  | "reorder-children"
  | "replace-subtree";

type BriefRebuildTarget = Extract<SemanticImpactTarget, {entity: "brief"}>;
type CreativeRebuildTarget = Extract<SemanticImpactTarget, {entity: "treatment" | "treatment-arc-step" | "beat-intention" | "camera-rationale"}>;
type MotionRebuildTarget = Extract<SemanticImpactTarget, {
  entity:
    | "beat"
    | "bridge"
    | "node"
    | "node-track"
    | "node-effect"
    | "content-transition"
    | "camera"
    | "camera-segment"
    | "motion-cue"
    | "copy"
    | "token"
}>;

type BriefRebuildScope = {owner: "brief-planner"; target: BriefRebuildTarget; allowedChange: RebuildAllowedChange};
type CreativeRebuildScope = {owner: "creative-direction"; target: CreativeRebuildTarget; allowedChange: RebuildAllowedChange};
type MotionRebuildScope = {owner: "motion-planner"; target: MotionRebuildTarget; allowedChange: RebuildAllowedChange};

type RebuildScope = BriefRebuildScope | CreativeRebuildScope | MotionRebuildScope;
type TreatmentOrMotionRebuildScope = CreativeRebuildScope | MotionRebuildScope;
type MotionOnlyRebuildScope = MotionRebuildScope;

type BoundedSemanticPatch = SemanticPatchBase & {
  mode: "bounded";
  operations: [PatchOperation, ...PatchOperation[]];
  declaredImpactSet: [SemanticImpactTarget, ...SemanticImpactTarget[]];
  rebuildFrom?: never;
  authorizedScopes?: never;
};

type RebuildSemanticPatchBase = SemanticPatchBase & {
  mode: "rebuild";
  rebuildFrom: "brief" | "treatment" | "motion-spec";
  declaredImpactSet: [SemanticImpactTarget, ...SemanticImpactTarget[]];
  operations?: never;
  replacementBrief?: never;
  replacementTreatment?: never;
  replacementMotionSpec?: never;
};

type RebuildSemanticPatch = RebuildSemanticPatchBase & (
  | {rebuildFrom: "brief"; authorizedScopes: [RebuildScope, ...RebuildScope[]]}
  | {rebuildFrom: "treatment"; authorizedScopes: [TreatmentOrMotionRebuildScope, ...TreatmentOrMotionRebuildScope[]]}
  | {rebuildFrom: "motion-spec"; authorizedScopes: [MotionOnlyRebuildScope, ...MotionOnlyRebuildScope[]]}
);

type SemanticPatch = BoundedSemanticPatch | RebuildSemanticPatch;
```

Every patch has a non-empty `declaredImpactSet`. A bounded patch also has non-empty operations, unique by canonical operation/semantic-target key—for example `(retime-beat, beatId)` or `(set-lock, canonicalTargetKey)`. Impact targets and rebuild scopes are unique by their complete discriminator-specific key. Duplicate or contradictory operations, targets, owners, or scopes are invalid. `cause.sourceUserInstruction` is the exact non-empty `DurableInstructionText` that scoped the request, not a paraphrase or reviewer/source prose. It preserves all non-locator instruction bytes while replacing any supplied host-native locator with its stable token under `workflow-ledger.md`; the raw locator is never patch provenance.

Every rebuild scope's owner-target pair is closed by the types above. Brief Planner may target only the Brief; Creative Direction may target only Treatment-owned entities; Motion Planner may target only MotionSpec-owned entities. A `rebuildFrom: "treatment"` directive cannot include a Brief scope, and a `rebuildFrom: "motion-spec"` directive cannot include a Brief or Treatment scope. A cross-owner target, or an upstream owner scope that precedes `rebuildFrom`, is invalid even if the same entity also appears in `declaredImpactSet`; the interpreter must move `rebuildFrom` to the earliest affected owner instead of granting downstream authority over upstream source.

`mode` and `cause.kind` are orthogonal discriminators and form four legal combinations. A direct `user-request` carries no review IDs or repair cycle. A `review-repair`, whether bounded `fix` or structural `rebuild`, carries non-empty issue IDs from the exact current review artifacts and the stable `repairCycleId` authorized by the orchestrator. Review prose alone never becomes user instruction or repair authority.

`revisionAttemptId` and `proposedRevisionId` are deterministic Ledger allocations. The exact current hashes remain in `expectedSourceHashes`. `stagedParentHashes` names externally accepted source-update parents; when no source update occurred, both values equal their corresponding current values. Revision Interpreter may bind those identities but does not author their content.

## Mode and actual-impact invariants

Bounded mode contains only `PatchOperation` and must not combine smaller operations whose actual semantic diff amounts to whole-artifact replacement. Fine-grained operations are mandatory for ordinary bounded edits.

Bounded mode must not add, remove, or reorder any bridge; those changes are structural rebuilds.

Rebuild mode may arise directly from an explicit structural `user-request`, or from a `review-repair` linked to current structural issues. In both cases `cause.sourceUserInstruction` is the exact durable locator-tokenized instruction authorizing the request scope. A review-repair additionally requires non-empty issue IDs that resolve in the exact current bound review artifacts and a matching stable repair-cycle ID. Fabricated, stale, empty, unrelated review IDs or a mismatched repair cycle refuse the directive.

Revision Interpreter selects only the earliest owner boundary and authorized semantic scopes. It must not write Brief, Treatment, MotionSpec, or any replacement payload. The owner sequence is mechanically derived and cannot be reordered or shortened:

```text
rebuildFrom "brief"       → Brief Planner → acceptance → Creative Direction → acceptance → Motion Planner → acceptance
rebuildFrom "treatment"   → Creative Direction → acceptance → Motion Planner → acceptance
rebuildFrom "motion-spec" → Motion Planner → acceptance
```

Every later owner receives the exact accepted upstream identity. Candidate paths are immutable and unique to the attempt:

```text
projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/brief.spec.json
projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/treatment.json
projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/motion.spec.json
```

The current revision files and checkpoint stay unchanged while those candidates are authored and accepted. After the complete ordered owner chain, source-set validation computes actual diff, verifies parent bindings/scopes/locks, and routes the exact accepted set to the deterministic revision commit. Only a successful commit creates the new manifest/locks, switches `currentRevisionId`, and invalidates downstream lineage. Replacement payloads are forbidden in the rebuild patch.

The future bounded applier, or rebuild validator/commit pair, computes actual semantic impact for all changes—including added, removed, changed, or reordered Brief fields, Treatment intentions/rationales, Beats, bridges, nodes, camera segments, motion cues, and affected parents—and refuses any actual impact absent from the unique `declaredImpactSet` and, for rebuild, `authorizedScopes`. Owner authorship never bypasses scope, diff, or lock checks.

## Lock authorization and no-evasion invariant

Before applying any operation, the future applier recomputes the current semantic-lock set and compares `expectedLockSetHash`. Any lock-set byte/hash change refuses the entire patch. Lock evaluation is transitive through the canonical dependency graph: changing a source value that changes a locked entity's resolved timing, geometry, content, visibility, or other declared semantic projection is a `LOCK_CONFLICT` even when the locked source field itself is byte-identical.

`set-lock` and `remove-lock` require explicit lock-mutation authorization in the exact `cause.sourceUserInstruction`. For `remove-lock`, that durable instruction must name the exact lock target and explicitly request its removal or narrowing. Reviewer text, inspected artifacts, inferred convenience, or a general request to “make it work” cannot authorize a lock mutation.

A patch containing `remove-lock` must not combine that removal with any source mutation or declared impact whose legality depends on the removed lock. Removing a lock and evading it in one patch is invalid even when both operations are listed. All unrelated locks remain effective. Apply an explicitly authorized removal as its own revision; a later separately instructed patch may bind the newly current lock set.

Every patch binds `baseRevisionId`, all three `expectedSourceHashes`, and `expectedLockSetHash`. A stale hash, raw-index target, lock conflict, undeclared operation, missing impact, or disguised rebuild is a refusal, not permission for best-effort repair.
