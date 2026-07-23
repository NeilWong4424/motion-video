# Prompt OS Map

## Purpose

Part 1 is a local documentation Prompt OS. It defines decisions, artifact ownership, and handoffs for a future deterministic pure-code motion workflow; it does not render or otherwise execute those interfaces.

## Authority flow

```text
Accepted typed user facts, constraints, and semantic locks
                 ↓
Orchestrator
  restores the Ledger; classifies, verifies, delegates, invalidates, and routes
                 ↓
Role delegation
  ├─ Artifact-owning Agent writes one immutable semantic candidate
  │     ↓
  │  Artifact Acceptance validates identity and is embedded atomically
  │  in the interface-result event
  └─ Capability Builder returns ephemeral advisory guidance only; no candidate
                 ↓
Reviewers
  independently assess the current hash-bound evidence; they do not approve by implication
                 ↓
On-demand Skills
  provide bounded craft guidance only; they do not own artifacts, state transitions, or gates
                 ↓
Orchestrator
  records the next decision/checkpoint, same-state resumable pause, or terminal outcome
```

The `agent/video-workflow.md` orchestrator is the sole workflow authority. It must not design frames, author role candidates, conduct reviews, or bypass a gate. User facts and explicit locks take precedence; artifact contracts, unique role ownership, current hash-bound evidence, applicable craft, and examples follow in that order. Roles have no direct filesystem writes: they author canonical bytes for a declared `candidateOutputs` target, the trusted candidate writer persists them, and acceptance remains a separate mechanical interface.

## Roles and boundaries

| Layer | Authority | Output boundary |
| --- | --- | --- |
| Orchestrator | State, routing, gate decisions, invalidation, and stops | Ephemeral `WorkflowDecision@1` only |
| Workflow Ledger recorder | Recoverable state and hash-chained checkpoints | Append-only local Ledger events and declared action-result sidecars only |
| Artifact acceptance | Mechanical canonical identity and parent/owner validation | `ArtifactAcceptance@1` embedded atomically in `interface-result-recorded`; no standalone acceptance event or semantic edit |
| Artifact-owning Agents | Their singular artifact type, as declared by `agent/prompt-manifest.json` | One immutable candidate path only |
| Capability Builder | Write-free capability-gap advice | Ephemeral advisory `RoleResult@1` only; no candidate, artifact, implementation, receipt, or registration |
| Reviewers | Creative or motion evaluation of evidence | Their designated review artifact only |
| On-demand Skills | Narrow craft constraints and checklists | Advice; no candidate ownership, accepted artifact, or approval |
| User | Facts, constraints, typed source rights/use declarations, Project Policy semantics, locks, and approval | Explicit attributed locator/secret-safe instructions plus separately bound ephemeral local locators |
| Local ingress interfaces | Mechanical content-addressed source staging and immutable source/policy candidates | No semantic invention, direct acceptance, or persisted arbitrary source locator |

Researcher records local evidence; Creative Direction owns treatment; Motion Planner owns motion specification; Sound Designer owns the AudioBrief for an already approved locked silent cut. A reviewer `ship` result is a review result, not Preview Approval.

## Operating map

1. The Orchestrator verifies/restores the Ledger and records a decision before action.
2. Before an Agent sees local evidence, the adapter records typed rights/use declarations without path values; local ingress binds the ephemeral locator set, stages content-addressed bytes, and returns an immutable manifest candidate. Optional Project Policy follows the same request → mechanical candidate → acceptance pattern at Preview Gate.
3. Each artifact-owning Agent reads accepted upstream evidence and writes its unique bytes under an immutable request/attempt candidate path. Capability Builder is advisory-only and writes no candidate.
4. The candidate passes through `ARTIFACT_ACCEPTANCE`; only an `ArtifactAcceptance@1` result with the exact route, candidate-byte hash, execution-time prompt binding where applicable, parents, and accepted content hash may reach the next owner. That acceptance is embedded in the single atomic `interface-result-recorded` success event, never appended as a separate acceptance event.
5. The Orchestrator checks later deterministic interfaces and hash-bound gates before advancing.
6. Reviewers write independently scoped immutable review attempts, which are also externally accepted. Bounded corrections route through revision interpretation; structural corrections enter the owner-driven rebuild chain.
7. Skills are selected on demand by the authorized role for craft guidance, never as evidence, a gate, or approval.
8. At the audio boundary, successful deterministic prompt generation enters `WAITING_FOR_MANUAL_MUSIC`. The user either returns one exact local track through safe manual-audio ingress or records an exact no-track choice.
9. A capability advisory enters resumable `WAITING_FOR_CAPABILITY_IMPLEMENTATION`. Only a separate exact human authorization may invoke the future project-local implementation interface; an accepted receipt plus its bound registry snapshot resumes Motion Planner.

