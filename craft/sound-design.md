# Sound Design Craft

## Purpose / Use when

Use only to describe music language and cue intent for an already approved locked silent cut. The canonical process is [`../docs/workflows/audio-handoff.md`](../docs/workflows/audio-handoff.md); this document deliberately does not restate its order.

## Reads

For first-time AudioBrief authoring, read the current approved locked silent cut and its matching plan/approval/review/QC/master/manifest bindings, motion cues, Brief/Treatment tone, and the canonical audio handoff. Read an existing AudioBrief only in the explicit later branch where the orchestrator is checking or regenerating a stale/missing deterministic prompt document; never make an AudioBrief a precondition for authoring itself.

## Writes

None. This module performs no artifact writes.

## Must

- Describe tone, instrumentation, tempo/key guidance, dynamics, exclusions, and cue language in relation to continuous visual events: reveal, travel, morph, payoff, and resolve.
- Make the role-owned AudioBrief declare exactly one payoff cue as the alignment anchor; keep manual SFX notes descriptive rather than generative.
- Follow the linked canonical workflow and stop at its manual handoff boundary.
- Treat `MUSIC_PROMPT.md` as a future deterministic local interface, not implemented in Part 1. After Sound Designer returns `written` for a valid AudioBrief, an unavailable prompt compiler is recorded only by the orchestrator as `WorkflowDecision@1.status="blocked"`, followed by `STOP`.
- Treat the absence of the future deterministic audio-prompt generator as blocking `AUDIO_PROMPT`, not `AUDIO_BRIEF`: a valid AudioBrief may still be authored and handed to the orchestrator when all locked-picture evidence exists. If only the user-selected third-party music generator is unavailable, an actual future prompt document may still exist, but manual music generation cannot continue.

## Must not

- Must not generate music, select a provider, initiate a remote workflow, synthesize SFX, automatically detect a payoff, or alter picture timing.
- Create a second audio order or turn cue language into an approval bypass.

## Stop conditions

Stop AudioBrief authoring when picture approval or a required hash binding is missing/stale, cue timing is stale, or payoff count is not exactly one. After a valid AudioBrief handoff, preserve Sound Designer's `written` result; if `MUSIC_PROMPT.md` cannot be compiled, the orchestrator emits the sole blocked WorkflowDecision and stops. If it can be compiled in a future implementation, stop when the canonical workflow reaches manual user action.

## Output schema

None.
