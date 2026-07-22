# Semantic revision documentation contract

`SemanticPatch@1` describes one authorized semantic change and is consumed only by the future deterministic revision applier. This is the exact closed contract from the approved implementation plan plus prompt-layer safety invariants. It is not an implemented JSON Schema, patch engine, or source mutation tool.

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
  | {entity: "token"; id: string; field?: string};

type SemanticImpactTarget = SemanticLockTarget;
```

The target union is discriminated by `entity`. `SemanticImpactTarget` is the same exact union: added, removed, changed, reordered, or derivationally retimed entities and affected parents are each named by stable semantic target. A camera segment uses its segment ID plus `cameraId`; a node track uses its track ID, parent `nodeId`, and closed channel; an effect or content transition uses its own stable ID plus parent `nodeId`. A parent `node` or `camera` target never substitutes for an individually affected child dependency.

## Exact patch operation union

```ts
type BridgeMode = "shared-element" | "camera-navigation" | "morph-into-target" | "match-on-action" | "directional-push" | "chapter-cut";

type BoundedBridgeChanges = {
  narrativeReason?: string;
  transitionFamily?: string;
  vocabularyRole?: "ordinary" | "signature";
  motionOwnership?: "camera" | "node" | "camera-and-node-semantic";
  combinationMeaning?: string;
  eyeTrace?: {
    outgoing: {nodeId: string; point: {x: number; y: number}};
    incoming: {nodeId: string; point: {x: number; y: number}};
  };
};

type PatchOperation =
  | {op: "replace-copy"; nodeId: string; value: string}
  | {op: "set-token"; token: string; value: string | number}
  | {op: "retime-beat"; beatId: string; durationFrames: number; timingPolicy: "recompute-segment-and-shift-following"}
  | {op: "retime-bridge"; bridgeId: string; durationFrames: number}
  | {op: "set-node-state"; nodeId: string; track: "geometry" | "style" | "content" | "visibility"; keyframes: unknown[]}
  | {op: "swap-renderer"; nodeId: string; rendererId: string; version: string; props: unknown}
  | {op: "set-effects"; nodeId: string; effects: Array<{id: string; version: string; range: SegmentRange; props: unknown}>}
  | {op: "set-continuity-bridge"; bridgeId: string; expectedMode: BridgeMode; changes: BoundedBridgeChanges}
  | {op: "replace-brief"; value: BriefSpec}
  | {op: "replace-treatment"; value: TreatmentSpec}
  | {op: "replace-motion-spec"; value: MotionSpec}
  | {op: "set-lock"; target: SemanticLockTarget}
  | {op: "remove-lock"; target: SemanticLockTarget};
```

`SegmentRange` and `MotionSpec` refer to `motion-spec-contract.md`; `TreatmentSpec` refers to `agent/contracts/treatment-contract.md`. `BriefSpec` refers to the canonical Brief documentation shape until Part 2 supplies its executable schema. `unknown` marks a payload that the future executable schema must close and validate; it does not permit arbitrary code, paths, fields, or Part 1 execution.

`set-continuity-bridge` is a bounded update of one existing bridge only. `changes` is non-empty and may change only the listed base fields. It cannot change `id`, `mode`, Beat adjacency, `durationFrames`, `bridgeRange`, participant node/camera IDs, mechanism ranges, add/remove/reorder a bridge, or replace the variant payload. `expectedMode` must equal the current bridge mode. A mode/mechanism/participant change or bridge addition/removal/reorder is structural and requires `mode: "rebuild"` with `replace-motion-spec` plus a complete declared semantic diff. Retiming an existing bridge uses `retime-bridge` and must declare all dependent timing impact.

In other words, `set-continuity-bridge` preserves the same current mode/variant and the same participants and ranges.

### Deterministic Beat-retime semantics

`retime-beat` has exactly one policy: `recompute-segment-and-shift-following`. It changes only the named Beat's source `durationFrames`; it must not implicitly remap or rewrite any `SegmentRef`, range endpoint, keyframe, cue, bridge, camera segment, effect, content transition, settle point, or hold range. The canonical cumulative timeline is then recomputed. Consequently, the named segment's resolved timing changes and all later Beats' global frame positions shift by the duration delta.

The future interpreter/applier must compute that transitive timing dependency set before accepting the patch. `declaredImpactSet` includes every Beat, bridge, camera segment, node track/effect/content transition, motion cue, Treatment timing promise, and affected parent whose resolved timing changes—even when its source JSON bytes do not. Every semantic lock protects both its literal source value and its derived/resolved timing projection. A lock conflict in any transitive dependency refuses the patch; omitting that dependency is `IMPACT_SET_MISMATCH`, not a way around the lock.

After recomputation, all MotionSpec invariants are revalidated, including positive holds, `settleAt`, complete camera coverage, `bridgeRange`/mechanism-range duration equality, Beat adjacency, and total duration. `retime-bridge` is a separate explicit operation; it is never inferred. If a Beat retime would require range remapping, bridge/participant changes, or a different trim location, the current bounded operation cannot express it: use an explicitly authorized rebuild or block. A request such as “shorten Beat 2 but keep transition, camera, and logo timing locked” therefore blocks unless current source and dependency evidence prove that none of those locked resolved projections changes.

## Exact bounded/rebuild discriminated union

```ts
type SemanticPatchBase = {
  schemaVersion: "semantic-patch@1";
  projectId: string;
  baseRevisionId: string;
  expectedSourceHashes: {brief: string; treatment: string; motion: string};
  expectedLockSetHash: string;
  operations: [PatchOperation, ...PatchOperation[]];
  declaredImpactSet: [SemanticImpactTarget, ...SemanticImpactTarget[]];
  reason: string;
};

