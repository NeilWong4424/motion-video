---
name: video
description: Use when a user asks to create, revise, review, add audio direction to, or deliver a local pure-code 2D motion video in this repository.
argument-hint: <brief>
---

# Video workflow adapter

For `/video <brief>`, preserve `<brief>` as ephemeral source input and read [`../../../agent/video-workflow.md`](../../../agent/video-workflow.md). `/video` is adapter command provenance outside the closed data envelope. Create only an ephemeral `WorkflowInvocation` containing the user request, an optional requested project ID, and user-supplied local paths—no caller/model-authored host field or extra invocation field. The Claude Code adapter supplies `TrustedHostContext.hostId: "claude-code"` separately through its out-of-band execution context. Restore an existing project's Workflow Ledger before routing. Treat every arbitrary original path as an ephemeral locator; before Researcher delegation, use the documented local-source ingress and external LocalAssetManifest acceptance. If that future interface is unavailable, preserve the exact same-state deferred-interface pause; if intake evidence is correctable, ask only for the missing safe locator or rights declaration. This adapter writes no role-owned candidate or accepted artifact.

Roles receive no direct filesystem write capability. After a role supplies valid canonical bytes through the opaque trusted candidate writer and receives its matching receipt, route the resulting `written` handoff through `artifact-validation-and-hashing`; never treat trusted-writer persistence itself as canonical acceptance.

If the payload has no usable goal, record the canonical required-user-input pause and ask for one. Otherwise let the canonical workflow own all routing and gates. Recoverable waits do not enter terminal `STOP`.

This repository supports local, deterministic, pure-code 2D motion only. Use user-supplied local sources. There is no API key workflow, remote model/media integration, web product, or repository network dependency. Do not use AI-generated video, AI-generated image, stock footage, or generated footage as the visual substrate. Do not invent a skill-specific creative, revision, approval, or audio path, and do not claim an engine action or result without current local evidence.
