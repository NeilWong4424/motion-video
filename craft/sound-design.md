# Sound Design Craft

## Purpose / Use when

Use only to describe music language and cue intent for an already approved locked silent cut. The canonical process is [`../docs/workflows/audio-handoff.md`](../docs/workflows/audio-handoff.md); this document deliberately does not restate its order.

## Reads

Read the current approved locked silent cut evidence, matching AudioBrief context, motion cues, Brief/Treatment tone, and the canonical audio handoff.

## Writes

None. This module performs no artifact writes.

## Must

- Describe tone, instrumentation, tempo/key guidance, dynamics, exclusions, and cue language in relation to continuous visual events: reveal, travel, morph, payoff, and resolve.
- Identify exactly one payoff anchor already declared by the user-facing audio brief; keep manual SFX notes descriptive rather than generative.
- Follow the linked canonical workflow and stop at its manual handoff boundary.
- Treat `MUSIC_PROMPT.md` as a future deterministic local interface, not implemented in Part 1.

## Must not

- Must not generate music, select a provider, initiate a remote workflow, synthesize SFX, automatically detect a payoff, or alter picture timing.
- Create a second audio order or turn cue language into an approval bypass.

## Stop conditions

Stop when picture approval or hash binding is missing/stale, cue timing is stale, payoff count is not exactly one, or the canonical workflow reaches user action.

## Output schema

None.
