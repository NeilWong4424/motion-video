# Deterministic engine interface boundary

## Engine implementation status

Every interface below is a **required interface — not implemented** in Part 1. This document defines preconditions, success outputs, and refusal behavior only. It provides no CLI syntax, runtime stub, dependency, fake result, or claim that a preview/render can be produced. No missing interface may be treated as successful.

| Future deterministic interface | Required input | Success outcome/evidence | Refusal outcome |
|---|---|---|---|
| Canonical source hashing and validation | Brief, Treatment, MotionSpec, current revision state, locks, and declared local assets | Structured diagnostics and canonical input/lock hashes | Refuse invalid schemas/references, remote paths, missing rights, parent mismatch, untrusted instruction expansion, or continuity violations |
| Initial snapshot | Valid source set with `currentRevisionId: null` | Immutable `rev-0001` source identity | Refuse any existing revision, invalid source, or second snapshot attempt |
| Semantic revision apply | Current revision plus hash-bound `SemanticPatch@1` | New revision, actual impact, preserved locks, and invalidation set | Refuse stale source/lock hashes, direct-index targets, lock conflict/evasion, undeclared impact, disguised rebuild, invalid cause, stale/missing review issue IDs, or mismatched repair cycle |
| Resolver/compiler | Valid current snapshotted source and closed capability registry | ResolvedMotionIR and canonical RenderPlan with implementation identity | Refuse null/stale revision, unknown capability, fallback layout, nondeterministic resource, or capability proposal that is not implemented |
| Preview/evidence renderer | Current RenderPlan and declared profile | Exact preview bytes/hash plus sampled establishment/midpoint/settle/seam/held frames/scans and a content-hashed evidence manifest | Refuse missing/stale plan, incomplete profile, nondeterministic input, or output collision |
| Technical QC | Exact `PreviewEvidenceTuple@1` | Hash-bound complete report and `pass` or blocking decision | Refuse missing/mismatched preview or sampled evidence, unverifiable handoff, or incomplete scan set; a blocking/incomplete result cannot advance to reviews |
| Approval recorder | Attributed approval decision and reason, exact project/revision, RenderPlan, preview, sampled evidence, passing QC, both completed reviews, and current `ProjectPolicy@1` | `PreviewApproval@1` containing the complete `ApprovalTuple@1`, recorder identity, parent hashes, canonical content hash | Refuse missing, stale, incomplete, non-`ship`, unauthorized-host, empty-reason, policy-hash mismatch, actor mismatch, or replaced review/QC/evidence bytes |
| Silent final renderer | Current RenderPlan and exact `PreviewApproval@1` plus every dependency in its Approval tuple | Silent master bytes/hash and matching `RenderManifestArtifact` bound to approval, plan, build, and render profile | Refuse any missing/stale approval dependency, changed policy/review/QC/preview evidence, non-`ship` review, or reviewer `ship` without recorded approval |
| Audio-prompt generator | Current AudioBrief bound to exact locked-picture tuple | Immutable content-addressed `MusicPromptAttempt@1`, `MUSIC_PROMPT.md` capped at 4,000 characters, cue reference, and exact attempt path | Refuse stale picture/approval/Render Manifest, invalid payoff, incomplete AudioBrief bindings, or output collision |
| Local alignment/mux | Matching silent master/Render Manifest plus current prompt/AudioBrief and exact-attempt `ManualAudioReturn@1` | Time-shifted local mix, alignment evidence, and content-addressed mux manifest without picture change | Reload the declared attempt; refuse missing/mismatched `promptAttemptHash`, `promptContentHash`, attempt path, source label, payoff, or gain; insufficient coverage; picture retiming; stale binding; or cross-attempt selection |
| Delivery packager | Current approved locked-picture tuple, actual AudioBrief, actual selected content-addressed prompt-attempt evidence, and explicit current silent/mux selection | Content-addressed delivery manifest and declared package | Refuse missing/stale AudioBrief or prompt attempt, cross-revision/plan selection, unresolved blocker, or changed Render Manifest/post-lock audio hash |

Every refusal produces structured diagnostics and returns control to `STOP` or the one legal semantic-repair route. It never writes the advertised success artifact.

## Approval recorder contract

The Approval recorder is a future deterministic required interface and the only writer of:

