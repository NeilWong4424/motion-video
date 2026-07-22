# Audio Handoff Workflow

## Purpose / Use when

This is the sole normative audio workflow. Use it only after picture is complete and an audio handoff is requested. It is a documentation interface; its executable interfaces are not implemented in Part 1.

## Reads

Read the exact approved locked silent cut, matching Render Manifest and Preview Approval, current RenderPlan hash/audio view, QC and both `ship` review artifacts, and—after the Sound Designer step—the hash-bound AudioBrief. The picture evidence and AudioBrief must all identify the same project, revision, RenderPlan, fps, duration, preview approval, render manifest, and silent master.

## Writes

None in Part 1. The future deterministic local audio-prompt tool may create a content-addressed `MUSIC_PROMPT.md`; no human role writes or edits it. The orchestrator may invoke and gate that future tool but is not its artifact owner.

## Must

Follow this canonical order only:

1. Approved locked silent cut, with matching Render Manifest, Preview Approval, passing Technical QC, and two `ship` reviews.
2. AudioBrief authored by Sound Designer and bound to that cut's project, revision, RenderPlan, frame rate, duration, Preview Approval hash, Render Manifest hash, silent-master hash, and exactly one payoff cue.
3. `MUSIC_PROMPT.md` compiled by the future deterministic local audio-prompt tool, invoked by the orchestrator and derived only from that AudioBrief plus the same approved locked-picture bindings. Store the result as an immutable, content-addressed attempt; no role may hand-edit it.
4. Stop so the user manually operates a third-party music generator with the provider-neutral paste block.
5. If the user returns a local track, require a `ManualAudioReturn@1` with the exact selected `promptAttemptHash`, `promptContentHash`, canonical attempt path, source label, user-declared payoff, and gain.
6. Future local alignment and mux interface, bound to the returned track and the same locked picture.
7. Delivery evidence for the silent or optionally mixed result.

No-track silent delivery follows the same first three steps: it requires the actual AudioBrief with `audioBriefHash` and the actual content-addressed `MUSIC_PROMPT.md` with `promptContentHash` and `promptAttemptHash` before the user may select no returned track. An explicit silent selection never bypasses either artifact.

The future paste block is capped at 4,000 characters. Recheck all bindings after any visual revision; stale AudioBriefs, prompt documents, tracks, or approvals cannot be reused. If the audio-prompt tool is unavailable, the completed AudioBrief and Sound Designer's `RoleResult@1` with `status: "written"` remain valid; the orchestrator records the unavailable non-role interface as `WorkflowDecision@1` with `status: "blocked"` and transitions from `AUDIO_PROMPT` to `STOP`. If the user has no third-party generator, stop after an actual prompt artifact exists; this never invalidates or blocks the earlier AudioBrief.

## Must not

- Must not generate music, use a provider-specific integration, use an API flow, generate SFX, or automatically detect the payoff.
- Change visual timing to fit returned audio, contact a third party on the user's behalf, or continue after the manual handoff without a returned local track and user-declared payoff.
- Claim that prompt generation, alignment, or mux has run in Part 1.

## Stop conditions

Stop before AudioBrief when the silent cut or approval evidence is missing/stale. When the deterministic prompt tool is unavailable at `AUDIO_PROMPT`, the orchestrator emits the single blocked `WorkflowDecision@1` and transitions to `STOP`; this does not retroactively block `AUDIO_BRIEF` or alter Sound Designer's prior `written` result. Stop after manual handoff until the user returns a local track with a complete exact-attempt `ManualAudioReturn@1`, or records a no-track choice only after the actual AudioBrief and content-addressed prompt exist. Stop local alignment when any picture, prompt-attempt, or audio binding differs; reload the selected attempt rather than trusting a label or “latest” pointer. In Part 1, a request to actually compile the prompt, align, mux, render, or deliver stops at the named unavailable non-role interface without fabricating a RoleResult or success artifact.

## Output schema

Future only: `MusicPromptDocument { audioBriefHash, promptBlock, markdown, cutPayoffFrame, cutPayoffSeconds }`, where `promptBlock` is at most 4,000 characters. This interface is not implemented in Part 1.
