# Artifact contracts

These are documentation interfaces. Where the contract names an executable producer or strict schema, that producer/schema is required later and is not implemented in Part 1. Markdown must not replace structured handoffs where a JSON artifact is defined.

## Canonical source chain

| Artifact | Path | Owner | Authority | Must bind |
|---|---|---|---|---|
| `BriefSpec@1` | `projects/<project-id>/brief.spec.json` | Brief Planner | Goal, audience, facts, one message, CTA, canvas/duration, supplied assets, constraints, assumptions | Project identity and cited local facts |
| `ResearchFindings@1` | `projects/<project-id>/research.findings.json` | Researcher | Observations and measurements from supplied local sources | Local path, optional content hash, location, confidence, observation/inference distinction |
| `TreatmentSpec@1` | `projects/<project-id>/treatment.json` | Creative Direction | Narrative and visual strategy | Approved Brief hash; fixed `seamless-default`; chapter-cut budget 0 or 1 |
| `MotionSpec@1` | `projects/<project-id>/motion.spec.json` | Motion Planner | Beats, persistent nodes, tracks, camera intent, bridges, cues | Treatment hash, capability IDs/versions, one bridge per boundary |
| `SemanticPatch@1` | `projects/<project-id>/revision.patch.json` | Revision Interpreter | Declared bounded/rebuild change, locks, impact | Base revision and expected Brief/Treatment/Motion hashes; source instruction; issue IDs for rebuild |
| `AudioBriefArtifact@1` | `projects/<project-id>/audio-brief.json` | Sound Designer | Music language and exactly one payoff cue | Current approved revision, RenderPlan, preview/approval, silent manifest |

Sound Designer owns only `audio-brief.json`. A future deterministic audio-prompt tool—not any role—owns `MUSIC_PROMPT.md`.

## Derived and gate artifacts

`ResolvedMotionIR`, `RenderPlan`, preview, sampled frame bundle, `TechnicalQCReport@1`, silent final, `RenderManifestArtifact`, `MusicPromptDocument`, `AudioAlignmentManifest@1`, and `DeliveryManifest` are future deterministic-tool outputs. Creative and motion review paths are uniquely assigned in `prompt-manifest.json`. `PreviewApproval@1` is an explicit human-by-default gate artifact, not a reviewer output.

Every derived/gate artifact must carry schema version, revision ID, parent hashes, canonical SHA-256 identity, and a strict producer identity. Reviews, QC, approval, silent final, AudioBrief, prompt, mix, and delivery must all refer to the same current RenderPlan lineage. A source, timing, implementation identity, or RenderPlan change makes downstream bindings stale.

Determinism means canonical inputs, exact plans and timings, bound implementation identities, and tolerance-based rendered verification. It does not require separately encoded MP4 containers to have identical bytes.

## Prompt-layer interfaces

- `WorkflowInvocation`: ephemeral `{host, userRequest, requestedProjectId?, suppliedLocalPaths[]}`.
- `WorkflowDecision@1`: ephemeral state/evidence/route/stop metadata with no source authority.
- `ResearchFindings@1`: `{schemaVersion, projectId, sources[], findings[], inferences[], unresolved[]}`; every finding points to a local source and location.
- `CapabilityGap@1`: `{schemaVersion, projectId, treatmentHash, gapId, requiredIntent, whyExistingCompositionFails, affectedBeatIds, honestApproximation?, proposedProjectLocalScope?, prohibitedEngineChanges[]}`. Motion Planner records it as a stop handoff rather than smuggling unknown capability data into MotionSpec.
- `ProjectLocalCapabilityProposal@1`: gap/project/capability identity, intent and resolved schema references, closed source manifest, fixtures, tests, performance budget, stable-root continuity identity, boundary checks, and registration request.
- `ManualAudioReturn`: user-supplied local path, source label, `trackPayoffSeconds`, and gain. It is operator input, never evidence of automatic analysis.

## Lifecycle

Initial validated visual source with `currentRevisionId: null` may be snapshotted exactly once as `rev-0001`. Every later source change uses a `SemanticPatch@1`, creates a new revision, preserves locks, validates declared impact, and invalidates downstream evidence. Direct edits plus another snapshot are forbidden.

An approved locked silent cut precedes AudioBrief. The deterministic prompt attempt is content-addressed beneath that RenderPlan lineage. The user may deliver no track, or manually return one for optional local alignment/mux. Post-lock audio never mutates plan-addressed visual files, and immutable attempts coexist rather than overwriting an authoritative “latest.”

## Continuity invariants

Beats are narrative states in one Persistent World, not slides. Stable nodes retain identity. Every adjacent pair has one measurable bridge. The maximum across the film is one justified zero-duration chapter cut. Non-cut bridges have positive duration and prove preroll, eye trace, motion ownership, and the appropriate endpoint/geometry/velocity evidence.
