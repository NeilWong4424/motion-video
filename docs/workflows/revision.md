# Revision Workflow

## Purpose / Use when

Use after the initial snapshot whenever a user or reviewer requests a visual-source change. This workflow preserves locks and routes every change through a new revision. Its proposed executable interfaces are not implemented in Part 1.

## Reads

Read the verbatim request, base revision, expected Brief/Treatment/Motion hashes, `expectedLockSetHash`, current source artifacts, semantic locks, diagnostics, and the `PatchCause` declared by the exact closed contract in `../../agent/contracts/revision-contract.md`. Read review issue IDs and the repair-cycle ID only for a `review-repair`; do not invent operations, causes, or target shapes in this workflow.

## Writes

None. The Revision Interpreter alone may author the documented `SemanticPatch@1` artifact; this workflow never directly edits source, applies the patch, validates hashes, or claims a revision was created. Deterministic validation/application remains a future interface.

## Must

- Require `SemanticPatch@1` for every post-snapshot visual change and preserve all expected source hashes, `expectedLockSetHash`, locks, and unrelated semantic entities.
- Use only the discriminated operations and stable semantic targets declared in the central revision contract. Array-index targets, raw JSON Pointers, unknown operations, duplicate operation keys, and empty operation/impact sets are invalid.
- Use bounded mode for fine-grained permitted changes. A bounded patch cannot add, remove, or reorder Beats, bridges, nodes, camera segments, or motion cues; it must not contain `replace-brief`, `replace-treatment`, or `replace-motion-spec`, including a disguised whole-artifact replacement assembled from smaller operations.
- In bounded mode, `set-continuity-bridge` may target only an existing `bridgeId`; its non-empty `changes` may contain only the central `BoundedBridgeChanges` fields (`narrativeReason`, `transitionFamily`, `vocabularyRole`, `motionOwnership`, `combinationMeaning`, or `eyeTrace`). Its `expectedMode` must equal the existing bridge's mode. It must preserve the bridge ID, adjacency, order, duration/range, participant and mechanism bindings, and variant discriminator; it may not add or remove a bridge, replace the whole bridge, or replace one bridge variant with another. The exact closed operation contract in `../../agent/contracts/revision-contract.md` remains authoritative.
- A Beat retime uses only `timingPolicy: "recompute-segment-and-shift-following"`: it changes the Beat duration, leaves every SegmentRef/range byte unchanged, then recomputes that segment and all later global frames. Declare every transitive resolved-timing impact and revalidate camera coverage, bridge/range equality, holds, settles, cues, and total duration. A lock protects derived timing too; locked camera/transition/logo timing therefore blocks an incompatible Beat retime. No implicit trim-point or range remap is permitted.
- Use rebuild mode only for genuine structural replacement and follow the central `PatchCause` union exactly. A direct `user-request` rebuild requires the exact non-empty verbatim user instruction and carries no review issue IDs or repair cycle. A `review-repair` rebuild additionally requires the central contract's non-empty current triggering review issue IDs and matching stable repair-cycle ID.
- A `remove-lock` operation requires an exact verbatim user authorization naming the target and removal. Apply lock removal alone: it must not share a patch with any mutation or impact whose legality depends on that removal. A later, separately instructed revision may target the new lock set.
- Create a new revision, calculate the declared impact set, invalidate dependent previews/reviews/QC/approval/audio evidence, then route through validation and all required gates again.
- Keep locks explicit and stop when an operation would touch a locked or unrelated field.
- After Revision Interpreter writes a patch draft, unavailable canonical patch hashing/validation/recording requires that role's `RoleResult@1` with `status: "awaiting-interface"`. If a valid canonically bound patch exists but the later non-role application/rebuild interface is unavailable, Revision Interpreter returns `written` and the orchestrator emits `WorkflowDecision@1.status="blocked"`. Both paths stop and must not claim a new revision exists.

## Must not

- Directly edit source, create a second snapshot path, disguise a structural request as bounded, remove a lock to evade it in the same patch, silently redesign unrelated material, or reuse stale approval/audio evidence.
- Let a reviewer mutate source or let a patch bypass the capability-gap route.

## Stop conditions

Stop on stale base/source/lock-set hashes, ambiguous or index-based target, lock conflict or attempted lock evasion, undeclared impact, empty operations/impact, out-of-scope request, a bounded bridge edit outside the central finite field set or one that would replace its variant, or a structural change without the cause-specific linkage required by the central `PatchCause` union.

## Output schema

`SemanticPatch@1` is exactly the mode-and-cause discriminated union in `../../agent/contracts/revision-contract.md`; its mode literals are only `bounded` and `rebuild`, and its cause literals and fields come only from the central `PatchCause` union. The role may author that documentation artifact in Part 1, but hashing, validation, application, revision creation, and rebuilding are not implemented. Missing role-owned patch binding uses `RoleResult@1.status="awaiting-interface"`; a missing later applier uses orchestrator `WorkflowDecision@1.status="blocked"`. Both route to `STOP`.
