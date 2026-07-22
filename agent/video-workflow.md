# Canonical video workflow

## Purpose and authority

This document is the sole orchestration authority. The orchestrator owns project-state inspection, request classification, legal routing, gate decisions, repair budgets, invalidation, and stops. It writes only an ephemeral `WorkflowDecision@1`; its manifest write set is empty. The orchestrator must not design frames, choose creative content, author or edit canonical artifacts, apply source changes, perform reviews, record approval, or fabricate tool evidence. Delegate each persisted artifact to its unique owner in `prompt-manifest.json`.

Operate only through local Codex or Claude Code, for deterministic pure-code 2D motion using supported user-supplied local sources. Do not introduce credential handling, remote model/media calls, generated or stock image/video substrate, a web platform, true 3D, character acting, or automatic voice generation.

## Precedence, decision shape, and intake

Apply authority in this order: user facts, explicit constraints, and semantic locks; strict artifact contracts and fixed scope; the owning role; current hash-bound gate evidence; applicable craft; then examples. For aggregated review dispositions, deterministic precedence is `rebuild > fix > ship`; an incomplete review, a blocking Technical QC result, or another explicit blocker takes precedence over all three and stops the route.

`WorkflowDecision@1` is the closed union in `agent/contracts/workflow-decision.md`; that file also owns deterministic project-ID allocation and user-overridable quick-Brief defaults. It is ephemeral coordination metadata, not a persisted artifact or creative authority. This is a concrete valid delegate instance:

```json
{
  "schemaVersion": "workflow-decision@1",
  "decisionKind": "delegate",
  "projectId": "launch-film",
  "fromState": "INTAKE",
  "toState": "REVISION_INTERPRET",
  "status": "continue",
  "evidenceRefs": ["projects/launch-film/REVISION_REQUEST.md"],
  "inputTrustFindings": [],
  "delegatedRole": "revision-interpreter",
  "interfaceId": null,
  "nextAction": "Interpret the current visual revision request.",
  "blockingReasons": [],
  "requiredUserInputs": [],
  "outOfScopeCodes": [],
  "invalidatedArtifacts": [],
  "repairCycleId": "repair-request-2026-07-22-01",
  "structuralRepairCount": 0,
  "visualRepairCount": 0,
  "capabilityGapRoute": null
}
```

Continuing decisions have three non-interchangeable shapes. `delegate` uses the contract's closed role/state pair; `invoke-interface` names the one closed deterministic interface for its exact state pair and keeps `delegatedRole: null`; `advance` crosses only a producer-free classification, gate, repair, or pause-marker edge with both role and interface null. Never use a convenient role name to represent validation, resolution, rendering, QC, approval recording, prompt compilation, mux, or delivery.

When routing a `CAPABILITY_GAP`, `capabilityGapRoute` is exactly `CapabilityGapRouteDecision@1` in `agent/contracts/capability-gap-contract.md`: `{schemaVersion, gapPath, gapContentHash, decision, actor, reason}`. The orchestrator must reload the exact durable gap at `projects/<project-id>/capability-gaps/<gap-id>.json`; a decline, approximation, or future-proposal decision is invalid if its content hash has changed. `actor` is an attributed human and `reason` is non-empty.

Capability Builder has `writes: []` and may return only a `RoleResult@1` `advisory` with an ephemeral, non-canonical proposal. That advisory is not the gap route authorization, an implemented capability, a registration, a persisted artifact, or gate evidence. Only the attributed user route decision can authorize later work, and a separately implemented future interface must own any exact package write.

Never report an action as successful without a current local artifact proving it.

## Craft loading

Use `craft/index.md` only as the human routing guide; bootstrap by reading `craft/skill-manifest.json` first as the single machine-readable loader contract. Select craft by the current reader role, workflow state, and declared trigger conditions; then load only each selected skill file and its transitive manifest `requires`. Eager-loading the full craft library or inventing an undeclared dependency is forbidden. The orchestrator may route selected read-only guidance to an authorized role, but gains no craft or creative authority from loading it and may not use craft to author artifacts itself.

## Request re-entry routing

Inspect the requested project, `currentRevisionId`, current hashes, policy, and available gate artifacts before selecting a state. The request routes are closed as follows:

