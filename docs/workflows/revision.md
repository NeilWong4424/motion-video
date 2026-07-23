# Revision Workflow

## Purpose / Use when

Use for every visual-source change after the initial snapshot, whether the instruction comes from the user or from an accepted review issue. The workflow preserves the current revision until a complete, validated revision attempt commits. Its deterministic acceptance, validation, and commit interfaces are requirements for Part 2 and are not implemented here.

## Reads

Read the exact durable locator-tokenized source instruction; current revision ID; accepted Brief, Treatment, and MotionSpec identities; exact lock-set hash; current locks; any accepted review issue IDs and repair-cycle ID; and the closed `PatchCause` contract in [`revision-contract.md`](../../agent/contracts/revision-contract.md). If the instruction supplies new local locators, also read the exact ephemeral invocation locators and rights declarations, but never persist the original host paths.

## Writes

This workflow directly writes no semantic artifact. Revision Interpreter may semantically author only one immutable `SemanticPatch@1` candidate for this Ledger-allocated output:

```text
projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/revision.patch.json
```

In rebuild mode, Brief Planner, Creative Direction, and Motion Planner may author only their stage-specific canonical candidate bytes for allocations beneath the active revision-attempt root. Every role has `writes: []` and submits bytes to the trusted candidate writer; no role directly opens or overwrites a current or candidate path.

## Required flow

1. Restore and verify the Ledger. Never infer the base revision or locks from filenames.
2. When the request includes new local locators, enter `REVISION_SOURCE_UPDATE`. Run safe local-source ingress, externally accept the immutable `LocalAssetManifest@1` candidate, delegate Researcher if evidence is needed, externally accept the resulting findings, and only then route to Revision Interpreter. Existing staged bytes are never overwritten with different bytes.
3. Revision Interpreter binds the current source hashes, lock-set hash, durable instruction, cause, and complete declared impact. Its `written` result is still only a candidate and must pass `ARTIFACT_ACCEPTANCE`.
4. Dispatch by the accepted patch discriminator:
   - `bounded` contains only non-empty fine-grained `operations` plus a complete non-empty `declaredImpactSet`. It routes to the deterministic semantic-revision applier.
   - `rebuild` contains `rebuildFrom` and non-empty `authorizedScopes`; it contains no operations and no embedded Brief, Treatment, or MotionSpec replacement payload. It routes to `REBUILD_AUTHORING`.
5. In `REBUILD_AUTHORING`, `ActiveRevisionAttempt.stage` selects exactly one lawful owner and order:
   - `brief` → Brief Planner → acceptance → Creative Direction → acceptance → Motion Planner → acceptance
   - `treatment` → Creative Direction → acceptance → Motion Planner → acceptance
   - `motion-spec` → Motion Planner → acceptance
6. Each rebuild owner reads the accepted staged parent produced earlier in the same attempt, not the old parent or an inline replacement supplied by Revision Interpreter. Every candidate path is immutable and every acceptance binds its exact route, prompt, parents, and bytes.
7. After the complete owner chain, canonical-source validation computes the actual diff, checks it against `authorizedScopes`, `declaredImpactSet`, locks, parents, and current base hashes, and only then permits deterministic commit. A bounded apply follows the same post-apply validation before commit.
8. Only successful commit creates the new immutable revision manifest and lock set, switches `currentRevisionId`, and invalidates dependent RenderPlan, preview, QC, reviews, approval, silent master, AudioBrief, music prompt, returned track, mux, and delivery identities.

## Bounded-change rules

- Use only the closed operations and stable semantic targets in [`revision-contract.md`](../../agent/contracts/revision-contract.md). Array indexes, raw JSON Pointers, unknown operations, duplicate operation keys, empty operations, and disguised whole-artifact replacement are invalid.
- `set-continuity-bridge` may update only the fields allowed by the bridge's unchanged mode variant. It preserves the bridge ID, variant, Beat adjacency, duration/range, participants, mechanisms, and order. Adding, removing, reordering, changing mode, or changing participants/mechanisms requires a rebuild beginning at `motion-spec`.
- Beat retiming uses only `recompute-segment-and-shift-following`. Declare every derived timing effect and revalidate camera coverage, bridge equality, holds, settles, cues, and total duration.
- `remove-lock` must be a revision by itself. It cannot share a patch with a mutation or impact that becomes legal only because the lock was removed.

## Rebuild rules

- A direct user rebuild carries the exact non-empty durable instruction (all non-locator bytes preserved, locators tokenized) and no invented review linkage.
- A review repair additionally binds the exact current accepted issue IDs and repair-cycle ID.
- The directive scopes what the artifact owners may rebuild; it never transfers their authority to Revision Interpreter or the orchestrator.
- Current revision files and checkpoint remain unchanged while candidates are authored, accepted, and validated. Partial owner chains are never published as current source.

## Pause and refusal conditions

Pause in the current state for missing user facts/rights, unavailable acceptance/validation/apply interfaces, or safely reconcilable action uncertainty. Re-entry retries the same candidate or interface with the same input binding; it does not ask a semantic owner to rewrite accepted bytes.

Refuse stale base/source/lock hashes, ambiguous targets, lock evasion, undeclared impact, invalid cause linkage, a bounded structural change, an out-of-scope request, or a source update that cannot be staged safely. Use terminal `STOP` only when the current request is genuinely non-resumable or explicitly abandoned; an unavailable interface alone is never terminal.

## Output schema

`SemanticPatch@1` is exactly the `bounded` or `rebuild` discriminated union in [`revision-contract.md`](../../agent/contracts/revision-contract.md). Part 1 defines the prompt-owned candidate and future interface contracts only; it does not claim acceptance, application, commit, or a revised video.
