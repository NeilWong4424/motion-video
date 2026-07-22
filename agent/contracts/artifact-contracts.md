# Artifact contracts

These are documentation interfaces. Where a contract names an executable producer or strict schema, that producer/schema is required later and is not implemented in Part 1. Markdown must not replace structured handoffs where a JSON artifact is defined.

## Canonical source and configuration chain

| Artifact | Path | Owner | Authority | Must bind |
|---|---|---|---|---|
| `ProjectPolicy@1` | `projects/<project-id>/project.policy.json` | User | Preview-approval actor policy only | Exact project; human default; explicit allowed host IDs only |
| `BriefSpec@1` | `projects/<project-id>/brief.spec.json` | Brief Planner | Goal, audience, facts, one message, CTA, canvas/duration, supplied assets, constraints, assumptions | Project identity and cited local facts |
| `ResearchFindings@1` | `projects/<project-id>/research.findings.json` | Researcher | Observations and measurements from supplied local sources | Local path, optional content hash, location, confidence, observation/inference distinction |
| `TreatmentSpec@1` | `projects/<project-id>/treatment.json` | Creative Direction | Narrative and visual strategy | Approved Brief hash; fixed `seamless-default`; chapter-cut budget 0 or 1 |
| `MotionSpec@1` | `projects/<project-id>/motion.spec.json` | Motion Planner | Beats, persistent nodes, tracks, camera intent, bridges, cues | Brief/Treatment hashes, capability IDs/versions, one bridge per boundary |
| `CapabilityGap@1` | `projects/<project-id>/capability-gaps/<gap-id>.json` | Motion Planner | Exact unsupported approved intent and honest available route descriptions | Closed payload in `capability-gap-contract.md`; project, Treatment hash, gap ID, affected Beats; external `gapContentHash` |
| `SemanticPatch@1` | `projects/<project-id>/revision.patch.json` | Revision Interpreter | Declared bounded/rebuild change, locks, impact | Base revision, expected Brief/Treatment/Motion hashes, expected lock-set hash, and closed user-request/review-repair cause |
| `AudioBriefArtifact@1` | `projects/<project-id>/audio-brief.json` | Sound Designer | Music language and exactly one payoff cue | Current approved revision, RenderPlan, `previewApprovalHash`, `renderManifestHash`, `silentMasterHash` |

`ProjectPolicy@1` is user-owned configuration, not an orchestrator or host write. It has `{schemaVersion:"project-policy@1", projectId, previewApproval:{defaultActor:"human", hostOptIn:{enabled, allowedHostIds[]}}}`. A host is authorized only when the user explicitly set `enabled: true` and listed that exact host ID. Missing policy or the non-authoritative `_template` example grants no host authority.

Sound Designer owns only `audio-brief.json`. A future deterministic audio-prompt tool—not any role—owns `MUSIC_PROMPT.md`.

## Derived and gate artifacts

`ResolvedMotionIR`, `RenderPlan`, preview, sampled evidence bundle, `TechnicalQCReport@1`, `PreviewApproval@1`, silent final, `RenderManifestArtifact`, `MusicPromptDocument`, `MusicPromptAttempt@1`, `AudioAlignmentManifest@1`, mux manifest, and `DeliveryManifest` are future deterministic-tool outputs. Creative and motion review paths are uniquely assigned in `prompt-manifest.json`. The future Approval recorder is the only producer of `PreviewApproval@1`; the attributed actor supplies the decision but does not hand-author the artifact.

Every canonical artifact has schema version, project ID, revision ID where applicable, parent hashes, canonical SHA-256 content identity, and strict producer identity. Determinism means canonical inputs, exact plans and timings, bound implementation identities, and tolerance-based rendered verification. It does not require separately encoded MP4 containers to have identical bytes.

## Exact same-plan dependency tuples

Hash binding is byte binding. A dependency byte/content-hash change is stale even when `revisionId` and `renderPlanHash` remain the same.

