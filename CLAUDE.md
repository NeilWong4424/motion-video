# Claude Code entry point

Route every ordinary video request to [`agent/video-workflow.md`](agent/video-workflow.md). Preserve the user's text as source instruction and pass it, any requested project ID, and user-supplied local paths as an ephemeral `WorkflowInvocation` with `host: "claude-code"`. This adapter writes no canonical artifact.

The repository is a local Codex/Claude Code Prompt OS for deterministic, pure-code 2D motion—not a hosted product or model runtime. Use only supported, user-supplied local assets and references.

- No API key, credential, remote model/media integration, or repository network dependency.
- No AI-generated video, AI-generated image, stock footage, or generated footage as the visual substrate.
- No true 3D, character acting, automatic voice generation, or hand-drawn frame-by-frame production in V1.
- Never claim that an engine, preview, render, QC result, schema validator, or delivery exists without current local evidence.

Use the canonical workflow's stops for unsupported scope, truth or rights gaps, stale bindings, and unmet gates. Do not create a Claude-specific creative, revision, approval, or audio workflow.
