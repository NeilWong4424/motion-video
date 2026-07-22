# Audio Handoff Workflow

## Purpose / Use when

This is the sole normative audio workflow. Use it only after picture is complete and an audio handoff is requested. It is a documentation interface; its executable interfaces are not implemented in Part 1.

## Reads

Read the exact approved locked silent cut, matching Render Manifest and Preview Approval, current RenderPlan hash/audio view, QC and review evidence, and the Sound Designer's hash-bound AudioBrief.

## Writes

None in Part 1. The future deterministic local prompt interface may create a content-addressed `MUSIC_PROMPT.md`; no human role writes it.

## Must

Follow this canonical order only:

1. Approved locked silent cut, with matching Render Manifest and Preview Approval.
2. AudioBrief bound to that cut's project, revision, RenderPlan, frame rate, duration, and exactly one payoff cue.
3. Future deterministic local `MUSIC_PROMPT.md` interface, derived from the AudioBrief.
4. Stop so the user manually operates a third-party music generator.
5. If the user returns a local track, require a user-declared payoff and source label.
6. Future local alignment and mux interface, bound to the returned track and the same locked picture.
7. Delivery evidence for the silent or optionally mixed result.

The future paste block is capped at 4,000 characters. Recheck all bindings after any visual revision; stale AudioBriefs, prompt documents, tracks, or approvals cannot be reused.

## Must not

- Must not generate music, use a provider-specific integration, use an API flow, generate SFX, or automatically detect the payoff.
- Change visual timing to fit returned audio, contact a third party on the user's behalf, or continue after the manual handoff without a returned local track and user-declared payoff.
- Claim that prompt generation, alignment, or mux has run in Part 1.

## Stop conditions

Stop before AudioBrief when the silent cut or approval evidence is missing/stale. Stop after handoff until the user returns a local track with a source label and user-declared payoff. Stop local alignment when any picture or audio binding differs.

## Output schema

Future only: `MusicPromptDocument { audioBriefHash, promptBlock, markdown, cutPayoffFrame, cutPayoffSeconds }`, where `promptBlock` is at most 4,000 characters. This interface is not implemented in Part 1.