`out/<project-id>/<revision-id>/<render-plan-hash>/approval/preview-approval.json`

Its release dependency chain is passing QC, both review hashes with `ship`, and the current policy hash; none may be inferred from a lineage label.

On every attempt it reloads, rather than trusts caller summaries of:

1. the exact current project and `revisionId`, its Brief/Treatment/Motion source hashes, and `renderPlanHash`;
2. exact preview bytes/`previewHash` and sampled evidence manifest/`sampledEvidenceManifestHash`;
3. a complete passing Technical QC report and `technicalQcHash` for that tuple;
4. both producer-correct completed review envelopes, their canonical content hashes, evidence hashes, and decisions equal to `ship`;
5. the user-owned `projects/<project-id>/project.policy.json`, its `policyHash`, and the attributed decision `{actorType, actorId, reason}`.

Human is the policy default. A configured host is eligible only when the user explicitly enabled host opt-in and listed that exact host ID in the reloaded policy. The recorder binds project/revision, source hashes, RenderPlan, preview, sampled evidence, passing QC hash, both `ship` review hashes, actor/type/ID, non-empty reason, and Project Policy hash into `PreviewApproval@1`. It refuses stale or incomplete evidence, any non-`ship` review, producer/path mismatch, changed bytes under the same plan, missing policy, inferred host opt-in, or caller-supplied hashes that do not match reloaded bytes.

The recorder records authority; it does not create it. It performs no review, creative decision, source edit, render, or policy write.

## Exact staleness verification

The normative tuple definitions are in `artifact-contracts.md`. At each interface the producer reloads and verifies the complete applicable tuple:

- Technical QC: revision/source + RenderPlan + exact preview bytes/hash + sampled evidence manifest and member hashes.
- Reviews: the Technical QC tuple + QC report hash/pass + review bundle/evidence-ref hashes and strict producer identity.
- Approval recorder: both exact review hashes/`ship` decisions + actor/reason + current Project Policy hash.
- Silent final: the whole Approval tuple + Preview Approval bytes/hash; its Render Manifest binds exact silent-master bytes/hash and RenderPlan/build/profile identity.
- Audio prompt, alignment/mux, and delivery: exact Preview Approval hash + Render Manifest hash + silent-master hash, followed by required AudioBrief, `promptContentHash`, `promptAttemptHash`, and each applicable exact-attempt manual-return/alignment/mux hash.

The audio-prompt success path is exactly `out/<project-id>/<revision-id>/<render-plan-hash>/audio/<audioBriefHash>/prompts/<prompt-attempt-hash>/MUSIC_PROMPT.md` plus sibling `prompt-attempt.json`. The attempt schema and hash projection are defined in `artifact-contracts.md`. Naming that path without both actual matching files is not success.

Any bound byte/hash change is stale even for the same `revisionId` and the same `renderPlanHash`. A newly encoded preview, replaced sampled frame, rewritten QC/review/approval/policy/Render Manifest, or changed post-lock audio artifact must invalidate every dependent result.

## Determinism and runtime constraints

The future compiler must bind canonical source hashes, exact frame timing, capability versions and implementation hashes, registry snapshot, engine build identity, and render profiles. The future runtime must evaluate only RenderPlan data at the current frame. Network access, wall-clock time, unseeded randomness, filesystem discovery, remote URLs, arbitrary project imports, hidden fallbacks, and new creative decisions are forbidden.

The intended runtime mounts one Persistent World for the full film, with a global camera over a World Layer and a persistent Screen Layer. Stable node roots and continuity-owned subnodes must not remount during bridges. A true shared element updates one identity's geometry; a split handoff uses the real target preroll, never a hand-made lookalike. Camera movement belongs to the global camera track and boundary transitions belong to bridges.

## Gate semantics

Passing validation is not a preview. A successful render is not release readiness. Technical QC and both cold reviews bind the exact preview, sampled evidence, and RenderPlan. A blocking or incomplete Technical QC result cannot advance to reviews or Preview Gate. Two `ship` decisions are still not Preview Approval. `RECORD_PREVIEW_APPROVAL` must succeed before `APPROVED → SILENT_FINAL`.

The optional audio path never changes picture timing. The user operates the third-party generator manually and declares the returned track's payoff. The future local tool verifies coverage and time-shifts without inferring a musical peak.
