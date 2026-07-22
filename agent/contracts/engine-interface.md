# Deterministic engine interface boundary

## Engine implementation status

Every interface below is a **required interface — not implemented** in Part 1. This document defines preconditions, outputs, and refusal behavior only. It provides no CLI syntax, runtime stub, dependency, fake result, or claim that a preview/render can be produced.

| Interface | Required input | Required output/evidence | Must refuse |
|---|---|---|---|
| Source validation | Brief, Treatment, MotionSpec and declared local assets | Structured diagnostics and canonical input hashes | Invalid schemas/references, remote paths, missing rights, parent mismatch, continuity violations |
| Initial snapshot | Valid source set with `currentRevisionId: null` | Immutable `rev-0001` source identity | Any existing revision or invalid source |
| Semantic revision apply | Current revision plus hash-bound `SemanticPatch@1` | New revision, actual impact, preserved locks, invalidation set | Stale hashes, direct-index targets, lock conflicts, undeclared impact, disguised rebuild |
| Resolver/compiler | Valid snapshotted source and closed capability registry | ResolvedMotionIR and canonical RenderPlan with implementation identity | Null/stale revision, unknown capability, fallback layout, nondeterministic resource |
| Preview/evidence renderer | Current RenderPlan and declared profile | Low-resolution preview plus establishment/midpoint/settle/seam/held frames and manifest | Missing/stale plan or output collision |
| Technical QC | RenderPlan and matching rendered evidence | Hash-bound report, diagnostics, release decision | Missing/mismatched evidence or unverifiable handoff |
| Silent final renderer | Current RenderPlan, passing QC, both current reviews, exact Preview Approval | Silent master and matching Render Manifest | Any missing/stale gate; reviewer `ship` alone |
| Audio-prompt generator | Current AudioBrief bound to approved locked picture | Tool-agnostic `MUSIC_PROMPT.md` capped at 4,000 characters and cue reference | Stale picture/approval/manifest or invalid payoff |
| Local alignment/mux | Matching silent master/manifest plus `ManualAudioReturn` | Time-shifted local mix, alignment evidence, content-addressed manifest | Missing source label/payoff/gain, insufficient coverage, picture retiming, stale binding |
| Delivery packager | Current approved lineage and selected silent/mix status | Content-addressed delivery manifest and declared package | Missing/stale artifact, cross-revision selection, unresolved blocker |

## Determinism and runtime constraints

The future compiler must bind canonical source hashes, exact frame timing, capability versions and implementation hashes, registry snapshot, engine build identity, and render profiles. The future runtime must evaluate only RenderPlan data at the current frame. Network access, wall-clock time, unseeded randomness, filesystem discovery, remote URLs, arbitrary project imports, hidden fallbacks, and new creative decisions are forbidden.

The intended runtime mounts one Persistent World for the full film, with a global camera over a World Layer and a persistent Screen Layer. Stable node roots and continuity-owned subnodes must not remount during bridges. A true shared element updates one identity's geometry; a split handoff uses the real target preroll, never a hand-made lookalike. Camera movement belongs to the global camera track and boundary transitions belong to bridges.

## Gate semantics

Passing validation is not a preview. A successful render is not release readiness. Technical QC and both cold reviews must bind the exact preview and RenderPlan. Two `ship` decisions are still not Preview Approval. Human approval is the default. Any plan/source change invalidates all downstream release and audio evidence.

The optional audio path never changes picture timing. The user operates the third-party generator manually and declares the returned track's payoff. The future local tool verifies coverage and time-shifts without inferring a musical peak.