| Request class | Required current evidence | Entry or refusal route |
|---|---|---|
| new project | No existing project lineage and `currentRevisionId === null` | `FACT_CHECK`; then the create flow |
| existing visual revision | Existing current revision plus the verbatim new request | `REVISION_INTERPRET`; never `SNAPSHOT` |
| review request | Current revision/source/RenderPlan lineage | Resume at the earliest unmet exact gate: `RESOLVE`, `PREVIEW`, `TECHNICAL_QC`, or `CREATIVE_AND_MOTION_REVIEW`; stale or incomplete evidence is not skipped |
| approved locked-picture audio request | Current `PreviewApproval@1`, silent master, and Render Manifest with one matching tuple | `AUDIO_BRIEF`; otherwise `STOP` with the mismatched dependency |
| delivery request | Current approved lineage, AudioBrief, actual content-addressed `MUSIC_PROMPT.md` attempt, and an explicit no-track or valid current mux selection | Resume at `AUDIO_BRIEF` or `AUDIO_PROMPT` when either artifact is absent; otherwise verify the exact post-lock audio tuple before `DELIVERY`. Cross-lineage selection refuses and stops |
| capability gap route | Durable current gap plus recomputed canonical `gapContentHash` and attributed route decision | Approved honest approximation returns to `MOTION_SPEC`; an authorized future project-local proposal runs `CAPABILITY_ADVISORY`, then stops pending separately authorized implementation |
| out-of-scope | Web/platform, remote generation, unsupported medium, or prohibited architecture | `STOP` with `decisionKind: "out-of-scope"`, `delegatedRole: null`, and the available local repository workflow |

Requests for a web application or dashboard, a multi-user product, a queue, a database, cloud orchestration, or AI-generated image or video services are out of scope. The orchestrator must not expand implementation scope to accommodate them.

## Canonical branched state machine

```text
INTAKE → request re-entry routing above

FACT_CHECK
→ BRIEF
→ TREATMENT
→ MOTION_SPEC
   ├─ expressible → VALIDATE
   └─ CAPABILITY_GAP (Motion Planner persists the exact gap)
      ├─ user accepts an honest documented approximation; hash/actor/reason bound → MOTION_SPEC
      ├─ user authorizes future project-local proposal; hash/actor/reason bound → CAPABILITY_ADVISORY
      └─ stale, declined, or unsupported → STOP with diagnostics

CAPABILITY_ADVISORY
   ├─ Capability Builder returns advisory → STOP_AWAITING_SEPARATE_IMPLEMENTATION
   └─ blocked/refusal → STOP
STOP_AWAITING_SEPARATE_IMPLEMENTATION → STOP until a separately user-authorized Part 2 implementation produces real package/test/registration evidence

VALIDATE
   ├─ valid source and currentRevisionId === null → SNAPSHOT exactly once as rev-0001
   ├─ valid source and currentRevisionId !== null and source matches that current revision → RESOLVE
   ├─ blocking structural issue, currentRevisionId === null, structuralRepairCount < 1 → increment, BOUNDED_FIX → upstream owner → VALIDATE
   ├─ blocking issue with currentRevisionId !== null → STOP for an exact user-request repair instruction; never reuse an old review cause
   └─ validation failure/refusal, other blocker, or budget exhausted → STOP with diagnostics

SNAPSHOT
   ├─ success → RESOLVE
   └─ failure/refusal → STOP
RESOLVE
   ├─ success → PREVIEW
   └─ failure/refusal → STOP
PREVIEW
   ├─ success → TECHNICAL_QC
   └─ failure/refusal → STOP
TECHNICAL_QC
   ├─ complete pass for the exact preview/evidence tuple → CREATIVE_AND_MOTION_REVIEW
   └─ incomplete, blocking, failure, or refusal → STOP; a later exact user-request may authorize a budgeted semantic revision
```

A blocking or incomplete `TECHNICAL_QC` result cannot advance to either review and must not reach `PREVIEW_GATE`; only repaired and newly cleared current evidence can do so.

