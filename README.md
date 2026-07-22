# Local Text-to-Motion Prompt OS

Part 1 is the documentation layer for a local, continuity-first text-to-motion compiler. Codex or Claude Code interprets a request through [`agent/video-workflow.md`](agent/video-workflow.md); role prompts own narrowly defined artifacts; craft documents constrain decisions. The intended films are deterministic, pure-code 2D motion built from text, shapes, paths, diagrams, data, UI, logos, and supported user-supplied local assets.

The repository itself does not contain or invoke a model. It does not ask for credentials, call remote media services, generate or fetch image/video substrate, or provide a hosted application. Human conversation in Codex or Claude Code is the interface.

## Part 1 boundary

This phase defines prompts, workflow states, authority, artifacts, diagnostics, and future deterministic interfaces. It contains no Remotion runtime, resolver, compiler, renderer, QC implementation, revision engine, audio tool, delivery tool, or CLI. Interface names in these documents are requirements for later work, not executable features or evidence that output exists.

## Start here

- Codex reads [`AGENTS.md`](AGENTS.md).
- Claude Code reads [`CLAUDE.md`](CLAUDE.md); `/video` also routes through [`.claude/skills/video/SKILL.md`](.claude/skills/video/SKILL.md).
- Both hosts then follow [`agent/video-workflow.md`](agent/video-workflow.md).
- Ownership and handoffs are defined in [`agent/contracts/authority-matrix.md`](agent/contracts/authority-matrix.md) and [`agent/contracts/artifact-contracts.md`](agent/contracts/artifact-contracts.md).

## Operator experience

For a fast request, tell Codex what film you want in one sentence, or run `/video <brief>` in Claude Code. The Brief Planner records safe creative assumptions but stops on missing facts that could make the film false, unusable, or unlicensed.

If omitted, Fast input uses explicit, overridable production assumptions: `1920×1080`, 30 fps, and 20 seconds. A missing project ID is resolved locally from the supplied title with a lowercase slug and the first-free `-2`, `-3`, … suffix. The suffix receives its own length budget, so every final ID satisfies the same 64-character invariant. Allocation never uses time, randomness, an account, or a remote service. These are production settings, not product facts.

For controlled work, create a local `projects/<project-id>/` folder from the files in [`projects/_template`](projects/_template):

- `BRIEF_INPUT.md` supports both a one-sentence request and a structured brief.
- `LOCAL_SOURCES.md` records local paths, provenance, rights, and use limits.
- `REVISION_REQUEST.md` identifies the requested change, locks, and what must stay unchanged.
- `project.policy.example.json` documents the optional, explicit host-approval policy; human Preview Approval remains the default.

The user sees one workflow, not a conversation between agents. Internally, the orchestrator inspects current state, delegates one artifact to its owner, selects only relevant craft modules, verifies gate evidence, and either records the next lawful step or returns a typed blocker. See [`docs/PROMPT_OS_MAP.md`](docs/PROMPT_OS_MAP.md) for the complete layer map and [`examples/invocations.md`](examples/invocations.md) for honest Part 1 invocations.

## Prompt layers

| Layer | Responsibility | Cannot do |
| --- | --- | --- |
| Orchestrator | Classify requests, route owners, enforce state/gates, invalidate stale evidence | Design the film or write role-owned artifacts |
| Agent prompts | Author one canonical artifact each | Cross another role's authority or bypass a gate |
| Cold reviewers | Evaluate exact hash-bound preview evidence | Repair, approve, or invent missing evidence |
| On-demand craft skills | Supply narrow motion judgment | Own artifacts, state, or implementation |
| Future deterministic engine | Validate, resolve, preview, QC, render, revise, and package | Exists only in Part 2 |

## Fixed creative policy

A Beat is a narrative state, not a slide. The default is one Persistent World with stable identity and measurable bridges. The whole film may use a maximum of one zero-duration `chapter-cut`, and only for an honest, documented break with eye-trace evidence. A reviewer decision of `ship` satisfies one review gate; it is not Preview Approval. Explicit human approval is the default.

Audio follows one order only: approved and locked silent picture, `AudioBrief`, deterministic future `MUSIC_PROMPT.md`, manual use of a third-party music generator by the user, then optional local alignment/mux. The repository does not generate music, contact a provider, or store credentials.

## Verify Part 1

No dependency installation is required for the documentation tests on a supported Node version:

```bash
npm test
```

The suite checks prompt inventory, unique authority, state and gate contracts, continuity behavior, audio handoff, local-only scope, link integrity, valid JSON, and the absence of deferred engine files.

The current completion boundary and independent pressure-review record are in [`docs/PART1_STATUS.md`](docs/PART1_STATUS.md) and [`docs/reviews/PROMPT_PRESSURE_REPORT.md`](docs/reviews/PROMPT_PRESSURE_REPORT.md).

## Engine implementation status

Every executable facility named by this Prompt OS is a **required interface — not implemented** in Part 1. Do not claim a preview, render, validation, QC pass, revision, audio prompt, mux, or delivery until a later implementation produces verifiable local, hash-bound evidence.
