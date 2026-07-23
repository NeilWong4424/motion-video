# Capability Gap Workflow

## Purpose / Use when

Use only after Motion Planner has authored a `CapabilityGap@1` candidate and external acceptance has established its exact content identity. The workflow chooses among an honest composition, a separately authorized project-local implementation path, or refusal. It never treats a creative wish or advisory as code authority. All executable capability interfaces remain unimplemented in Part 1.

## Reads

Read the accepted immutable gap candidate path beneath `.workflow/candidates/`, its external `gapContentHash`, exact `originPlanningContext`, accepted Brief and Treatment hashes, local asset-manifest identity, exact validated core-or-project registry-snapshot hash, capability-receipt-set hash, affected Beat IDs, attempted capability IDs, and the exact attributed `CapabilityGapRouteDecision@1`. Reload and hash the recorded candidate; do not trust an inline summary or a mutable alias. A cold-start gap binds the validated `catalog/core-registry.json` snapshot rather than an invented empty catalog.

## Writes

This workflow writes nothing. Capability Builder returns only an ephemeral `RoleResult@1.status="advisory"` and has `writes: []` in [`prompt-manifest.json`](../../agent/prompt-manifest.json). It cannot write a proposal artifact, code, schema, fixture, test, registration, receipt, or registry snapshot.

This workflow does not invoke the craft loader for Capability Builder. The role reads this file and its named contracts directly; capability-gap routing is authority procedure, not optional craft advice.

Only the future `project-local-capability-implementation-and-registration` interface may write implementation files, and only after a separate human `CapabilityImplementationAuthorization` names a finite exact path/purpose manifest under `projects/<project-id>/capabilities/<capability-id>/<capability-version>/`. Submitting it also permits exactly one protocol-derived immutable receipt at `projects/<project-id>/capabilities/<capability-id>/<capability-version>/receipts/<implementation-authorization-hash>/implementation-receipt.json`. That audit envelope is excluded from the exact implementation manifest to avoid a self-authorization/hash cycle. Wildcards, directory-wide authority, overwrites, reserved paths, and every other inferred file are invalid.

## Required flow

1. Verify the accepted gap's bytes and all Brief, Treatment, assets, registry, and prior-receipt bindings.
2. Create the exact same-state `capability-gap-route` pause binding the gap hash and context, then record exactly one attributed human route decision with that pause ID and the identical context:
   - `honest-approximation`: initial context returns to Motion Planner in `MOTION_SPEC` for `initial-motion-spec`; rebuild context returns to the active `REBUILD_AUTHORING` motion-spec stage for `rebuild-motion-spec`.
   - `future-project-local-proposal`: delegate `CAPABILITY_ADVISORY` to Capability Builder.
   - `decline`: end the current request without pretending the capability exists.
3. On the proposal route, Capability Builder first attempts to disprove the gap using current registered capabilities and honest composition. If the gap remains, it describes the smallest `project.<project-id>.*` proposal, stable continuity identities, closed local import graph, exact future file manifest, schemas, fixtures, deterministic/boundary tests, performance check, limitations, and next authority.
4. Record the context-matched advisory result and its recovery-stable `advisoryResultReceiptHash`, then enter the resumable state `WAITING_FOR_CAPABILITY_IMPLEMENTATION` with that same context. The route decision authorizes the advisory only; normal recording and recovered-result application retain the same receipt identity.
5. A human may submit a separate `CapabilityImplementationAuthorization` binding the same gap, route decision, recovery-stable `advisoryResultReceiptHash`, origin context, reason, actor, and every exact authorized path/purpose. Hash the complete authorization as `implementationAuthorizationHash`.
6. The future project-local implementation interface may write only those exact authorized implementation/evidence files and the authorization-hash-addressed receipt path. It first derives the non-cyclic `implementationBindingHash` using the null registry-snapshot-content projection, stores that binding in the resulting registry snapshot, then returns a `CapabilityImplementationReceipt@1` binding the context, binding hash, exact `receiptPath`, authorization hash, source and schema hashes, fixtures, test evidence, performance report, registration receipt, and completed registry snapshot. The snapshot never contains the final receipt content hash. It descends from the exact gap-bound snapshot and preserves every selected Treatment catalog ID. It may re-observe identical receipt bytes but must refuse differing bytes rather than overwrite that path.
7. Route that receipt through generic artifact acceptance. Initial context uses `initial-capability-receipt → MOTION_SPEC`; rebuild context uses `rebuild-capability-receipt → REBUILD_AUTHORING`. The resumed Motion Planner writes the matching MotionSpec acceptance route and binds the accepted receipt set and exact resulting registry snapshot.

## Invariants

- The accepted gap is immutable routing evidence, not permission to write code.
- Gap, pause, route decision, advisory, implementation wait, authorization, implementation binding, receipt, receipt acceptance, and resumed MotionSpec all retain one exact initial/rebuild `originPlanningContext`.
- Capability Builder's advisory is non-canonical guidance, not an artifact, implementation manifest, receipt, registration, or gate.
- Every implementation/evidence path is repository-relative, project-local, individually enumerated, and tied to one authorization. The sole non-enumerated output is the protocol-derived immutable receipt path addressed by that authorization hash; it grants no authority to another path. Shared/global registry mutation requires a different reviewed task and is outside this workflow.
- Implementations stay deterministic, pure-code 2D, closed-import, and compatible with one global clock, Persistent World, global camera authority, and stable real-target handoffs.
- No network access, credentials, generated media, dynamic source injection, footage, unseeded randomness, or engine-wide scope expansion is allowed.

## Pause and refusal conditions

Keep the exact `WAITING_FOR_CAPABILITY_IMPLEMENTATION` state while awaiting human authorization or the authorized interface's real result. An unavailable interface or safely reconcilable action creates a same-state pause; it does not enter terminal `STOP` and does not duplicate writes on retry.

Refuse a missing/stale gap, mismatched route, absent exact human authorization, unauthorized path, wrong authorization-hash receipt path, receipt overwrite/collision with differing bytes, incomplete evidence receipt, registry mismatch, scope crossing, or a proposal that cannot preserve deterministic continuity. A user may explicitly decline or abandon the current request. Never infer implementation authorization from the accepted gap, route decision, or advisory.

## Output schema

The Part 1 Capability Builder output is only the closed advisory `RoleResult@1` described in [`capability-builder.md`](../../agent/prompts/capability-builder.md). Receipt, acceptance, and re-entry requirements are defined in [`artifact-acceptance.md`](../../agent/contracts/artifact-acceptance.md) and [`workflow-ledger.md`](../../agent/contracts/workflow-ledger.md). No Part 1 file is evidence that a capability was implemented or registered.
