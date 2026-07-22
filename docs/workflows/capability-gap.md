# Capability Gap Workflow

## Purpose / Use when

Use when Motion Planner records a `CAPABILITY_GAP` because the approved intent cannot be honestly expressed by existing composition. This is a routing workflow, not a capability authority. Its proposed executable interfaces are not implemented in Part 1.

## Reads

Read the durable `projects/<project-id>/capability-gaps/<gap-id>.json` record written by Motion Planner, its external canonical content hash, the exact `CapabilityGapRouteDecision@1`, approved Treatment and Motion intent, existing capability metadata, local-only boundaries, affected Beat IDs, and any craft evidence already selected for the owning planning role. Verify the gap path, project, gap ID, Treatment hash, and delegated content hash before routing it. The two closed types come only from `../../agent/contracts/capability-gap-contract.md`. This workflow does not invoke the craft loader for Capability Builder.

## Writes

None. This workflow never writes or edits the durable gap. Capability Builder has no current Part 1 package/code write authority. A future interface may write only the exact registered project-local manifest path declared in `agent/prompt-manifest.json` after a separate explicit route authorization.

## Must

- Preserve the recorded canonical gap byte-for-byte, including required intent, attempted capability IDs, why composition fails, affected Beats, and an honest approximation and/or future project-local scope. A proposal or route decision refers to the gap by path and content hash; it never replaces the record with an inline summary.
- Treat this file as workflow routing, not as a craft skill. It is intentionally absent from `../../craft/skill-manifest.json`; no `CAPABILITY_GAP` state or Capability Builder reader route exists in that manifest, and this workflow must not claim one.
- Present only three routes: documented honest approximation back to MotionSpec; explicitly authorized future project-local-only proposal; or decline/unsupported stop.
- Require proof that existing composition cannot meet the intent before a local proposal.
- Use the exact separate route fields `{schemaVersion, gapPath, gapContentHash, decision, actor, reason}`. In Part 1 the future-project-local route explicitly delegates `CAPABILITY_ADVISORY`; after Capability Builder returns its non-canonical advisory, route to `STOP_AWAITING_SEPARATE_IMPLEMENTATION` rather than creating source, fixtures, tests, or registration.
- Constrain any future package to `project.<project-id>.` IDs, a closed local import graph, stable identity roots/subnodes, deterministic fixture/tests, and a performance check.
- Require a new MotionSpec and downstream validation after a selected route changes the source intent.

## Must not

- Silently add code, alter a shared catalog, self-promote a project capability, or treat a gap as permission to use network, dynamic resources, footage, or non-deterministic behavior.
- Erase the recorded gap or turn a capability request into an untracked source edit.

## Stop conditions

Stop when no durable hash-matching gap exists, existing composition suffices, route authorization is absent/mismatched, the proposal crosses local-only scope, or a future interface lacks fixture/test/performance evidence. An available honest approximation is not itself a stop; it is one attributed route choice. Never infer authorization from the gap itself.

## Output schema

Part 1 output is the `RoleResult@1` advisory shape in `capability-builder.md`, containing the persisted gap path/hash, the exact route decision, project/capability/version, proposed intent/resolved schema references, finite future source manifest, fixture/test cases, performance budget, continuity identity, boundary checks, limitations, and next authority. It is not a package or registration; do not emit an implementation path as if it existed.