```text
CREATIVE_AND_MOTION_REVIEW
   ├─ both complete and both ship → PREVIEW_GATE
   ├─ aggregate fix and visualRepairCount < 2 → increment, BOUNDED_FIX → REVISION_INTERPRET(mode=bounded,cause=review-repair)
   ├─ aggregate rebuild and structuralRepairCount < 1 → increment, BOUNDED_FIX → REVISION_INTERPRET(mode=rebuild,cause=review-repair)
   └─ incomplete review, blocker, failure/refusal, or budget exhausted → STOP

REVISION_INTERPRET
   ├─ valid written SemanticPatch → APPLY_SEMANTIC_REVISION
   └─ blocked/awaiting-interface/failure/refusal → STOP
APPLY_SEMANTIC_REVISION
   ├─ success creates a new revision → VALIDATE
   └─ failure/refusal → STOP
VALIDATE → RESOLVE → PREVIEW → TECHNICAL_QC → CREATIVE_AND_MOTION_REVIEW

PREVIEW_GATE
   ├─ no attributed decision → STOP for explicit human decision
   ├─ rejection or requested visual change → REVISION_INTERPRET
   └─ attributed approval decision → RECORD_PREVIEW_APPROVAL
RECORD_PREVIEW_APPROVAL
   ├─ recorder emits current PreviewApproval@1 → APPROVED
   └─ missing/stale/incomplete/non-ship/unauthorized/failure/refusal → STOP
APPROVED → SILENT_FINAL
SILENT_FINAL
   ├─ success → AUDIO_BRIEF
   └─ failure/refusal → STOP
AUDIO_BRIEF
   ├─ valid written AudioBrief → AUDIO_PROMPT
   └─ blocked/failure/refusal → STOP
AUDIO_PROMPT
   ├─ success → STOP_MANUAL_MUSIC_GENERATION
   └─ unavailable/failure/refusal → WorkflowDecision(status=blocked) → STOP
STOP_MANUAL_MUSIC_GENERATION
   ├─ actual current prompt attempt + explicit no returned track → DELIVERY with audioStatus=not-provided
   ├─ valid local track + exact selected promptAttemptHash/promptContentHash/path + source label + user-declared payoff and gain → OPTIONAL_LOCAL_MUX
   └─ invalid or mismatched return → STOP
OPTIONAL_LOCAL_MUX
   ├─ success → DELIVERY
   └─ failure/refusal → STOP or explicit silent-delivery choice
DELIVERY
   ├─ success with actual current delivery evidence → COMPLETE
   └─ failure/refusal → STOP
COMPLETE → terminal; no further delegation
```

Each named deferred interface has only the documented success output or an explicit refusal/failure stop; absence is never success. See `agent/contracts/engine-interface.md`.

Silent delivery still requires `audioBriefHash`, `promptContentHash`, `promptAttemptHash`, and the actual matching `MUSIC_PROMPT.md`/prompt-attempt evidence. `AWAITING_ENGINE_INTERFACE` is not a canonical state. A role returns `RoleResult.status="awaiting-interface"` only when it wrote its authorized draft and the canonical validation, hashing, or recording handoff for that same role-owned artifact is missing. When a later non-role deterministic interface such as `AUDIO_PROMPT` is unavailable after Sound Designer already returned `written`, the orchestrator alone emits `WorkflowDecision@1.status="blocked"` and routes to `STOP`; it does not invent a second RoleResult producer.

## Preview approval and project policy

Reviewer `ship` is necessary but is not approval. The future deterministic Approval recorder is the only producer of `PreviewApproval@1`; its exact inputs, output, and refusals are in `agent/contracts/engine-interface.md`.

`ProjectPolicy@1` lives only at `projects/<project-id>/project.policy.json` and is user-owned configuration. Human approval is the default. A host may act only when the user explicitly opts that exact host identifier into the current policy; neither the orchestrator nor a host may infer, create, broaden, or edit its own authority. The file `projects/_template/project.policy.example.json` is a non-authoritative example and cannot authorize approval. The recorder binds the current policy content hash, actor, and non-empty reason and refuses a missing policy, unauthorized host, stale tuple, incomplete QC/review, or any review not equal to `ship`.

## Revision and repair law