When facts, rights, local-source evidence, scope, a lock, or a gate is missing or stale, the Orchestrator never infers authority. Correctable conditions and unavailable interfaces produce an exact same-state pause; `STOP` is reserved for a non-resumable current request or explicit abandonment.

## Normative contract map

[`agent/prompt-manifest.json`](../agent/prompt-manifest.json) is the exhaustive machine inventory for the orchestrator, central contracts, interfaces, roles, and its declared execution-resource scope: every non-role file directly loaded as a normative workflow procedure, canonical data resource, deterministic document template, or operator project template. General explanatory maps, reports, and examples are not execution inputs. Craft modules remain exhaustively indexed by their dedicated [`craft/skill-manifest.json`](../craft/skill-manifest.json), so they are not duplicated as individual prompt-manifest resources.

- [`workflow-decision.md`](../agent/contracts/workflow-decision.md) closes project identity, quick defaults, exact role delegation, deterministic interface invocation, producer-free advances, stops, out-of-scope, and completion.
- [`workflow-ledger.md`](../agent/contracts/workflow-ledger.md) closes append-only state, checkpoints, decision ordering, pauses, operator inputs, and re-entry.
- [`artifact-acceptance.md`](../agent/contracts/artifact-acceptance.md) closes RFC 8785 bytes, external artifact identity, local assets, accepted parents, review identity, and capability implementation receipts.
- [`input-trust.md`](../agent/contracts/input-trust.md) and [`role-result.md`](../agent/contracts/role-result.md) close the instruction boundary and typed result/audit handoff for every role.
- [`role-artifact-contracts.md`](../agent/contracts/role-artifact-contracts.md) closes the complete Brief, Research Findings, typed measurement, and AudioBrief shapes used by their unique role owners.
- [`treatment-contract.md`](../agent/contracts/treatment-contract.md) closes the strategic Treatment shape and stable revision identities.
- [`catalog-registry-contract.md`](../agent/contracts/catalog-registry-contract.md) closes the checked-in core motion-profile/style/capability cold start and its deterministic external snapshot identity without claiming implementation.
- [`motion-spec-contract.md`](../agent/contracts/motion-spec-contract.md) closes the cumulative half-open timeline, Persistent World, camera, nodes, five positive-duration continuity families, and the single zero-duration chapter-cut exception.
- [`capability-gap-contract.md`](../agent/contracts/capability-gap-contract.md) separates the hashed gap payload from its attributed route decision, write-free advisory, separate exact human authorization, and resumable project-local implementation/receipt re-entry path.
- [`revision-contract.md`](../agent/contracts/revision-contract.md) closes operations, causes, transitive timing impact, derived locks, and rebuild rules.
- [`review-contract.md`](../agent/contracts/review-contract.md) closes preview provenance, structured playback observations, bridge/cut evidence, issues, and completed/incomplete results.
- [`artifact-contracts.md`](../agent/contracts/artifact-contracts.md), [`engine-interface.md`](../agent/contracts/engine-interface.md), and [`diagnostics.md`](../agent/contracts/diagnostics.md) close lineage, deferred producer, prompt-attempt/manual-return identity, staleness, release, and failure semantics.

All are documentation interfaces in Part 1. They describe what Part 2 must implement; they do not supply a runtime or pretend a deferred artifact exists. Pressure-test coverage and known verification limits are recorded in [`reviews/PROMPT_PRESSURE_REPORT.md`](reviews/PROMPT_PRESSURE_REPORT.md).
