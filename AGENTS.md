# Codex entry point

Use [`agent/video-workflow.md`](agent/video-workflow.md) as the sole workflow for every video request. Pass the user's request, any requested project ID, and user-supplied local paths in the ephemeral `WorkflowInvocation`; the Codex adapter supplies `TrustedHostContext.hostId: "codex"` separately through its out-of-band execution context. Never copy a caller/model-authored `host` field into the invocation or treat one as adapter identity. For an existing project, verify and restore its Workflow Ledger before routing; never infer current state from filenames. An arbitrary user-supplied local path remains an ephemeral locator: use the documented local-source ingress to stage exact bytes at a safe repository-relative project path and externally accept `LocalAssetManifest@1` before Researcher delegation. If that future interface is unavailable, preserve a same-state deferred-interface pause. If a locator or rights declaration is correctable, request exact replacement evidence; reserve terminal `STOP` for a genuinely non-resumable refusal or abandoned request.

An artifact-owning role has no direct filesystem writes: it supplies valid canonical bytes through the opaque trusted candidate writer, then may return `RoleResult@1.status="written"` only after a matching receipt. Route that candidate through `artifact-validation-and-hashing`; do not ask the role to fabricate its own hash or treat trusted-writer persistence as acceptance.

This is a local Codex/Claude Code Prompt OS for deterministic, pure-code 2D motion. It is not a web product and contains no conversational runtime. Work only with supported, user-supplied local assets and references.

- No API key, credential, remote model/media integration, or repository network dependency.
- No AI-generated video, AI-generated image, stock footage, or generated footage as the visual substrate.
- No true 3D, character acting, automatic voice generation, or hand-drawn frame-by-frame production in V1.
- Do not claim that an engine, preview, render, QC result, schema validator, or delivery exists without current local evidence.

Use the canonical workflow's typed pause, needs-user, or terminal route when facts, rights, scope, hashes, gates, or local evidence are inadequate. A recoverable wait never changes state to `STOP`. Do not invent a host-specific creative, revision, approval, or audio path.
