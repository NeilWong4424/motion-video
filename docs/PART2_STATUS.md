# Part 2 status — the motion engine

Part 2 implements the deterministic motion engine that Part 1's Prompt OS
describes. It is built in-place alongside the Part 1 documentation and contracts.
`docs/PART1_STATUS.md` remains the historical record of Part 1's
documentation-only scope; this document records what the engine can now actually
do, with local evidence.

## Implemented and verified

- **Single-package toolchain** (Node, pnpm via corepack, React 19, Remotion
  4.0.495, TypeScript, Vitest) with a reusable production-source boundary
  scanner that keeps the engine offline and deterministic.
- **Canonical contracts** (Zod) + canonical JSON + SHA-256 hashing.
- **Local project / artifact / revision store** with atomic immutable writes and
  the `motion new` / `motion snapshot` CLI.
- **Capability API + style catalog** and 5 base renderers (text/shape/path/
  group/image); 15 motion-capability effects across text/shape/path/data/
  diagram/ui/identity/ambient; 3 production style packs. All content-addressed.
- **Continuity-first validators** (references, bridge intent, slide-reset,
  camera) enforcing the fixed `seamless-default` policy before resolution.
- **Deterministic resolver** (timeline, node/camera tracks, capability binding,
  bridge realization + typed handoff checks) and **canonical RenderPlan
  compiler**.
- **PersistentWorld runtime**: one world mounts once, one global camera, stable
  node identity across beats, no per-beat Scene/Sequence; render-only offline
  guard.
- **Render pipeline**: `motion validate/resolve/preview/stills/inspect/qc`, a
  gate-guarded internal final renderer, and `motion approve` / `motion render`
  behind the QC + both-reviews + approval gate. Renders real MP4/PNG through the
  Remotion headless browser.
- **Technical QC** (seam/brightness/dead-frame/camera-motion) + frame sampler.
- **First Golden Film** (`projects/golden-continuity`): a real 20-second,
  600-frame continuity-first film (keyword → card → dashboard → chart → brand)
  that renders and passes technical QC. Rendered frames were reviewed and read
  as one evolving idea, not slides.

## Honest boundaries preserved

The repository still makes **zero model calls**, contains no API key or
credential architecture, no generated image/video substrate, no hosted platform.
Music remains a manual third-party handoff. The engine never claims a render,
preview, QC result, or delivery that is not present as current local evidence.

## Also implemented

- **Semantic revisions** (Task 14): `motion revise --apply` applies a validated
  SemanticPatch as a new immutable revision, enforcing locks against the actual
  diff and a complete declared impact set; whole-artifact replacement is
  rebuild-only.
- **Offline audio** (Task 15): a deterministic `MUSIC_PROMPT.md` generator
  (frame-accurate payoff, sanitized free text, hash-bound to the cut), a local
  ffmpeg alignment/mux that time-shifts audio only and copies the video stream,
  and a delivery packager (`not-provided | mixed`). No music API or key.
- **Release gate** (Task 16): `pnpm check` runs environment, boundary, both
  content-addressed manifests, the Part 1 documentation suite, lint, typecheck
  and the full test suite. Operating guide in the README.

## Local evidence

Every claim above is backed by a passing automated gate and, for the render/QC/
mux claims, real Remotion/ffmpeg output verified in tests. The engine never
claims a render, preview, QC result, mux or delivery without current local
evidence.
