---
name: video
description: Route a local pure-code 2D motion request into the repository's canonical Prompt OS workflow.
argument-hint: <brief>
---

# Video workflow adapter

For `/video <brief>`, preserve `<brief>` verbatim and read [`../../../agent/video-workflow.md`](../../../agent/video-workflow.md). Create only an ephemeral `WorkflowInvocation` containing `host: "claude-code"`, `invocation: "/video"`, the user request, an optional requested project ID, and user-supplied local paths. This adapter writes no canonical artifact.

If the payload has no usable goal, stop and ask for one. Otherwise let the canonical workflow own all routing and gates.

This repository supports local, deterministic, pure-code 2D motion only. Use user-supplied local sources. There is no API key workflow, remote model/media integration, web product, or repository network dependency. Do not use AI-generated video, AI-generated image, stock footage, or generated footage as the visual substrate. Do not invent a skill-specific creative, revision, approval, or audio path, and do not claim an engine action or result without current local evidence.