- `PreviewEvidenceTuple@1` = `{projectId, revisionId, briefHash, treatmentHash, motionSpecHash, renderPlanHash, previewHash, sampledEvidenceManifestHash}`. `previewHash` identifies exact preview bytes; the sampled manifest binds every sampled frame/scan path and content hash.
- `TechnicalQCTuple@1` = `PreviewEvidenceTuple@1 + {technicalQcHash, technicalQcDecision:"pass"}`. The report itself binds and verifies the whole preview tuple.
- Each completed Review tuple = `TechnicalQCTuple@1 + {reviewKind, reviewContentHash, producerPromptHash, reviewBundleHash, evidenceHash, decision}`. `reviewBundleHash` equals the sampled evidence manifest hash unless a deterministic wrapper manifest is documented and itself binds that hash.
- `ApprovalTuple@1` = `TechnicalQCTuple@1 + {creativeReviewHash, motionReviewHash, creativeDecision:"ship", motionDecision:"ship", actorType, actorId, reason, policyHash}`. `policyHash` is the exact current `ProjectPolicy@1` content hash. The resulting `PreviewApproval@1` adds its own `previewApprovalHash` and recorder producer identity.
- `LockedPictureTuple@1` = `ApprovalTuple@1 + {previewApprovalHash, silentMasterHash, renderManifestHash}`. The Render Manifest binds the silent-master bytes, the exact RenderPlan, renderer/build identity, and approval hash.
- `PostLockAudioTuple@1` = `LockedPictureTuple@1 + {audioBriefHash, promptContentHash, promptAttemptHash}` and, when a track is returned, `{manualAudioHash, sourceLabel, trackPayoffSeconds, gainDb, alignmentManifestHash, muxManifestHash}`. `promptContentHash` always means the SHA-256 of the exact selected `MUSIC_PROMPT.md` bytes; no second prompt-byte hash name exists. Every post-lock artifact binds the Render Manifest and approval hash; audio can never retime picture.
- `DeliveryTuple@1` = one exact complete `PostLockAudioTuple@1` plus `{audioStatus:"not-provided"|"mixed", deliveryManifestHash}`. `not-provided` still requires the actual AudioBrief and content-addressed prompt attempt; it omits only manual-track/alignment/mux members.

Silent delivery therefore always binds `audioBriefHash` and `promptContentHash` plus `promptAttemptHash`; silence means no returned track, not a bypass around the prompt handoff.

QC is stale if preview bytes or the sampled evidence bundle changes. Either review is stale if any preview/QC/evidence dependency or its own bytes change. Approval is stale if any preview, evidence, QC, review, actor attribution, reason, or Project Policy byte/hash changes. Silent final verifies the whole approval tuple; replacing approval bytes or the Render Manifest invalidates downstream audio. Any Render Manifest, silent master, approval, AudioBrief, prompt, manual return, alignment, or mux hash change invalidates dependent post-lock audio and delivery.

## Preview approval artifact

`PreviewApproval@1` is stored beneath the exact output lineage at `out/<project-id>/<revision-id>/<render-plan-hash>/approval/preview-approval.json`. It contains the complete `ApprovalTuple@1`, attributed actor and non-empty reason, recorder producer identity, parent hashes, and its own canonical content hash. It is valid only when both exact completed reviews say `ship` and Technical QC passes. Reviewer `ship`, policy opt-in, or conversational approval alone is never the artifact.

## Capability-gap identity

The persisted `CapabilityGap@1` payload does not contain `contentHash`. Its external `gapContentHash` is the lowercase SHA-256 of the complete canonical JSON bytes, so the identity cannot be self-referential. Persisted bytes must equal that canonical serialization; non-canonical bytes are refused. The orchestrator's route decision records `{gapPath, gapContentHash, actor, reason}` and reloads/recomputes the external identity before routing. Changing any payload value changes the identity and invalidates the old decision.

## Music prompt attempt

The future deterministic audio-prompt generator creates one immutable attempt directory:

`out/<project-id>/<revision-id>/<render-plan-hash>/audio/<audioBriefHash>/prompts/<prompt-attempt-hash>/`

