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

## Fixed creative policy

A Beat is a narrative state, not a slide. The default is one Persistent World with stable identity and measurable bridges. The whole film may use a maximum of one zero-duration `chapter-cut`, and only for an honest, documented break with eye-trace evidence. A reviewer decision of `ship` satisfies one review gate; it is not Preview Approval. Explicit human approval is the default.

## Engine implementation status

Every executable facility named by this Prompt OS is a **required interface — not implemented** in Part 1. Do not claim a preview, render, validation, QC pass, revision, audio prompt, mux, or delivery until a later implementation produces verifiable local, hash-bound evidence.