type PatchCause =
  | {
      kind: "user-request";
      sourceUserInstruction: string;
      triggeringReviewIssueIds?: never;
      repairCycleId?: never;
    }
  | {
      kind: "review-repair";
      sourceUserInstruction: string;
      triggeringReviewIssueIds: [string, ...string[]];
      repairCycleId: string;
    };

type SemanticPatch = SemanticPatchBase & {
  mode: "bounded" | "rebuild";
  cause: PatchCause;
};
```

Both `operations` and `declaredImpactSet` are non-empty. Operations are unique by their canonical operation/semantic target key—for example `(retime-beat, beatId)` or `(set-lock, canonicalTargetKey)`—and impact targets are unique by the complete discriminator-specific key: `(entity, id, parent identity/channel where declared, field)`. Duplicate or contradictory operations/targets are invalid. `cause.sourceUserInstruction` is the exact non-empty verbatim user instruction that scoped the request, not a paraphrase or reviewer/source prose.

`mode` and `cause.kind` are orthogonal discriminators and form four legal combinations. A direct `user-request` carries no review IDs or repair cycle. A `review-repair`, whether bounded `fix` or structural `rebuild`, carries non-empty issue IDs from the exact current review artifacts and the stable `repairCycleId` authorized by the orchestrator. Review prose alone never becomes user instruction or repair authority.

## Mode and actual-impact invariants

Bounded mode **must not** contain `replace-brief`, `replace-treatment`, or `replace-motion-spec`, and must not combine smaller operations whose actual semantic diff amounts to whole-artifact replacement. Fine-grained operations are mandatory for ordinary bounded edits.

Bounded mode must not add, remove, or reorder any bridge; those changes are structural rebuilds.

Rebuild mode may arise directly from an explicit structural `user-request`, or from a `review-repair` linked to current structural issues. In both cases `cause.sourceUserInstruction` is the exact verbatim user instruction authorizing the request scope. A review-repair additionally requires non-empty issue IDs that resolve in the exact current bound review artifacts and a matching stable repair-cycle ID. Rebuild may replace one, two, or all three canonical source payloads; parent validation is rerun Brief → Treatment → MotionSpec. Fabricated, stale, empty, or unrelated review IDs or a mismatched repair cycle refuse application.

The future applier computes actual semantic impact for all changes—including added, removed, changed, or reordered Beats, bridges, nodes, camera segments, motion cues, and affected parents—and refuses any actual impact not present in the non-empty unique `declaredImpactSet`. Whole-artifact replacement never bypasses this diff.

## Lock authorization and no-evasion invariant

Before applying any operation, the future applier recomputes the current semantic-lock set and compares `expectedLockSetHash`. Any lock-set byte/hash change refuses the entire patch. Lock evaluation is transitive through the canonical dependency graph: changing a source value that changes a locked entity's resolved timing, geometry, content, visibility, or other declared semantic projection is a `LOCK_CONFLICT` even when the locked source field itself is byte-identical.

`set-lock` and `remove-lock` require explicit lock-mutation authorization in the exact `cause.sourceUserInstruction`. For `remove-lock`, that verbatim instruction must name the exact lock target and explicitly request its removal or narrowing. Reviewer text, inspected artifacts, inferred convenience, or a general request to “make it work” cannot authorize a lock mutation.

A patch containing `remove-lock` must not combine that removal with any source mutation or declared impact whose legality depends on the removed lock. Removing a lock and evading it in one patch is invalid even when both operations are listed. All unrelated locks remain effective. Apply an explicitly authorized removal as its own revision; a later separately instructed patch may bind the newly current lock set.

Every patch binds `baseRevisionId`, all three `expectedSourceHashes`, and `expectedLockSetHash`. A stale hash, raw-index target, lock conflict, undeclared operation, missing impact, or disguised rebuild is a refusal, not permission for best-effort repair.
