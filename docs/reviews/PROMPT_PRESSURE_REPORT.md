# Part 1 Prompt pressure verification

Date: 2026-07-22

## Scope and result

Three independent, read-only pressure-review tracks tested the documentation-only Prompt OS against adversarial scope/truth inputs, continuity/capability/revision edge cases, and review/audio provenance failures. Each reviewer inspected the actual prompt corpus and ran focused plus full static contract tests. Findings were repaired through new contract assertions and re-reviewed.

Final pressure disposition:

- Scope and truth: 0 Critical, 0 Important.
- Continuity, capability gaps, and semantic revision: 0 unresolved Critical or Important in those contracts.
- Review and audio: 0 Critical, 0 Important.
- Current full static suite: 63 passed, 0 failed.

## Scenarios exercised

### Scope, truth, and hostile evidence

- A product ad whose only PDF includes an authority override, an unsupported numerical claim, and an instruction to download content.
- A sparse one-sentence brief with missing production settings but no truth-critical gap.
- A request to add a web dashboard, AI-generated background media, credentials, and a queued multi-user workflow.
- Essential versus nonessential local sources with missing rights declarations.
- Later-stage hostile strings discovered by planners, reviewers, or the audio role rather than only during intake.

Expected behavior is now closed: embedded content remains untrusted evidence; unsupported claims are excluded; essential rights gaps block; nonessential sources may be explicitly quarantined only with zero downstream dependency; quick mode records `1920×1080`, 30 fps, and 20 seconds as overridable assumptions; prohibited product expansion returns `out-of-scope → STOP` without role or interface delegation.

### Continuity, capability gaps, and revision

- A 25-second onboarding-to-dashboard UI tour that would become slide-per-Beat if each state remounted.
- A requested liquid headline-to-object-to-graph transformation absent from the capability registry.
- A bounded Beat retime whose global-frame cascade intersects camera, transition, logo, cue, hold, or derived locks.
- A current review repair versus a direct user-request rebuild.
- A capability proposal that could otherwise be mistaken for implemented or registered code.

The contracts now require one cumulative half-open timeline, one Persistent World, stable node identity, full camera coverage, exactly one bridge per adjacent Beat pair, and at most one justified zero-frame chapter cut. Beat retiming has one deterministic cascade policy, names every transitive child impact, revalidates timing invariants, and blocks on literal or derived locks. Capability gaps use one non-self-referential payload plus a separate attributed route decision; Capability Builder remains a write-free advisory that stops before implementation.

### Review evidence and audio handoff

- Missing midpoint/cut evidence, mismatched bindings, incomplete playback, and a Motion Review watched only at 1.0×.
- A review issue containing an embedded instruction or attempted authority escalation.
- Audio requested before the exact picture tuple is approved and locked.
- The future audio-prompt interface being unavailable after a valid AudioBrief write.
- Silent delivery attempting to skip AudioBrief or the real prompt attempt.
- Two immutable music-prompt attempts where a track generated from attempt A is returned while attempt B is selected.

Completed Creative Review requires an exact full-film 1.0× observation; completed Motion Review requires exact 1.0× and 0.25× observations. Incomplete review can honestly represent missing playback with no missing file. Review evidence binds actual preview/frame bytes and never creates approval. Audio has one order: locked approved silent picture, AudioBrief, deterministic local `MUSIC_PROMPT.md` attempt, manual third-party generation by the user, then optional future local alignment/mux. The prompt byte hash is always `promptContentHash`, and `ManualAudioReturn@1` selects a precise attempt path/hash and must survive local reload and recomputation before use.

## Contract defects closed during pressure testing

| Area | Defect exposed | Closure |
| --- | --- | --- |
| Timeline | Beat retime changed derived global frames without a closed impact/lock policy | Deterministic cascade, exact child targets, derived-lock protection, and invariant revalidation |
| Capability | Gap payload, route authorization, and advisory sequencing drifted | One closed payload, separate hash-bound human route, advisory then explicit implementation stop |
| Treatment | No single closed Treatment schema and an invalid reference example | Central `TreatmentSpec@1` contract and referentially complete example |
| Review | Required playback had no structured evidence; playback-only incomplete was unrepresentable | Bound `PlaybackEvidence`, exact rate sets, and cross-field incomplete invariant |
| Audio ownership | Sound Designer and a later non-role prompt interface could both appear responsible | Sound Designer ends with written AudioBrief; orchestrator alone invokes or blocks the future prompt interface |
| Delivery | Silent output could be interpreted as bypassing the prompt chain | AudioBrief plus actual content-addressed prompt attempt remain mandatory |
| Audio identity | Prompt bytes had two hash names; returned tracks lacked attempt identity | Sole `promptContentHash` plus exact-attempt `ManualAudioReturn@1` |
| Project identity | Derived IDs and collision suffixes could exceed the explicit 64-character domain | One validated `ProjectId` algorithm with per-suffix length budgeting |
| Routing | STOP decisions could name continuing states; non-role success had no legal form; role/state pairs were independent | Closed `delegate`, `invoke-interface`, `advance`, STOP, and complete variants with exact pairs |
| Input trust | Only intake roles had a typed route for later hostile evidence | Required `inputTrustFindings` on every `RoleResult@1` and `WorkflowDecision@1` |

## Evidence and limitations

The verification command is:

```bash
npm test
```

The suite checks inventory, unique authority, route/state closure, local-only scope, typed handoffs, continuity and revision invariants, review provenance, audio attempt identity, JSON validity, Markdown-link integrity, and absence of Part 2 source/runtime files.

This is static prompt-contract evidence, not an end-to-end host execution. No Codex/Claude Code compatibility dry run, schema runtime, resolver, Remotion preview, renderer, Technical QC implementation, revision applier, approval recorder, audio-prompt generator, mux, or delivery packager exists in Part 1. The report therefore does not claim that a video, MP4, review artifact, prompt file, or delivery package was produced.