It contains `MUSIC_PROMPT.md` and `prompt-attempt.json`. `MusicPromptAttempt@1` is `{schemaVersion:"music-prompt-attempt@1", projectId, revisionId, renderPlanHash, audioBriefHash, previewApprovalHash, renderManifestHash, silentMasterHash, promptContentHash, producer, parentHashes, contentHash}`. `promptContentHash` is the exact Markdown-byte hash. `contentHash`/`promptAttemptHash` is computed over the canonical attempt envelope with `contentHash` omitted and determines the directory name. Both files are immutable; a changed brief, picture binding, template/tool implementation, or prompt bytes creates a new attempt.

## Prompt-layer interfaces

- `WorkflowInvocation`: ephemeral `{host, userRequest, requestedProjectId?, suppliedLocalPaths[]}`.
- `WorkflowDecision@1`: the exact closed union in `workflow-decision.md`, with deterministic project-ID/default policy, exact role delegation, deterministic non-role interface invocation, producer-free advances, state/evidence/route/stop metadata, `repairCycleId`, both counters, and no source authority.
- `RoleResult@1`: ephemeral `written | blocked | awaiting-interface | advisory` handoff defined in `role-result.md`; `advisory` is non-canonical and cannot serve as gate evidence.
- `ResearchFindings@1`: `{schemaVersion, projectId, sources[], findings[], inferences[], unresolved[]}`; every finding points to a local source and location.
- `CapabilityGap@1` and `CapabilityGapRouteDecision@1`: the exact closed, separate types in `capability-gap-contract.md`. The payload excludes all hash/actor/decision/authorization fields; the route decision binds external `gapContentHash`, attributed human actor, and reason.
- `ProjectLocalCapabilityProposal@1`: ephemeral in Part 1. It may describe gap/project/capability identity, closed proposed source manifest, fixtures, tests, performance budget, stable-root continuity identity, boundary checks, and registration request, but it grants no current writes or implementation success.
`ManualAudioReturn` is the closed operator declaration for one returned local track:

```ts
type ManualAudioReturn = {
  schemaVersion: "manual-audio-return@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
  promptContentHash: string;
  promptAttemptPath: string;
  localAudioPath: string;
  sourceLabel: string;
  trackPayoffSeconds: number;
  gainDb: number;
};
```

Both paths are repository-relative local paths with no URL or `..`. The user explicitly selects the attempt that was actually used; free-text `sourceLabel` is not attempt identity. Before alignment, the future local interface reloads `prompt-attempt.json` at `promptAttemptPath`, reloads and hashes its sibling `MUSIC_PROMPT.md`, verifies `promptContentHash`, and recomputes `promptAttemptHash` from the canonical attempt envelope. The declaration's project, revision, RenderPlan, AudioBrief, `promptContentHash`, and `promptAttemptHash` must equal the selected current prompt attempt and its locked-picture bindings. A track returned from attempt A cannot be aligned, muxed, or delivered under attempt B. The declaration is operator input, never evidence of automatic musical analysis.

## Lifecycle

Initial validated visual source with `currentRevisionId: null` may be snapshotted exactly once as `rev-0001`. Every later source change uses a `SemanticPatch@1`, creates a new revision, preserves locks, validates declared impact, and invalidates all downstream tuples. Direct edits plus another snapshot are forbidden.

An approved locked silent cut precedes AudioBrief. The deterministic prompt attempt is content-addressed beneath that RenderPlan lineage. The user may deliver no track, or manually return one for optional local alignment/mux. Post-lock audio never mutates plan-addressed visual files, and immutable attempts coexist rather than overwriting an authoritative “latest.”

## Continuity invariants

Beats are narrative states in one Persistent World, not slides. Stable nodes retain identity. Every adjacent pair has one measurable bridge. The maximum across the film is one justified zero-duration chapter cut. Non-cut bridges have positive duration and prove preroll, eye trace, motion ownership, and the appropriate endpoint/geometry/velocity evidence.