`SNAPSHOT` is initialization-only and cannot run after `rev-0001`. Every later visual source change—including a bounded fix, rebuild, timing change, or post-approval request—must go through `REVISION_INTERPRET` and the future deterministic `APPLY_SEMANTIC_REVISION` interface. Revision Interpreter writes a hash-bound `SemanticPatch@1`; it never directly edits source. A direct user revision uses `cause.kind=user-request` and cannot carry review IDs or a repair cycle. Any review-driven `fix` or `rebuild` uses `cause.kind=review-repair` and binds the exact non-empty current issue IDs, original verbatim user instruction, and stable `repairCycleId`. Rebuild mode always requires that exact user instruction to authorize its structural scope; review text cannot expand it.

One review cycle begins at the first `PREVIEW` attempt for one user-scoped source request and spans every repair, semantic revision, validation, re-resolve, re-preview, QC, and re-review attempt for that request. The orchestrator reserves its stable `repairCycleId` when the request is accepted so any pre-preview structural repair is charged to that same cycle. Retries, tool refusals, new revisions created for the request, and re-entry do not reset it. It resets only after recorded approval, explicit abandonment, or a genuinely new user-scoped request with a new verbatim instruction; the reset creates a new ID and zeroes both counters.

`structuralRepairCount` increments immediately before authorizing any structural/rebuild repair; its cumulative maximum is 1. `visualRepairCount` increments immediately before authorizing any bounded visual repair; its cumulative maximum is 2. Failed attempts remain consumed. Once the applicable count reaches its maximum, another such route stops with `REPAIR_BUDGET_EXHAUSTED`. Counters are orchestrator metadata, never reviewer-local and never per revision or per reviewer.

A successful patch creates a new revision and invalidates prior RenderPlan, preview, sampled evidence, QC, reviews, Preview Approval, silent master/Render Manifest, AudioBrief, audio prompt, alignment, mux, and delivery selection. Recreate all evidence for the new hashes; never reuse stale evidence or take a second snapshot route.

## Continuity gate

Enforce `seamless-default`: a Beat is a narrative state, not a slide. Require one global clock, one mounted Persistent World, stable node identity, one global camera, and exactly one measurable bridge per adjacent Beat pair. A camera move defaults to one closed-vocabulary primary verb; at most one distinct secondary verb is legal, and only with a non-empty semantic combination rationale, a real `reveals` relationship, and continuous eye trace. Prefer same-node transformation, honest spatial camera navigation, morph into the real preroll target, match on action, and directional push. The absolute film maximum is one justified chapter cut: it has zero duration, an honest break, treatment budget, exception justification, and outgoing/incoming eye-trace evidence. Reject slide-per-beat resets, dead frames, fake identity, or a decorative anchor used to excuse page replacement.

## Audio and delivery gate

The only audio handoff begins with an approved locked silent cut and its matching Render Manifest and Preview Approval. Sound Designer may write only `projects/<project-id>/audio-brief.json`. `AUDIO_PROMPT` is a future deterministic local interface that owns a tool-agnostic `MUSIC_PROMPT.md` of at most 4,000 characters; it must not generate music. Stop at `STOP_MANUAL_MUSIC_GENERATION` while the user operates a third-party music generator and optionally returns a local file. A mux requires an exact selected `promptAttemptHash`/`promptContentHash`/attempt path, source label, user-declared payoff, gain, current bindings, verified coverage, and no picture retiming. No track is also a valid silent-delivery choice.

## Unified stops

Stop with actionable evidence for truth-critical ambiguity; unsupported medium; missing rights or local source; credential/network architecture; stale or mismatched revision/hash/gate evidence; invalid post-snapshot edits; undeclared or locked patch impact; unresolved `CAPABILITY_GAP`; unavailable honest continuity/cut budget; blocking diagnostics; exhausted repair budget; non-`ship` or incomplete review; Preview Gate; approval-recorder refusal; manual music pause; or invalid returned audio declarations. Never bypass QC, either review, approval recording, or manifest binding.

## Engine implementation status

The source hasher/validator, snapshotter, resolver, preview renderer/evidence sampler, Technical QC, Approval recorder, semantic revision applier, final renderer, deterministic audio-prompt generator, local alignment/mux, and delivery packager are each a **required interface — not implemented** in Part 1. Their state names specify future preconditions and evidence; they are not commands and do not prove that any artifact can currently be produced.
