# Audio Handoff Workflow

## Purpose / Use when

This is the sole audio workflow. It begins only after the current silent picture is approved, locked, rendered, and bound to passing QC and both accepted `ship` reviews. The repository never generates music or contacts a provider. It produces provider-neutral instrumental direction for the user to paste manually into a third-party music generator.

All prompt generation, ingress, mux, and delivery interfaces are documentation requirements in Part 1, not executable features.

## Reads

Read the exact current project/revision/RenderPlan identities, preview approval hash, silent-master hash, Render Manifest hash, passing QC, accepted creative and motion review hashes, frame rate, duration, and current motion cues. After Sound Designer runs, read only the externally accepted AudioBrief bound to that same locked-picture tuple.

## Writes

- Sound Designer may write one immutable `AudioBriefArtifact@1` candidate beneath `.workflow/candidates/<request-id>/<candidate-attempt-id>/audio-brief.json`; it does not write `MUSIC_PROMPT.md`.
- The future deterministic `audio-prompt-generator` writes one immutable, content-addressed prompt attempt containing the complete exact `MUSIC_PROMPT.md` bytes and `prompt-attempt.json`.
- The future `manual-audio-ingress` interface may stage one exact user-returned local track and write `ManualAudioReturn@1` after rights and binding checks.
- Future local mux and delivery interfaces may write only their declared output-lineage manifests/media.

## Required order

1. Verify the approved locked silent cut: Preview Approval, Render Manifest, silent master, passing Technical QC, and both accepted `ship` reviews all bind the same project, revision, RenderPlan, preview, fps, and duration.
2. Delegate `AUDIO_BRIEF` to Sound Designer. Require provider-neutral instrumental direction, exactly one payoff cue, no vocals/dialogue/synthetic voice, and complete locked-picture bindings. Route the role's immutable candidate through artifact acceptance.
3. In `AUDIO_PROMPT`, invoke only the deterministic `audio-prompt-generator`. It projects the accepted AudioBrief through [`music-prompt-document.md`](../../agent/templates/music-prompt-document.md); the AudioBrief is the sole semantic source. The template defines the complete file from its first byte through its final LF. No role, orchestrator, chat text, MotionCue, or provider hint may supplement or hand-edit those bytes.
4. Store `MUSIC_PROMPT.md` and `prompt-attempt.json` under the content-addressed attempt directory. `promptContentHash` identifies the exact Markdown bytes. The attempt envelope's external/path alias `promptAttemptHash` equals its `contentHash`; changed prompt bytes, parents, template/compiler versions, or projection rules create a new immutable attempt.
5. Only successful prompt generation enters `WAITING_FOR_MANUAL_MUSIC` and records a `manual-music-generation` pause. The user manually copies the provider-neutral paste block to a third-party music generator. The repository sends nothing and uses no API key.
6. The user chooses one of two exact resume paths:
   - Return track: create one separately supplied ephemeral locator envelope; record `ManualAudioIngressRequest` against the current pause with only its locator ID/envelope hash plus the exact prompt attempt, source label, rights statement, user-declared payoff time, gain, actor, and reason. Then pass both envelopes to `manual-audio-ingress`. The raw host locator never enters the Ledger.
   - No track: record `NoTrackSelection` bound to the actual accepted AudioBrief and actual prompt attempt, then package silent delivery with `audioStatus=not-provided`.
7. Manual audio ingress verifies the durable locator ID/envelope hash against the separately supplied ephemeral locator, reads only that exact file, validates its format from the same opened handle, and stages exact bytes at `projects/<project-id>/audio/manual/<track-content-hash>/track.<verified-audio-extension>`. The fixed extension comes from decoded content, never the original basename. Source and destination use anchored no-follow, same-handle/exclusive-create checks; the ephemeral envelope, host locator, and basename enter no event, candidate, diagnostic, receipt, or return.
8. Before optional local alignment/mux, reload and hash `prompt-attempt.json`, sibling `MUSIC_PROMPT.md`, returned track, and locked-picture evidence. Require every project/revision/RenderPlan/AudioBrief/prompt/picture binding to match. `trackPayoffSeconds` is the human declaration, never inferred automatically. Picture timing remains locked.
9. Delivery packages either the unchanged silent master or the locally mixed result with exact manifests and identities.

Audio re-entry is lineage-resetting, not a pointer switch. A new `audio-request` against an already completed or stopped locked picture atomically invalidates the current AudioBrief, prompt attempt, manual return, alignment, mux, mixed master, and delivery identities before `AUDIO_BRIEF`. A newly accepted AudioBrief replaces and records the old AudioBrief identity and invalidates prompt/manual/mux/delivery descendants; a new prompt, manual return, or mux likewise records its replaced head and invalidates its exact downstream suffix. A `manual-audio-reselect` recovery clears the complete manual-through-delivery suffix before returning to manual wait, and a delivery retry clears the exact suffix implied by its earliest target. Superseded immutable files remain historical only. Therefore switching from a previous mixed delivery to a new no-track selection is legal only after all four current fields—manual return, alignment, mux manifest, and mixed master—are null and the new AudioBrief/prompt attempt are current.

## Deterministic prompt rules

- The exact provider paste block is capped at 4,000 Unicode scalar values after the template's specified normalization/substitution. Oversize input refuses; it is never silently truncated.
- `MusicPromptAttempt@1.parentHashes` is the named object `{audioBriefHash, previewApprovalHash, renderManifestHash, silentMasterHash}` and duplicates the matching top-level bindings exactly.
- The prompt attempt is immutable. There is no mutable `latest` pointer and no second stored attempt-identity field.
- A later visual revision invalidates the AudioBrief, prompt attempt, returned track, mux, and delivery lineage. None may be relabeled for a new cut.

## Pause and refusal conditions

If `audio-prompt-generator` is unavailable, preserve a deferred-interface pause in `AUDIO_PROMPT`; do not enter `STOP`, invent prompt bytes, or claim manual handoff occurred. After successful generation, remain in `WAITING_FOR_MANUAL_MUSIC` until an exact return-track request, exact no-track choice, or explicit abandonment is recorded. An unavailable ingress/mux/delivery interface likewise pauses in its current state with the same input binding.

Refuse stale picture evidence, missing acceptance, mismatched prompt attempt, unsafe locator, absent/insufficient rights, unsupported audio bytes, invented payoff analysis, provider-specific/API instructions, vocals/spoken content, or any request to retime picture around music. Terminal `STOP` is reserved for a genuinely non-resumable current request or explicit abandonment.

## Must not

- Generate music, SFX, voice, images, or video; call a third party; use credentials; fetch remote files; or select a provider.
- Let Sound Designer or the orchestrator author/edit `MUSIC_PROMPT.md`.
- Accept a raw external path as canonical audio evidence, follow embedded links, recurse directories, expand globs, or trust a mutable filename.
- Align track A under prompt attempt B, infer audio peaks, or mutate plan-addressed visual files.
- Retime, recut, or otherwise change the locked visual picture to fit returned music.
- Claim prompt generation, ingress, alignment, mux, or delivery ran in Part 1.

## Output schemas

The closed attempt and manual-ingress shapes are defined in [`artifact-contracts.md`](../../agent/contracts/artifact-contracts.md); pause and operator-input rules are defined in [`workflow-ledger.md`](../../agent/contracts/workflow-ledger.md). Part 1 supplies the Sound Designer prompt and deterministic document contract only.
