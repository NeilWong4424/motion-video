# Local Text-to-Motion Prompt OS

This repository is a local, continuity-first text-to-motion system in two coexisting layers. **Part 1** is the documentation layer: Codex or Claude Code interprets a request through [`agent/video-workflow.md`](agent/video-workflow.md), role prompts own narrowly defined artifacts, and craft documents constrain decisions. **Part 2** is the deterministic motion engine those contracts describe — now implemented in [`src/`](src/) and driven by the `motion` CLI. The films are deterministic, pure-code 2D motion built from text, shapes, paths, diagrams, data, UI, logos, and supported user-supplied local assets.

> **Reading order note.** The next two sections ("Part 1 boundary" and "Engine implementation status") describe Part 1's *original* boundary, when no engine existed. That boundary has since been crossed: the engine is real. Those sections are kept for provenance — see [**Part 2 — the motion engine**](#part-2--the-motion-engine-implemented) below for the current, executable state.

The repository itself does not contain or invoke a model. It does not ask for credentials, call remote media services, generate or fetch image/video substrate, or provide a hosted application. Human conversation in Codex or Claude Code is the interface.

## Part 1 boundary (historical)

This describes the **original Part 1 phase**, before the engine was built. At that time the repository defined prompts, workflow states, authority, artifacts, a checked-in planning-only core catalog, diagnostics, and *future* deterministic interfaces, and contained no Remotion runtime, capability implementation, resolver, compiler, renderer, QC implementation, revision engine, audio tool, delivery tool, or CLI. Those facilities now exist in [`src/`](src/); catalog entries marked `part2-required` are the contracts the engine implements. Kept here for provenance — see [Part 2](#part-2--the-motion-engine-implemented) for what runs today.

## Start here

- Codex reads [`AGENTS.md`](AGENTS.md).
- Claude Code reads [`CLAUDE.md`](CLAUDE.md); `/video` also routes through [`.claude/skills/video/SKILL.md`](.claude/skills/video/SKILL.md).
- Both hosts then follow [`agent/video-workflow.md`](agent/video-workflow.md).
- [`agent/prompt-manifest.json`](agent/prompt-manifest.json) is the machine entrypoint for the exhaustive contract, interface, role, and execution-resource inventories. Its `resources` scope is explicit: every non-role file directly loaded as a normative procedure, canonical data file, deterministic document template, or operator project template. Explanatory maps, reports, and examples are documentation rather than execution resources; individual craft files are exhaustively indexed by `craft/skill-manifest.json`.
- Recoverable local state and exact re-entry are defined in [`agent/contracts/workflow-ledger.md`](agent/contracts/workflow-ledger.md).
- Ownership and handoffs are defined in [`agent/contracts/authority-matrix.md`](agent/contracts/authority-matrix.md), [`agent/contracts/artifact-acceptance.md`](agent/contracts/artifact-acceptance.md), and [`agent/contracts/artifact-contracts.md`](agent/contracts/artifact-contracts.md).
- Cold-start motion profiles, style packs, and capability IDs are locally closed by [`agent/contracts/catalog-registry-contract.md`](agent/contracts/catalog-registry-contract.md) and [`catalog/core-registry.json`](catalog/core-registry.json); the Part 2 engine implements them for render.

## Operator experience

For a fast request, tell Codex what film you want in one sentence, or run `/video <brief>` in Claude Code. The Brief Planner records safe creative assumptions but stops on missing facts that could make the film false, unusable, or unlicensed.

If omitted, Fast input uses explicit, overridable production assumptions: `1920×1080`, 30 fps, and 20 seconds. A missing project ID is resolved locally from the supplied title with a lowercase slug and the first-free `-2`, `-3`, … suffix. The suffix receives its own length budget, so every final ID satisfies the same 64-character invariant. Allocation never uses time, randomness, an account, or a remote service. These are production settings, not product facts.

For controlled work, create a local `projects/<project-id>/` folder from the files in [`projects/_template`](projects/_template):

- `BRIEF_INPUT.md` supports both a one-sentence request and a structured brief.
- `LOCAL_SOURCES.md` helps the human declare each source's kind, visual-generation provenance, requested/allowed uses, rights evidence, attribution, and limits. The canonical manifest is an accepted immutable candidate; arbitrary original host paths remain ephemeral intake locators and staged bytes are content-addressed.
- `REVISION_REQUEST.md` identifies the requested change, locks, and what must stay unchanged.
- `project.policy.example.json` documents the optional policy fields only. An actual policy becomes authoritative only after an attributed `ProjectPolicyIngressRequest`, immutable candidate projection, and external acceptance at Preview Gate; human Preview Approval remains the default.

The user sees one workflow, not a conversation between agents. Internally, the orchestrator restores the local append-only Ledger, records a head-bound decision, delegates immutable candidate authorship only to an artifact-owning role, routes that candidate through external acceptance, selects only relevant craft modules, and either records the next lawful step, a same-state resumable pause, or a terminal outcome. A successful acceptance is embedded atomically in the corresponding `interface-result-recorded` event; it is not a separate Ledger event, and role bytes are not accepted merely because a role wrote them. Capability Builder is the write-free exception: it returns ephemeral advisory guidance and never authors a candidate. See [`docs/PROMPT_OS_MAP.md`](docs/PROMPT_OS_MAP.md) for the complete layer map and [`examples/invocations.md`](examples/invocations.md) for honest Part 1 invocations.

## Prompt layers

| Layer | Responsibility | Cannot do |
| --- | --- | --- |
| Orchestrator | Classify requests, route owners, enforce state/gates, invalidate stale evidence | Design the film or write role-owned artifacts |
| Workflow Ledger | Preserve revision, hashes, locks, counters, pending work, and pauses across host calls | Make creative decisions or become a platform/database |
| Artifact acceptance | Validate canonical bytes, owner, parents, assets, and external identity; embed the result in one atomic interface-result event | Emit a separate acceptance event, change semantic content, or approve it |
| Artifact-owning agent prompts | Author one immutable candidate of their owned artifact type | Accept their own bytes, cross another role's authority, or bypass a gate |
| Capability Builder | Return an ephemeral, write-free capability-gap advisory | Author a candidate, implementation, receipt, registration, or gate artifact |
| Cold reviewers | Evaluate exact hash-bound preview evidence | Repair, approve, or invent missing evidence |
| On-demand craft skills | Supply narrow motion judgment | Own artifacts, state, or implementation |
| Deterministic engine (Part 2, implemented in `src/`) | Validate, resolve, preview, QC, render, revise, and package | Make creative decisions, call a model/network, or bypass the render gate |

## Fixed creative policy

A Beat is a narrative state, not a slide. The default is one Persistent World with stable identity and measurable bridges: five positive-duration continuity families, plus at most one zero-duration `chapter-cut` exception for an honest documented break with eye-trace evidence. A chapter cut is not a sixth positive family. A reviewer decision of `ship` satisfies one review gate; it is not Preview Approval. Explicit human approval is the default. With no accepted current Project Policy, the deterministic effective policy is `implicit-human-only`; it never auto-approves and grants no host authority.

An unresolved capability gap does not authorize code. Capability Builder may advise only; after a separate exact human implementation authorization, the future project-local implementation interface remains resumable in `WAITING_FOR_CAPABILITY_IMPLEMENTATION`, and Motion Planner resumes only from an externally accepted implementation receipt and its bound registry snapshot.

Audio follows one order only: approved and locked silent picture, an externally accepted `AudioBrief`, deterministic future `MUSIC_PROMPT.md`, a `WAITING_FOR_MANUAL_MUSIC` pause while the user manually operates a third-party music generator, safe local ingress for any returned track, then optional local alignment/mux. A user may instead make an exact no-track selection after the prompt exists. The repository does not generate music, contact a provider, or store credentials.

## Verify Part 1

No dependency installation is required for the documentation tests on a supported Node version:

```bash
npm test
```

The suite checks prompt/resource inventory, unique authority, state and gate contracts, continuity behavior, audio handoff, local-only scope, link integrity, valid JSON, and the absence of deferred engine files.

The current completion boundary and independent pressure-review record are in [`docs/PART1_STATUS.md`](docs/PART1_STATUS.md) and [`docs/reviews/PROMPT_PRESSURE_REPORT.md`](docs/reviews/PROMPT_PRESSURE_REPORT.md).

## Engine implementation status

The executable facilities named by this Prompt OS — validation, resolve, preview, QC, revision, render, audio prompt, mux, delivery — are **implemented in Part 2** (see below). The honesty rule still holds: never claim a preview, render, QC pass, revision, or delivery without current local, hash-bound evidence from an actual run. Each derived output is immutable and content-addressed under `out/<id>/<rev>/<plan-hash>/`, and the final render is gated on current QC + both `ship` reviews + an explicit approval bound to the exact plan and preview bytes.

---

# Part 2 — the motion engine (implemented)

Part 2 implements the deterministic engine the Prompt OS describes, in-place
alongside Part 1. The paragraph above records Part 1's original boundary; the
engine now exists and is exercised by an automated gate and a rendered Golden
Film. See [`docs/PART2_STATUS.md`](docs/PART2_STATUS.md) for the full status.

The repository still makes **zero model calls**, holds no API key or credential
architecture, generates no image/video substrate, and keeps music a manual
third-party handoff.

## Requirements

- Node.js `>=24.12 <25`, pnpm `11.7.0` (via `corepack pnpm`), and local
  `ffmpeg` + `ffprobe` on PATH.
- The Remotion headless browser: `pnpm exec remotion browser ensure`.

## Install and gate

```bash
pnpm install
pnpm check   # env + boundary + manifests + Part 1 docs + lint + typecheck + tests
```

`pnpm check` is the release gate: it fails on a wrong toolchain, any
network/secret/nondeterminism boundary violation, a stale capability/engine
manifest, a broken Part 1 doc contract, a lint or type error, or a failing test.

## The video pipeline (CLI)

```text
pnpm motion new <id>          # scaffold a draft project from the template
# edit projects/<id>/brief.spec.json, treatment.json, motion.spec.json
pnpm motion validate <id>     # strict validation + continuity diagnostics
pnpm motion snapshot <id>     # freeze the initial immutable rev-0001
pnpm motion resolve <id>      # -> immutable RenderPlan under out/<id>/<rev>/<hash>/
pnpm motion preview <id>      # low-res silent preview (Remotion browser)
pnpm motion stills <id> --frames 60,300
pnpm motion qc <id>           # technical QC report bound to the plan/preview
# author review/creative-review.json + review/motion-review.json (ship)
pnpm motion approve <id> --reviewed-plan <hash> --actor human --reason "..."
pnpm motion render <id>       # gated final silent master (QC + reviews + approval)
pnpm motion revise <id> --patch patch.json --apply   # new revision via SemanticPatch
pnpm audio:prompt -- --brief audio-brief.json        # deterministic MUSIC_PROMPT.md
```

Every derived output is immutable and content-addressed; a changed plan gets a
new directory. Final render is impossible without current QC, both `ship`
reviews, and an explicit approval bound to the exact plan and preview bytes.

## Worked films

`projects/golden-continuity` is a committed 20-second, 600-frame continuity-first
film (keyword → product card → dashboard → chart → brand). It resolves,
compiles, renders through the real Remotion browser, and passes technical QC —
proving the seamless kernel reads as one evolving idea, not slides.

`projects/world-cup-2026-format` is a 20-second explainer of the expanded 2026
tournament — one persistent field of team-dots that re-forms rather than resets:
48 teams → 12 groups of 4 → 32 advance → 104 matches / 1 champion. It uses
original tournament styling only (no FIFA marks), and was carried the full route:
authored specs → validate → snapshot → resolve → preview → a `replace-motion-spec`
rebuild (rev-0002) that fixed per-beat captions and paint order → QC pass → both
`ship` reviews → human approval → gated final render.
