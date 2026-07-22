# Capability Gap Workflow

## Purpose / Use when

Use when Motion Planner records a `CAPABILITY_GAP` because the approved intent cannot be honestly expressed by existing composition. This is a routing workflow, not a capability authority. Its proposed executable interfaces are not implemented in Part 1.

## Reads

Read the recorded `CAPABILITY_GAP`, approved Treatment and Motion intent, existing capability metadata, local-only boundaries, affected Beat IDs, and applicable craft.

## Writes

None in Part 1. A future Capability Builder may propose a project-local-only package after authorization; this workflow writes no source or artifact.

## Must

- Preserve the recorded gap, including required intent, why composition fails, affected Beats, and an honest approximation where one exists.
- Present only three routes: documented honest approximation back to MotionSpec; approved project-local-only proposal; or decline/unsupported stop.
- Require proof that existing composition cannot meet the intent before a local proposal.
- Constrain any future package to `project.<project-id>.` IDs, a closed local import graph, stable identity roots/subnodes, deterministic fixture/tests, and a performance check.
- Require a new MotionSpec and downstream validation after a selected route changes the source intent.

## Must not

- Silently add code, alter a shared catalog, self-promote a project capability, or treat a gap as permission to use network, dynamic resources, footage, or non-deterministic behavior.
- Erase the recorded gap or turn a capability request into an untracked source edit.

## Stop conditions

Stop when no recorded gap exists, existing composition or an honest approximation suffices, authorization is absent, the proposal crosses local-only scope, or fixture/test/performance evidence is unavailable.

## Output schema

Future only: `ProjectLocalCapabilityProposal@1` with the gap ID, project ID, capability/version, intent and resolved schema references, source manifest references, fixture/test references, performance budget, continuity identity, boundary checks, and registration request. It is not implemented in Part 1.
