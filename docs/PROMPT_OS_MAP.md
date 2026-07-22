# Prompt OS Map

## Purpose

Part 1 is a local documentation Prompt OS. It defines decisions, artifact ownership, and handoffs for a future deterministic pure-code motion workflow; it does not render or otherwise execute those interfaces.

## Authority flow

```text
User facts, constraints, and semantic locks
                 ↓
Orchestrator
  classifies state, verifies gates, delegates, invalidates, and stops
                 ↓
Agents
  each owns exactly one canonical artifact named in the role manifest
                 ↓
Reviewers
  independently assess the current hash-bound evidence; they do not approve by implication
                 ↓
On-demand Skills
  provide bounded craft guidance only; they do not own artifacts, state transitions, or gates
                 ↓
Orchestrator
  records the next allowed state or a stop for explicit human approval
```

The `agent/video-workflow.md` orchestrator is the sole workflow authority. It must not design frames, author canonical artifacts, conduct reviews, or bypass a gate. User facts and explicit locks take precedence; artifact contracts, unique role ownership, current hash-bound evidence, applicable craft, and examples follow in that order.

## Roles and boundaries

| Layer | Authority | Output boundary |
| --- | --- | --- |
| Orchestrator | State, routing, gate decisions, invalidation, and stops | Ephemeral `WorkflowDecision@1` only |
| Agents | Their singular artifact type, as declared by `agent/prompt-manifest.json` | The designated project artifact only |
| Reviewers | Creative or motion evaluation of evidence | Their designated review artifact only |
| On-demand Skills | Narrow craft constraints and checklists | Advice; no canonical artifact or approval |
| User | Facts, constraints, rights declarations, locks, and approval | Explicit instructions and local evidence |

Researcher records local evidence; Creative Direction owns treatment; Motion Planner owns motion specification; Sound Designer owns the AudioBrief for an already approved locked silent cut. A reviewer `ship` result is a review result, not Preview Approval.

## Operating map

1. The Orchestrator routes intake through fact checking and the owning Agent.
2. Each Agent reads only the required upstream evidence and writes its unique artifact.
3. The Orchestrator checks required interfaces and hash-bound gates before it advances state.
4. Reviewers return independently scoped evidence. The Orchestrator routes any bounded correction through revision interpretation.
5. Skills are selected on demand by the authorized role for craft guidance, never as a substitute for evidence, a gate, or human approval.
6. At the audio boundary, the workflow stops after the future deterministic music-prompt document is handed to the user for manual operation.

When facts, rights, local-source evidence, scope, a lock, or a gate is missing or stale, the Orchestrator stops rather than infer authority.

## Normative contract map

- [`workflow-decision.md`](../agent/contracts/workflow-decision.md) closes project identity, quick defaults, exact role delegation, deterministic interface invocation, producer-free advances, stops, out-of-scope, and completion.
- [`input-trust.md`](../agent/contracts/input-trust.md) and [`role-result.md`](../agent/contracts/role-result.md) close the instruction boundary and typed result/audit handoff for every role.
- [`role-artifact-contracts.md`](../agent/contracts/role-artifact-contracts.md) closes the complete Brief, Research Findings, typed measurement, and AudioBrief shapes used by their unique role owners.
- [`treatment-contract.md`](../agent/contracts/treatment-contract.md) closes the strategic Treatment shape and stable revision identities.
- [`motion-spec-contract.md`](../agent/contracts/motion-spec-contract.md) closes the cumulative half-open timeline, Persistent World, camera, nodes, and six continuity bridges.
- [`capability-gap-contract.md`](../agent/contracts/capability-gap-contract.md) separates the hashed gap payload from its attributed route decision and advisory stop.
- [`revision-contract.md`](../agent/contracts/revision-contract.md) closes operations, causes, transitive timing impact, derived locks, and rebuild rules.
- [`review-contract.md`](../agent/contracts/review-contract.md) closes preview provenance, structured playback observations, bridge/cut evidence, issues, and completed/incomplete results.
- [`artifact-contracts.md`](../agent/contracts/artifact-contracts.md), [`engine-interface.md`](../agent/contracts/engine-interface.md), and [`diagnostics.md`](../agent/contracts/diagnostics.md) close lineage, deferred producer, prompt-attempt/manual-return identity, staleness, release, and failure semantics.

All are documentation interfaces in Part 1. They describe what Part 2 must implement; they do not supply a runtime or pretend a deferred artifact exists. Pressure-test coverage and known verification limits are recorded in [`reviews/PROMPT_PRESSURE_REPORT.md`](reviews/PROMPT_PRESSURE_REPORT.md).
