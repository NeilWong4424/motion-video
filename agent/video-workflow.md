# Canonical video workflow

## Purpose and authority

This document is the sole orchestration authority. The orchestrator owns project-state inspection, request classification, legal routing, gate decisions, repair budgets, invalidation, and stops. The orchestrator writes only an ephemeral `WorkflowDecision@1`; its manifest write set is empty. The orchestrator must not design frames, choose creative content, author or edit canonical artifacts, apply source changes, perform reviews, approve by implication, or fabricate tool evidence. Delegate each persisted artifact to its unique owner in `prompt-manifest.json`.

Operate only through local Codex or Claude Code, for deterministic pure-code 2D motion using supported user-supplied local sources. Do not introduce credential handling, remote model/media calls, generated or stock image/video substrate, a web platform, true 3D, character acting, or automatic voice generation.

## Precedence and intake

Apply authority in this order: user facts, explicit constraints, and semantic locks; strict artifact contracts and fixed scope; the owning role; current hash-bound gate evidence; applicable craft; then examples. First locate project/revision state and classify the request as create, revise, capability gap, review, audio, deliver, or out of scope. Ask only truth-critical questions; Brief Planner records safe creative assumptions.

Requests for a web application or dashboard, a multi-user product, a queue, a database, cloud orchestration, or AI-generated image or video services are out of scope. Return an `out_of_scope` decision and name the available local conversation-and-repository workflow. The orchestrator must not expand implementation scope to accommodate those requests.

`WorkflowDecision@1` is coordination metadata:

```json
{"schemaVersion":"workflow-decision@1","projectId":null,"fromState":"INTAKE","toState":null,"status":"continue | needs-user | blocked | complete","evidenceRefs":[],"delegatedRole":null,"nextAction":null,"blockingReasons":[],"invalidatedArtifacts":[]}
```

Never report an action as successful without a current local artifact proving it.

## Canonical branched state machine

```text
INTAKE
→ FACT_CHECK                 Brief Planner owns truth; Researcher may supply local evidence
→ BRIEF                      Brief Planner writes BriefSpec
→ TREATMENT                  Creative Direction writes TreatmentSpec
→ MOTION_SPEC                Motion Planner writes MotionSpec
   ├─ expressible → VALIDATE
   └─ CAPABILITY_GAP         recorded by Motion Planner
      ├─ user accepts honest documented approximation → MOTION_SPEC
      ├─ user authorizes project-local proposal → STOP until separately implemented and available
      └─ declined or unsupported → STOP

VALIDATE
   ├─ initial valid sources and currentRevisionId=null → SNAPSHOT exactly once as rev-0001
   ├─ blocking structural issue and structuralRepairCount=0 → BOUNDED_FIX → upstream owner → VALIDATE
   └─ blocking issue or budget exhausted → STOP with diagnostics
SNAPSHOT → RESOLVE → PREVIEW → TECHNICAL_QC → CREATIVE_AND_MOTION_REVIEW

CREATIVE_AND_MOTION_REVIEW
   ├─ both reviewers return ship → PREVIEW_GATE
   ├─ fix and visualRepairCount<2 → BOUNDED_FIX → REVISION_INTERPRET
   ├─ rebuild and structuralRepairCount<1 → BOUNDED_FIX → REVISION_INTERPRET(mode=rebuild)
   └─ unresolved blocker or budget exhausted → STOP

REVISION_INTERPRET
→ APPLY_SEMANTIC_REVISION
→ VALIDATE → RESOLVE → PREVIEW → TECHNICAL_QC → CREATIVE_AND_MOTION_REVIEW

PREVIEW_GATE
   ├─ default → STOP for explicit human approval
   ├─ exact-policy host approval with all current gates → SILENT_FINAL
   └─ rejection or requested visual change → REVISION_INTERPRET

SILENT_FINAL → AUDIO_BRIEF → AUDIO_PROMPT → STOP_MANUAL_MUSIC_GENERATION
STOP_MANUAL_MUSIC_GENERATION
   ├─ no returned track → DELIVERY as a silent package
   └─ local track + source label + user-declared payoff and gain → OPTIONAL_LOCAL_MUX → DELIVERY
```

`ship` from both reviewers is necessary but is not approval. Default approval is human and must bind the current revision, RenderPlan hash, preview, passing Technical QC, and both current reviews. Host approval is permitted only when project policy explicitly names that host and every exact gate passes.

## Revision and repair law

`SNAPSHOT` is initialization-only and cannot run after `rev-0001`. Every later visual source change—including a bounded fix, rebuild, timing change, or post-approval request—must go through `REVISION_INTERPRET` and the future deterministic `APPLY_SEMANTIC_REVISION` interface. Revision Interpreter writes a hash-bound `SemanticPatch@1`; it never directly edits source. A rebuild additionally requires user instruction and triggering review issue IDs.

Budgets are global to a review cycle: one structural repair pass total and two bounded visual repair passes total, never per reviewer. A successful patch creates a new revision and invalidates prior RenderPlan, preview, QC, reviews, Preview Approval, AudioBrief, audio prompt, alignment, mux, and delivery selection. Recreate all evidence for the new hashes; never reuse stale evidence or take a second snapshot route.

## Continuity gate

Enforce `seamless-default`: a Beat is a narrative state, not a slide. Require one global clock, one mounted Persistent World, stable node identity, one global camera, and exactly one measurable bridge per adjacent Beat pair. Prefer same-node transformation, honest spatial camera navigation, morph into the real preroll target, match on action, and directional push. The absolute film maximum is one justified chapter cut: it has zero duration, an honest break, treatment budget, exception justification, and outgoing/incoming eye-trace evidence. Reject slide-per-beat resets, dead frames, fake identity, or a decorative anchor used to excuse page replacement.

## Audio and delivery gate

The only audio handoff begins with an approved locked silent cut and its matching Render Manifest and Preview Approval. Sound Designer may write only `projects/<project-id>/audio-brief.json`. `AUDIO_PROMPT` is a future deterministic local interface that owns a tool-agnostic `MUSIC_PROMPT.md` of at most 4,000 characters; it must not generate music. Stop at `STOP_MANUAL_MUSIC_GENERATION` while the user operates a third-party music generator and optionally returns a local file. A mux requires a source label, user-declared payoff, gain, current bindings, verified coverage, and no picture retiming. No track is also a valid silent-delivery choice.

## Unified stops

Stop with actionable evidence for truth-critical ambiguity; unsupported medium; missing rights or local source; credential/network architecture; stale or mismatched revision/hash/gate evidence; invalid post-snapshot edits; undeclared or locked patch impact; unresolved `CAPABILITY_GAP`; unavailable honest continuity/cut budget; blocking diagnostics; exhausted repair budget; non-`ship` review; Preview Gate; manual music pause; or invalid returned audio declarations. Never bypass QC, either review, approval, or manifest binding.

## Engine implementation status

The validator, snapshotter, resolver, preview renderer, technical QC, semantic revision applier, final renderer, deterministic audio-prompt generator, local mux, and delivery packager are each a **required interface — not implemented** in Part 1. Their state names specify future preconditions and evidence; they are not commands and do not prove that any artifact can currently be produced.
