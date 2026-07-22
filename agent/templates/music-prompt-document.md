# Music Prompt Document Template

## Status

This is the required future deterministic interface output format. It is **not implemented** in Part 1. A future local interface derives this document from a hash-bound `AudioBriefArtifact@1`; no human role hand-authors the resulting `MUSIC_PROMPT.md`.

Use only after the approved locked silent cut, matching Preview Approval, Render Manifest, and AudioBrief all bind to the same project, revision, RenderPlan hash, frame rate, and duration. The paste block must be at most 4,000 characters.

## PASTE THIS INTO THE MUSIC GENERATOR

```text
Create an instrumental cue only, exactly {{durationSeconds}} seconds long.

Style: {{style}}
Instrumentation: {{instrumentation}}
Tempo and key guidance: {{tempoKey}}
Hook or signature idea: {{hook}}
Cue structure, timed to the locked picture: {{cueStructure}}
Dynamic contour: {{dynamics}}
Single visual payoff alignment: {{payoffTiming}}
Stinger guidance: {{stinger}}

Avoid: {{exclude}}
Do not include vocals, spoken words, dialogue, or sound effects. Keep the cue continuous and support the locked visual timing without changing its duration.
```

The future interface must count this paste block and refuse output over 4,000 characters. The user manually uses the resulting block, then may return a local track with a `ManualAudioReturn@1` that selects this exact sibling prompt attempt plus a source label, gain, and user-declared payoff time. Nothing in this template performs that work.

## Motion cue reference — do not paste

- Cut binding: project `{{projectId}}`, revision `{{revisionId}}`, RenderPlan `{{renderPlanHash}}`
- Parent bindings: AudioBrief `{{audioBriefHash}}`, Preview Approval `{{previewApprovalHash}}`, Render Manifest `{{renderManifestHash}}`, silent master `{{silentMasterHash}}`
- Timing: `{{fps}}` fps, `{{durationInFrames}}` frames, payoff at frame `{{payoffFrame}}` / `{{payoffSeconds}}` seconds
- Continuous motion events: `{{motionCueReference}}`
- Manual SFX production notes: `{{sfxNotes}}`

This reference preserves the locked-cut context for human checking. It is not generator-facing content and must remain outside the paste block. The sibling `prompt-attempt.json` records its sole stored attempt identity as `contentHash` and records the Markdown-byte identity as `promptContentHash`. It does not store a second `promptAttemptHash` field: outside the envelope, `promptAttemptHash` is the path/selection alias equal to `contentHash`. None of these hashes is embedded into this Markdown because the attempt identity depends on the completed Markdown bytes and must not become self-referential.
