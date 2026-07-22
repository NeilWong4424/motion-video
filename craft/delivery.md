# Delivery Craft

## Purpose / Use when

Use to assess whether a silent or optionally mixed delivery has the required current evidence and clean provenance.

## Reads

Read current revision, RenderPlan binding, QC, reviews, Preview Approval, Render Manifest, silent master metadata, the actual AudioBrief, the actual selected content-addressed `MUSIC_PROMPT.md`, and—if present—the returned local audio declaration and mix evidence. The AudioBrief and prompt are mandatory for no-track silent delivery as well as optional mixed delivery.

## Writes

None. This module performs no artifact writes.

## Must

- In a future implemented workflow, a silent delivery with no returned local track still requires the actual AudioBrief bytes and `audioBriefHash`, plus the actual selected content-addressed `MUSIC_PROMPT.md` bytes, `promptContentHash`, and `promptAttemptHash`. The prompt artifact must bind to the current AudioBrief hash, approved locked picture, revision, and RenderPlan; naming an interface is not evidence. An explicit no-track choice never bypasses AudioBrief authoring or prompt compilation.
- Bind every delivery statement to one exact project, revision, plan, and evidence set; preserve immutable, content-addressed attempts.
- Keep editable project source by reference and distinguish silent from optional locally mixed delivery.
- Require fresh approval and evidence after any change that invalidates locks or bindings.
- State that render, audio-prompt compilation, alignment, mux, and delivery commands are deferred non-role interfaces not implemented in Part 1. If one is required during Part 1, the orchestrator emits `WorkflowDecision@1.status="blocked"` and transitions to `STOP`; do not fabricate a RoleResult producer or claim `DELIVERY` complete.

## Must not

- Treat a mutable “latest” label as authority, overwrite prior attempts, bypass review/QC/approval, or claim a delivery file was produced without local evidence.
- Promise remote generation, automatic payoff detection, or a clean-room archive not supported by evidence.

## Stop conditions

Stop when evidence is missing, stale, mismatched, or points across revisions/plans; when the actual AudioBrief or selected prompt attempt is absent, stale, or not content-addressed; or on output collision or an undeclared local audio payoff. Whenever Part 1 would need an actual render, prompt compiler, alignment, mux, or delivery tool, the orchestrator emits `WorkflowDecision@1.status="blocked"` and transitions to `STOP`; no role owns that missing-interface result.

## Output schema

None.
