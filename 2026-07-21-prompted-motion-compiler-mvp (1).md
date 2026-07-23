# Local Continuity-First Text-to-Motion Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean, single-package local repository that Codex or Claude Code can turn from a natural-language brief into deterministic, continuity-first 2D motion graphics, a Remotion preview, a final MP4, an editable project and an offline third-party music prompt.

**Architecture:** Codex or Claude Code is the intelligence and orchestrator; the repository never calls a model. The agent writes versioned `BriefSpec → TreatmentSpec → MotionSpec` artifacts, then a deterministic local `Resolver → Compiler → PersistentWorld Runtime → Renderer/QC` pipeline produces the film. Beat boundaries require explicit continuity bridges, hard cuts are rare justified exceptions, and music is a manual user handoff through `MUSIC_PROMPT.md` rather than an API integration.

**Tech Stack:** Node.js 24 LTS, pnpm, TypeScript, Zod, React, Remotion, SVG/Canvas/CSS, Vitest, fast-check, Sharp, Pixelmatch, FFmpeg and ffprobe. No Next.js, database, queue, worker, model SDK or API key.

**Design source:** `docs/superpowers/specs/2026-07-21-local-text-to-motion-compiler-design.md`

## Global Constraints

- This plan is documentation only. Do not create the implementation repository, install dependencies or write product code until the user explicitly approves this revised plan.
- After approval, create a new sibling directory named `motion-video/`. If that exact path already exists, stop and ask the user for a new name; never delete, empty or overwrite it.
- Initialize only a local Git repository. Creating a GitHub repository, pushing, opening a pull request or publishing packages requires separate user authorization.
- Use a single package, not a monorepo.
- Pin Node.js to `24.14.0` in `.nvmrc` and require `>=24.14.0 <25` in `package.json`.
- Pin pnpm to the available stable `11.7.0` in `packageManager`.
- Pin `react` and `react-dom` to `19.2.7`.
- Pin every `remotion` and `@remotion/*` package to `4.0.495`; mixed Remotion versions are forbidden.
- Pin TypeScript to `6.0.3`, Zod to `4.4.3`, Vitest to `4.1.10`, fast-check to `4.9.0`, ESLint to `10.7.0`, `typescript-eslint` to `8.65.0`, Commander to `15.0.0`, Sharp to `0.35.3`, Pixelmatch to `7.2.0`, PNGJS to `7.0.0`, `tsx` to `4.23.1` and Prettier to `3.9.6`.
- Use exact dependency versions and commit `pnpm-lock.yaml`; root `.npmrc` sets `save-exact=true`.
- V1 supports one chosen master format per project: `1920×1080`, `1080×1920` or `1080×1080`; it does not auto-generate multiple aspect ratios.
- V1 accepts `24`, `25`, `30`, `50` or `60` fps and `5–60` seconds. Golden fixtures use `30fps`.
- All frame ranges are half-open: `[from, to)`.
- V1 accepts user-supplied local PNG, JPEG, WebP and sanitized SVG plus locally licensed fonts and reference videos used only for analysis. The repository never generates, searches for or downloads AI imagery/video, and no video/footage can become the rendered visual substrate; it does not attempt to infer how a user-owned static image was originally made.
- Runtime input never contains arbitrary JavaScript, CSS source, executable expressions, network URLs or unresolved local paths.
- Render-time network requests, `Date.now()`, unseeded `Math.random()`, runtime filesystem discovery and layout fallbacks are forbidden.
- Every random effect derives its seed from project ID, revision ID, node ID and capability ID.
- The repository contains no OpenAI/Anthropic/model SDK, no music-service SDK, no model gateway, no HTTP model call, no `.env.example`, no API-key field and no secret lookup.
- The repository also exposes no Remotion `apiKey`, `licenseKey` or `publicLicenseKey` setting. The exact bundled Remotion license is an operator precondition: if the intended use is not covered without adding a key, stop and request a new architectural decision instead of adding credential or telemetry code.
- The repository contains no Web product, Next.js, custom player dashboard, multi-user state, worker, queue or database.
- Codex uses `AGENTS.md`; Claude Code uses `CLAUDE.md` and `.claude/skills/video/SKILL.md`. These are thin entry points to one canonical prompt/craft system.
- A Beat is a narrative state, never an instruction to remount a full-screen Scene.
- Each adjacent Beat pair has exactly one `ContinuityBridge`. Default priority is shared element, camera navigation, morph into target, match on action, directional push, then justified chapter cut.
- A chapter cut requires a real semantic break, explicit exception justification and eye-trace anchors. V1 permits at most one chapter cut in an entire film regardless of Treatment budget; adjacent/repeated cuts are blocking, and repeated full-page replacement is `SLIDE_LIKE_CUT_PATTERN`.
- Narrative/emotional truth outranks a clever geometric seam. When two states have no honest causal, spatial or identity relationship, use one justified chapter cut rather than a fake morph; the exception may not become slide rhythm.
- Seamless does not mean constant movement. Timing defaults are governed by the chosen motion profile; only the Golden Film has a hard `hold:move ≥ 2:1` acceptance target.
- Preview and Final use the same RenderPlan; preview changes scale/encoding only.
- V1 has one `repoRoot`, derived from the installed CLI module, containing `src/`, `projects/_template/`, all `projects/`, `out/` and the runtime entry point. No public CLI flag may redirect the repository, template, projects, output or bundle root. Tests inject an isolated `RepoContext` directly into command functions; that dependency-injection seam is not a CLI feature.
- Visual derived output is immutable and content-addressed under `out/<project>/<revision>/<render-plan-hash>/`; rerunning the same plan is idempotent, while a changed plan always gets a new directory. Post-lock audio is nested content-addressed data: prompts by `audioBriefHash` plus a prompt-attempt hash, mixes by `mixAttemptHash = hash(audioBriefHash + sourceMusicSha256 + mixOptionsHash + renderManifestHash + approvalArtifactHash + audioToolImplementationHash)`, and every delivery manifest by its own content hash. No music take or delivery state overwrites another.
- Final render requires artifacts bound to the exact current revision and RenderPlan hash: passing technical QC, completed Creative and Motion reviews, and an explicit Preview Gate approval. Preview/stills remain available before approval.
- `continuityPolicy` is fixed to `seamless-default`; Creative Direction selects a separate `compositionMode` and cannot weaken the continuity policy.
- Structural auto-repair is limited to one pass; visual auto-repair is limited to two bounded passes.
- Audio V1 is `locked silent cut → AudioBrief → MUSIC_PROMPT.md → user manually generates music → local align/mux`. The repository never generates music or contacts a music service.
- If the RenderPlan revision/hash/timing changes, its AudioBrief, music prompt and alignment artifacts become stale and must be regenerated.
- Task 1 is the only bootstrap exception. Task 2 onward uses TDD: write a failing test, observe the expected failure, implement the minimum behavior, run the focused test, then run the affected suite.
- Task 1 establishes one reusable production-source boundary scanner. Every later milestone runs it, and Task 14 applies the same scanner to the complete closed import graph of every project-local capability before materialization.
- Each task ends in an independently reviewable Conventional Commit. Do not combine tasks in one commit.

---

## 1. User Workflow

```text
User brief in Codex / Claude Code
→ BriefSpec
→ TreatmentSpec
→ MotionSpec
→ local validate / resolve / compile
→ Remotion Studio or low-resolution preview
→ technical QC + local cold review
→ SemanticPatch revisions
→ approved silent master + MUSIC_PROMPT.md
→ optional user-returned music + local mux
```

The repo itself has no conversational interface. The host coding agent writes artifacts and runs local commands. Remotion Studio is the only interactive preview UI.

## 2. Repository Map

```text
motion-video/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── .npmrc
├── .nvmrc
├── .gitignore
├── eslint.config.mjs
├── prettier.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── remotion.config.ts
├── .claude/skills/video/SKILL.md
├── agent/
│   ├── video-workflow.md
│   ├── prompts/
│   │   ├── brief-planner.md
│   │   ├── researcher.md
│   │   ├── creative-direction.md
│   │   ├── motion-planner.md
│   │   ├── capability-builder.md
│   │   ├── revision-interpreter.md
│   │   └── sound-designer.md
│   └── reviewers/
│       ├── creative-reviewer.md
│       └── motion-reviewer.md
├── craft/
│   ├── index.md
│   ├── motion-craft.md
│   ├── continuity-first.md
│   ├── continuous-world.md
│   ├── kinetic-type.md
│   ├── data-motion.md
│   ├── ui-motion.md
│   ├── logo-motion.md
│   ├── sound-design.md
│   └── delivery.md
├── src/
│   ├── index.ts
│   ├── Root.tsx
│   ├── generated/project-registry.ts
│   ├── contracts/
│   ├── engine/
│   │   ├── boundary/
│   │   ├── project/
│   │   ├── capability/
│   │   ├── resolver/
│   │   ├── compiler/
│   │   ├── runtime/
│   │   ├── renderer/
│   │   ├── revision/
│   │   ├── audio/
│   │   └── qc/
│   ├── capabilities/
│   ├── styles/
│   └── cli/
├── projects/_template/
├── public/fonts/
├── assets/fonts/
├── assets/licenses/
├── fixtures/
├── tests/
│   └── visual-baselines/
└── out/.gitkeep
```

### Import boundaries

| Module | May import | Must not import |
|---|---|---|
| `contracts` | Zod | React, Remotion, filesystem, prompts, network |
| `engine/boundary` | local filesystem/parser utilities and caller-supplied file lists | runtime, implicit project discovery, prompts, network |
| `engine/capability` | contracts, React types | projects, project discovery, renderer, prompts, network |
| `engine/project/build-project-registry` | contracts, capability metadata, validated project manifests, local filesystem | runtime discovery, prompts, network |
| `capabilities` | contracts, capability API, React, Remotion | filesystem, prompts, network |
| `styles` | contracts | React renderer, projects, network |
| `resolver` | contracts, capability metadata, style/layout helpers | React runtime, prompts, network |
| `compiler` | contracts and capability IDs | React, Remotion, filesystem, prompts |
| `runtime` | RenderPlan, capability renderers, React, Remotion | resolver, projects, prompts, filesystem, network |
| `renderer` | compiler output, runtime, Remotion renderer, local filesystem | prompts, model/media services |
| `revision` | source contracts and local artifact store | React, Remotion, external AI |
| `audio` | AudioBrief and RenderPlan audio view | music/model SDKs and network |
| `qc` | local artifacts, images, FFmpeg/ffprobe | external visual models |
| `agent` / `craft` | human-readable local docs | runtime bundle |

## 3. Commands Delivered by V1

```text
pnpm motion new <project-id>
pnpm motion validate <project-id>
pnpm motion snapshot <project-id>
pnpm motion resolve <project-id>
pnpm studio
pnpm motion preview <project-id>
pnpm motion render <project-id>
pnpm motion stills <project-id>
pnpm motion qc <project-id>
pnpm motion inspect <project-id>
pnpm motion approve <project-id> --reviewed-plan <hash> --actor <human|codex|claude-code> --reason <text>
pnpm motion revise <project-id> --patch <local-json> --apply
pnpm audio:prompt -- --brief <local-json> --render-plan <local-json> --approval <local-json> --delivery-root <plan-root>/delivery
pnpm audio:mix -- --brief <audio-brief.json> --render-plan <render.plan.json> --approval <preview-approval.json> --render-manifest <render.manifest.json> --video <master-silent.mp4> --music <local-audio> --source-label <text> --track-payoff <seconds> --gain-db <number> --delivery-root <plan-root>/delivery
```

The repository root is derived from the CLI module location and is never user-selectable. All commands reject URL inputs and return a non-zero exit code for blocking diagnostics.

## 4. Milestones

| Milestone | Tasks | Deliverable | Hard gate |
|---|---:|---|---|
| M0 Foundation | 1–3 | Single package, contracts, local project/artifact system | No platform, database, API/model code |
| M1 Seamless Kernel | 4–10 | First continuity-first Golden Film and measured seam QC | Must not resemble slides |
| M2 Motion Language | 11–12 | Reusable motion families, style packs and varied Golden projects | Same schema supports distinct films |
| M3 Prompt OS | 13–14 | Codex/Claude creation, review, revision and capability-gap workflow | Repo makes zero model calls; locks survive |
| M4 Audio & Delivery | 15 | Offline music prompt, optional local audio mux and complete package | No music API/key; frame-accurate payoff |
| M5 Hardening | 16 | Golden matrix, regression suite and operating docs | Clean clone validates and renders locally |

---

### Task 1: Bootstrap the Single-Package Repository and Enforce the No-API Boundary

**Files:**
- Create: `.nvmrc`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `README.md`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `prettier.config.mjs`
- Create: `vitest.config.ts`
- Create: `remotion.config.ts`
- Create: `src/index.ts`
- Create: `src/Root.tsx`
- Create: `src/generated/project-registry.ts`
- Create: `src/engine/boundary/production-source-policy.ts`
- Create: `src/engine/boundary/scan-production-source.ts`
- Create: `tests/repo/dependency-boundary.test.ts`
- Create: `tests/repo/production-source-boundary.test.ts`
- Create: `scripts/verify-environment.mjs`
- Create: `scripts/scan-production-boundary.mjs`

**Interfaces:**
- Consumes: Node.js `24.14.0`, pnpm `11.7.0`, local FFmpeg/ffprobe and a new empty directory.
- Produces: a runnable Remotion/TypeScript/Vitest package and a permanent test that rejects platform, model, database and secret dependencies.

- [ ] **Step 1: Validate the target and initialize the local repository**

Run from the approved parent directory:

```bash
test ! -e motion-video
mkdir motion-video
cd motion-video
git init
```

Expected: `test` exits `0`; Git initializes an empty repository. If `test` fails, stop without touching the existing path.

- [ ] **Step 2: Add exact package metadata and scripts**

Create `package.json` with this complete content:

```json
{
  "name": "motion-video",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.7.0",
  "engines": {"node": ">=24.14.0 <25"},
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:environment": "node scripts/verify-environment.mjs",
    "verify:boundary": "node --import tsx scripts/scan-production-boundary.mjs",
    "check": "pnpm verify:environment && pnpm verify:boundary && pnpm lint && pnpm typecheck && pnpm test"
  },
  "dependencies": {
    "@remotion/bundler": "4.0.495",
    "@remotion/cli": "4.0.495",
    "@remotion/media-utils": "4.0.495",
    "@remotion/renderer": "4.0.495",
    "commander": "15.0.0",
    "culori": "4.0.2",
    "pixelmatch": "7.2.0",
    "pngjs": "7.0.0",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "remotion": "4.0.495",
    "sharp": "0.35.3",
    "ssim.js": "3.5.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@types/node": "24.13.3",
    "@types/pngjs": "6.0.5",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@types/react-test-renderer": "19.1.0",
    "@vitest/coverage-v8": "4.1.10",
    "eslint": "10.7.0",
    "fast-check": "4.9.0",
    "prettier": "3.9.6",
    "react-test-renderer": "19.2.7",
    "tsx": "4.23.1",
    "typescript": "6.0.3",
    "typescript-eslint": "8.65.0",
    "vitest": "4.1.10"
  }
}
```

Set `.nvmrc` to `24.14.0`, `.npmrc` to `save-exact=true`, and ignore only `node_modules/`, `.cache/`, `.remotion/`, generated project-capability snapshots under `src/generated/project-capabilities/`, `out/*` except `out/.gitkeep`, OS/editor files and user-returned audio binaries under `projects/*/assets/audio/`.

Create the initial `README.md` with this exact scope statement; Task 16 expands it into the operating guide:

```markdown
# Motion Video

Local, continuity-first text-to-motion graphics for Codex and Claude Code.
The repository renders deterministic React/SVG/Canvas motion with Remotion. It
does not call an AI API, generate AI imagery/video, or provide a multi-user app.
```

- [ ] **Step 3: Add strict TypeScript, lint, test and Remotion configuration**

Use one `tsconfig.json` so TypeScript follows the real cross-runtime import graph instead of relying on exclusions that imported files can bypass. It uses `module`/`moduleResolution: NodeNext`, `target: ES2023`, `jsx: react-jsx`, DOM and ES libs, Node types, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `isolatedModules` and `noEmit`; its include array names `src/**/*.ts`, `src/**/*.tsx`, `tests/**/*.ts`, `tests/**/*.tsx`, `vitest.config.ts` and `remotion.config.ts`. Root `.mjs` scripts are linted and exercise exported typed library functions in tests; the type checker does not pretend to validate JavaScript by listing files it ignores. Import-boundary tests enforce Node-versus-browser separation. `vitest.config.ts` includes `tests/**/*.test.{ts,tsx}` and a 30-second default timeout. `remotion.config.ts` sets JPEG image format, H.264 default codec and overwriting disabled; it must not configure an API, license or public-license key.

Create `src/index.ts`:

```ts
import {registerRoot} from 'remotion';
import {Root} from './Root.js';

registerRoot(Root);
```

Create `src/Root.tsx`:

```tsx
import {AbsoluteFill, Composition} from 'remotion';

const EnvironmentCheck = () => <AbsoluteFill style={{backgroundColor: '#0b0c10'}} />;

export const Root = () => (
  <Composition
    id="EnvironmentCheck"
    component={EnvironmentCheck}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={30}
  />
);
```

`src/generated/project-registry.ts` exports `export const projectRegistry = [] as const;`.

- [ ] **Step 4: Add environment and dependency boundary tests**

Create `tests/repo/dependency-boundary.test.ts` that parses `package.json` and asserts none of these dependency names are present:

```ts
const forbidden = [
  'next', '@remotion/player', 'openai', '@anthropic-ai/sdk',
  '@ai-sdk/openai', '@ai-sdk/anthropic', 'better-sqlite3',
  'bullmq', 'redis', 'pg', 'axios', 'undici',
];
```

`production-source-policy.ts` owns the single forbidden-pattern and executable policy. `scanProductionSource()` receives explicit roots or a closed file list, parses imports/JSX where needed and reports stable diagnostics. The CLI wrapper scans the actual filesystem under production/config paths—`src/`, `scripts/`, `agent/`, `craft/`, `projects/`, root entry documents and `package.json`—rather than relying on `git ls-files`, because this gate must work before the first commit and inside archive fixtures. Explicitly exclude `projects/_template/` placeholder text only where the template is non-executable, `projects/*/revisions/`, user assets/references, `node_modules/`, `out/`, `.cache/`, `.remotion/`, `tests/` and `docs/superpowers/`; executable project capabilities are always included through their closed manifests. In code/config, reject credential-shaped identifiers/assignments/placeholders, `licenseKey`, `publicLicenseKey`, every production `process.env` access, model/media-service SDK imports, executable `fetch`/XHR/WebSocket/EventSource/sendBeacon calls, Node network modules (`node:http`, `node:https`, `node:net`, `node:tls`, `node:dns`), `Date.now()`, unseeded `Math.random()`, browser resource constructors/setters that can target remote media, Remotion `<Video>`/`<OffthreadVideo>`, runtime video-file imports and subprocess calls outside an explicit binary allowlist. Negative prose such as “no API key” and plain provider names are allowed in user documentation; a credential example, setup step or placeholder is not. The repository-wide V1 subprocess allowlist is `node`, `git`, `pnpm`, `ffmpeg`, `ffprobe` and the Remotion-managed browser launcher used by the verified renderer; the audio subsystem narrows this to FFmpeg/ffprobe. Shell execution and network tools such as `curl`, `wget` and PowerShell download commands are forbidden.

`production-source-boundary.test.ts` proves the reusable scanner rejects bare/dynamically aliased network calls, `process.env`, time/randomness, remote-resource JSX, `<Video>`/`<OffthreadVideo>` and a forbidden subprocess in both core and synthetic project-capability closures, while allowing validated local base-image asset references. Later tasks call this exported scanner instead of growing independent regex lists.

`scripts/verify-environment.mjs` must compare `process.versions.node` with the exact supported Node range, spawn `pnpm --version` and require exactly `11.7.0`, then spawn `ffmpeg -version` plus `ffprobe -version` without shell interpolation. A mismatch or missing executable returns exit code `1` with `ENV_NODE_UNSUPPORTED`, `ENV_PNPM_UNSUPPORTED`, `ENV_FFMPEG_MISSING` or `ENV_FFPROBE_MISSING`.

- [ ] **Step 5: Install and run the bootstrap gate**

```bash
pnpm --version
pnpm install
pnpm verify:environment
pnpm verify:boundary
pnpm lint
pnpm typecheck
pnpm vitest run tests/repo/dependency-boundary.test.ts
```

Expected: the first command prints exactly `11.7.0`; lockfile created; all commands PASS; dependency scan reports zero forbidden dependencies and zero secret/network patterns.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: bootstrap local motion video repository"
```

---

### Task 2: Define Canonical Contracts, Hashes and Diagnostics

**Files:**
- Create: `src/contracts/common.ts`
- Create: `src/contracts/artifact.ts`
- Create: `src/contracts/brief.ts`
- Create: `src/contracts/treatment.ts`
- Create: `src/contracts/motion-spec.ts`
- Create: `src/contracts/resolved-motion.ts`
- Create: `src/contracts/render-plan.ts`
- Create: `src/contracts/audio.ts`
- Create: `src/contracts/revision.ts`
- Create: `src/contracts/review.ts`
- Create: `src/contracts/approval.ts`
- Create: `src/contracts/diagnostic.ts`
- Create: `src/contracts/manifest.ts`
- Create: `src/contracts/index.ts`
- Create: `src/engine/canonical-json.ts`
- Create: `src/engine/hash.ts`
- Create: `tests/contracts/contracts.test.ts`
- Create: `tests/contracts/canonical-json.test.ts`
- Create: `tests/fixtures/contracts/minimal-project.json`

**Interfaces:**
- Consumes: untrusted JSON authored by a human, Codex or Claude Code.
- Produces: strict Zod schemas, inferred TypeScript types, canonical JSON bytes and lowercase SHA-256 hashes.

- [ ] **Step 1: Write failing strict-schema tests**

Create `tests/contracts/contracts.test.ts` with fixtures that assert:

```ts
expect(BriefSpecSchema.parse(valid.brief).projectId).toBe('continuity-demo');
expect(TreatmentSpecSchema.parse(valid.treatment).continuityPolicy).toBe('seamless-default');
expect(TreatmentSpecSchema.parse(valid.treatment).compositionMode).toBe('persistent-stage');
expect(MotionSpecSchema.parse(valid.motion).timeline.beats).toHaveLength(2);
expect(() => BriefSpecSchema.parse({...valid.brief, model: 'gpt'})).toThrow();
expect(() => MotionSpecSchema.parse({...valid.motion, scenes: []})).toThrow();
expect(() => MotionSpecSchema.parse(remoteAssetMotion)).toThrow();
expect(() => AudioBriefArtifactSchema.parse(twoPayoffs)).toThrow(/AUDIO_PAYOFF_INVALID/);
```

The valid fixture must contain a `1920×1080`, `30fps` project with two Beats, one persistent text node, one shared-element bridge, a main-camera hold track and one audio payoff cue.

- [ ] **Step 2: Run the contract tests and verify Red**

Run: `pnpm vitest run tests/contracts/contracts.test.ts`

Expected: FAIL because the contract modules do not exist.

- [ ] **Step 3: Implement common, artifact, brief and treatment contracts**

Use `z.strictObject()` at every object boundary. Define these exact discriminants and constraints:

```ts
export const ProjectIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const ProducerSchema = z.strictObject({
  kind: z.enum(['host', 'tool']),
  id: z.enum([
    'codex', 'claude-code', 'human', 'resolver', 'compiler',
    'renderer', 'qc', 'revision-engine', 'audio-tool', 'delivery-tool',
  ]),
  version: z.string().min(1),
}).superRefine((value, ctx) => {
  const isHostId = new Set(['codex', 'claude-code', 'human']).has(value.id);
  if ((value.kind === 'host') !== isHostId) {
    ctx.addIssue({code: 'custom', message: 'PRODUCER_KIND_MISMATCH'});
  }
});
export const CanvasSchema = z.strictObject({
  width: z.union([z.literal(1920), z.literal(1080)]),
  height: z.union([z.literal(1080), z.literal(1920)]),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30), z.literal(50), z.literal(60)]),
}).refine((v) => new Set(['1920x1080', '1080x1920', '1080x1080']).has(`${v.width}x${v.height}`));

export const ArtifactEnvelopeSchema = <T extends z.ZodType>(payload: T) => z.strictObject({
  schemaVersion: z.string().min(1),
  projectId: ProjectIdSchema,
  revisionId: z.string().regex(/^rev-[a-z0-9-]+$/),
  producer: ProducerSchema,
  parentHashes: z.array(Sha256Schema),
  contentHash: Sha256Schema,
  payload,
});
```

`BriefSpec` starts with `schemaVersion: 'brief@1'` and `projectId`, then includes title, language (`zh-CN | zh-TW | en | mixed`), goal, audience, one message, optional CTA, canvas, duration seconds `5..60`, verified facts with local source labels, supplied asset IDs, constraints, prohibited content and assumptions. It contains no style, coordinates, model metadata or external-processing policy.

`TreatmentSpec` starts with `schemaVersion: 'treatment@1'`, `projectId` and the approved `briefHash`, then includes one message, narrative arc, `continuityPolicy` fixed to `seamless-default`, `compositionMode: 'persistent-stage' | 'continuous-world' | 'held-shot'`, named motion profile, style pack ID, visual thesis, copy strategy, transition vocabulary of one to three ordinary families, optional signature transition, `chapterCutBudget: 0 | 1`, and ordered Beat intentions. The schema-level V1 maximum is one cut for the entire 5–60 second film; a Treatment may choose zero but cannot raise the engine ceiling. `compositionMode` describes framing/register; it does not authorize slide-like cuts or weaken the bridge rules. The treatment contains no pixels, React or CSS.

- [ ] **Step 4: Implement MotionSpec, resolved IR and RenderPlan contracts**

Use the design spec's model with these exact top-level fields:

```ts
type MotionSpec = {
  schemaVersion: 'motion-spec@1';
  projectId: string;
  treatmentHash: string;
  canvas: CanvasSpec;
  timeline: {beats: Beat[]; bridges: ContinuityBridge[]};
  world: {
    coordinateSpace: 'composition-pixels';
    origin: 'top-left';
    transformOrigin: 'top-left';
    childGeometry: 'parent-local';
    nodes: PersistentNode[];
  };
  camera: CameraTrack;
  motionCues: MotionCue[];
};
```

`Beat` includes exact `durationFrames`, `objective`, `message`, one `focalNodeId`, `liveContentNodeIds`, `settleAt: SegmentRef` and `holdRange: SegmentRange`; settled/held frames are therefore data, not reviewer guesses.

`ContinuityBridge` is the discriminated union defined below, not one permissive object. Every bridge carries `transitionFamily`, `ordinary | signature` vocabulary role, explicit outgoing/incoming eye-trace nodes and canvas-normalized points whose `x` and `y` are each `0..1`, and `camera | node | camera-and-node-semantic` motion ownership. The shared base plus variant requirements are:

```ts
type BridgeBase = {
  id: string;
  fromBeatId: string;
  toBeatId: string;
  durationFrames: number;
  narrativeReason: string;
  transitionFamily: string;
  vocabularyRole: 'ordinary' | 'signature';
  eyeTrace: {
    outgoing: {nodeId: string; point: {x: number; y: number}};
    incoming: {nodeId: string; point: {x: number; y: number}};
  };
  motionOwnership: 'camera' | 'node' | 'camera-and-node-semantic';
  combinationMeaning?: string;
};

type ContinuityBridge =
  | (BridgeBase & {mode: 'shared-element'; nodeId: string; motionRange: SegmentRange})
  | (BridgeBase & {mode: 'camera-navigation'; cameraSegmentId: string; destinationNodeId: string; spatialRelationship: string})
  | (BridgeBase & {mode: 'morph-into-target'; sourceNodeId: string; targetNodeId: string; motionRange: SegmentRange; preRollFrames: number; settleFrames: number})
  | (BridgeBase & {mode: 'match-on-action'; outgoingNodeId: string; incomingNodeId: string; actionAt: SegmentRef; action: 'translate' | 'scale' | 'rotate' | 'draw' | 'expand' | 'collapse'})
  | (BridgeBase & {mode: 'directional-push'; direction: 'left' | 'right' | 'up' | 'down'; semanticDirection: 'forward' | 'back' | 'parallel'})
  | (BridgeBase & {mode: 'chapter-cut'; durationFrames: 0; reason: 'new-chapter' | 'time-jump' | 'location-jump' | 'emotional-impact'; exceptionJustification: string; maxEyeTraceDistanceNormalized: number});
```

All other bridges require `durationFrames > 0`. A chapter cut's `maxEyeTraceDistanceNormalized` is required, greater than zero and at most `0.15`; measured Euclidean distance beyond it emits `EYE_TRACE_JUMP`. Node kinds are exactly `text`, `shape`, `path`, `image`, `ui`, `chart`, `logo`, `group`. Every node declares `space: world | screen`, `semanticRole: content | decorative | background | overlay`, parent-local geometry, a required base `renderer: {id, version, props}`, an ordered `effects: Array<{id, version, range: SegmentRange, props}>`, and optional explicit content transitions (`crossfade | masked-reveal | shared-text-morph | replace-on-action`). The base renderer owns static content/geometry markup; zero or more Motion Capabilities own animation channels over explicit ranges. Two effects may own the same channel only when their resolved ranges do not overlap. Camera and Beat-to-Beat transition ownership remain structural in `CameraTrack` and `ContinuityBridge`, never hidden inside node effects. Every source track keyframe uses `{at: {segmentId, progress}, value, interpolation, easing?}`; `progress` is `0..1`. Source specs contain renderer/effect IDs and versions plus project-owned asset IDs only.

`ResolvedMotionIR` replaces segment references with integer global frames and stores both parent-local transforms and resolved world bounds. `RenderPlan` contains canvas, duration, seed, verified engine build identity, explicit preview/final output profiles, ordered world/screen node tracks, one camera track, one base-renderer binding and an ordered effect-binding stack per node, render-safe asset manifest, typed `HandoffCheck[]` and diagnostic provenance. Effect stacks are rejected when two effects own the same channel over an overlapping range. `HandoffCheck` is a strict discriminated union. Every variant records `bridgeId` plus immediately adjacent `sourceFrame`/`targetFrame`: `exact-visual` adds anchor/crop, required PSNR and geometry limits; `geometry-only` adds anchor and geometry limit; `continuous-motion` adds anchor plus position/velocity limits; `chapter-cut-evidence` adds incoming held frame, both normalized eye-trace points, the declared maximum and measured normalized distance. Only `exact-visual` requires pixel equality; moving-camera and match-on-action bridges use geometry/trajectory evidence instead. Both artifacts are strict, derived and contain no unresolved slots or local paths.

- [ ] **Step 5: Implement audio, revision, diagnostic and manifest contracts**

`src/contracts/audio.ts` is the single owner of `MotionMusicCue`, `AudioBriefArtifact`, `AlignAndMuxInput`, `AudioAlignmentManifest` and their Zod Schemas; Task 15 imports these contracts and must not redeclare them. `AudioBriefArtifact` is editable project source bound to `projectId`, `revisionId`, `renderPlanHash`, fps and duration. V1 cue roles are exactly `intro | build | riser | payoff | sustain | outro`; only `payoff` has alignment semantics. Cues start at frame `0`, are strictly increasing and contain exactly one payoff. Optional `dynamics` and `exclude` fields receive the deterministic Task 15 defaults when absent. `sfxNotes` is a manual production note only; V1 neither synthesizes nor automatically mixes SFX. Custom Zod issues include the stable messages `AUDIO_PAYOFF_INVALID` and `AUDIO_CUE_RANGE_INVALID`, so Contract and Task 15 tests assert the same behavior.

Define the mux contracts here, once:

```ts
type AlignAndMuxInput = {
  brief: AudioBriefArtifact;
  renderPlan: RenderPlanArtifact;
  approval: PreviewApproval;
  renderManifest: RenderManifestArtifact;
  silentVideoPath: string;
  musicPath: string;
  sourceLabel: string;
  trackPayoffSeconds: number;
  musicGainDb: number;
  outputPath: string;
  manifestPath: string;
};

type AudioAlignmentManifest = {
  schemaVersion: 'audio-alignment@1';
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  mixOptionsHash: string;
  mixAttemptHash: string;
  audioToolImplementationHash: string;
  ffmpegVersion: string;
  approvalArtifactHash: string;
  renderManifestArtifactHash: string;
  sourceLabel: string;
  sourceMusicSha256: string;
  silentVideoSha256: string;
  cutPayoffFrame: number;
  cutPayoffSeconds: number;
  trackPayoffSeconds: number;
  appliedOffsetSeconds: number;
  trimStartSeconds: number;
  delayMilliseconds: number;
  musicGainDb: number;
  videoDurationSeconds: number;
  mixedAudioDurationSeconds: number;
  measuredMaxVolumeDb: number;
  videoStreamMd5Before: string;
  videoStreamMd5After: string;
  videoCopied: true;
  outputSha256: string;
};
```

`DeliveryManifest` has an exact audio status of `not-provided | mixed`, required selected `audioBriefHash`/`promptAttemptHash`, and a selected `mixAttemptHash` only when mixed; `not-provided` is a valid delivery state. Its own content hash determines its filename, so changing status or selected take creates a new manifest.

`SemanticPatch` supports these operations only:

```ts
type PatchOperation =
  | {op: 'replace-copy'; nodeId: string; value: string}
  | {op: 'set-token'; token: string; value: string | number}
  | {op: 'retime-beat'; beatId: string; durationFrames: number}
  | {op: 'retime-bridge'; bridgeId: string; durationFrames: number}
  | {op: 'set-node-state'; nodeId: string; track: 'geometry' | 'style' | 'content' | 'visibility'; keyframes: unknown[]}
  | {op: 'swap-renderer'; nodeId: string; rendererId: string; version: string; props: unknown}
  | {op: 'set-effects'; nodeId: string; effects: Array<{id: string; version: string; range: SegmentRange; props: unknown}>}
  | {op: 'set-continuity-bridge'; bridgeId: string; value: unknown}
  | {op: 'replace-brief'; value: BriefSpec}
  | {op: 'replace-treatment'; value: TreatmentSpec}
  | {op: 'replace-motion-spec'; value: MotionSpec}
  | {op: 'set-lock'; target: SemanticLockTarget}
  | {op: 'remove-lock'; target: SemanticLockTarget};

type SemanticLockTarget =
  | {entity: 'brief'; id: string; field?: string}
  | {entity: 'treatment'; id: string; field?: string}
  | {entity: 'beat'; id: string; field?: string}
  | {entity: 'bridge'; id: string; field?: string}
  | {entity: 'node'; id: string; field?: string}
  | {entity: 'camera'; id: 'main-camera'; field?: string}
  | {entity: 'motion-cue'; id: string; field?: string}
  | {entity: 'token'; id: string; field?: string};

type SemanticImpactTarget = SemanticLockTarget;

type SemanticPatchBase = {
  baseRevisionId: string;
  expectedSourceHashes: {brief: string; treatment: string; motion: string};
  operations: PatchOperation[];
  declaredImpactSet: SemanticImpactTarget[];
  reason: string;
};

type SemanticPatch = SemanticPatchBase & (
  | {mode: 'bounded'; sourceUserInstruction: string; triggeringReviewIssueIds?: never}
  | {mode: 'rebuild'; sourceUserInstruction: string; triggeringReviewIssueIds: [string, ...string[]]}
);
```

`SemanticPatch.mode` is `bounded | rebuild`. The three whole-artifact replacement operations are legal only in `rebuild` mode, and a rebuild must include the exact triggering review issue IDs plus the source user instruction. It may replace one, two or all three canonical source payloads; parent-hash validation is rerun in Brief → Treatment → MotionSpec order. The revision engine computes a semantic diff of every replaced artifact, enforces existing locks against that actual diff, and requires every changed field/entity—including added, removed or reordered Beats/Bridges/Nodes, camera segments and motion cues—to appear in the declared impact set. Therefore rebuild can express structural work without opening an arbitrary file-write bypass. Fine-grained operations remain mandatory for ordinary bounded edits.

External locks are always semantic ID targets and therefore survive array reordering; internal impact evidence may include canonical JSON Pointer paths but those paths are never accepted as lock identity.

`RevisionRecord` is a strict union of `initial-snapshot` (no base revision and no patch) or `semantic-patch` (base revision ID plus patch hash). Both bind the exact before/after visual source hashes; an initial snapshot never fabricates an empty SemanticPatch.

`TechnicalQCReport`, `CreativeReview`, `MotionReview` and `PreviewApproval` are strict artifacts bound to `projectId`, `revisionId`, `renderPlanHash` and the reviewed preview hash. Reviews contain reviewer role, decision `ship | fix | rebuild`, structured issues and completion status. `PreviewApproval` contains an explicit human/host approval decision and the hashes of both completed review artifacts; approval is invalid if any bound artifact changes. Diagnostics contain a stable code, `error | warning | info`, artifact path, optional beat/node/frame range, evidence and action. Render, asset, revision, review, approval, audio-alignment and delivery manifests use strict schemas and SHA-256 file hashes.

- [ ] **Step 6: Write and implement canonical JSON tests**

Create `tests/contracts/canonical-json.test.ts`:

```ts
expect(canonicalJson({b: 2, a: 1})).toBe('{"a":1,"b":2}');
expect(canonicalJson({a: -0})).toBe('{"a":0}');
expect(() => canonicalJson({a: Number.NaN})).toThrow(/CANONICAL_NUMBER_INVALID/);
expect(() => canonicalJson({a: undefined})).toThrow(/CANONICAL_VALUE_INVALID/);
expect(() => canonicalJson([, 1])).toThrow(/CANONICAL_VALUE_INVALID/);
expect(sha256Canonical({b: 2, a: 1})).toBe(sha256Canonical({a: 1, b: 2}));
```

Implement recursive lexicographic object-key ordering, original dense array order, finite numbers only, `-0` normalization, JSON escaping and SHA-256 over UTF-8 canonical bytes. Reject `undefined`, holes, functions, symbols, BigInt and non-plain objects. Do not hash pretty-printed files.

An artifact `contentHash` is computed over `{schemaVersion, projectId, revisionId, producer, parentHashes, payload}` with the `contentHash` field omitted; validation recomputes that exact projection. This avoids a self-referential hash.

- [ ] **Step 7: Run the contract gate**

```bash
pnpm vitest run tests/contracts
pnpm typecheck
pnpm lint
```

Expected: all contract/hash tests PASS; unknown keys, remote URLs, arbitrary code and invalid payoff timelines fail validation.

- [ ] **Step 8: Commit**

```bash
git add src/contracts src/engine/canonical-json.ts src/engine/hash.ts tests/contracts tests/fixtures/contracts
git commit -m "feat: define motion compiler contracts"
```

---

### Task 3: Implement the Local Project, Artifact and Revision Store

**Files:**
- Modify: `package.json`
- Create: `src/engine/project/paths.ts`
- Create: `src/engine/project/create-project.ts`
- Create: `src/engine/project/load-project.ts`
- Create: `src/engine/project/artifact-store.ts`
- Create: `src/engine/project/revision-store.ts`
- Create: `src/engine/project/build-project-registry.ts`
- Create: `src/engine/project/index.ts`
- Create: `src/cli/index.ts`
- Create: `src/cli/commands/new.ts`
- Create: `src/cli/commands/snapshot.ts`
- Modify: `src/generated/project-registry.ts`
- Create: `projects/_template/project.json`
- Create: `projects/_template/brief.spec.json`
- Create: `projects/_template/treatment.json`
- Create: `projects/_template/motion.spec.json`
- Create: `projects/_template/NOTES.md`
- Create: `projects/_template/EDIT_MAP.md`
- Create: `tests/project/project-store.test.ts`
- Create: `tests/project/project-cli.test.ts`
- Create: `tests/helpers/create-test-repo-context.ts`

**Interfaces:**
- Consumes: validated project IDs and validated artifact payloads.
- Produces:

```ts
export type ProjectPaths = {
  root: string;
  source: string;
  revisions: string;
  assets: string;
  output: string;
};
export type SourceArtifacts = {
  project: ProjectFile;
  brief: BriefSpec;
  treatment: TreatmentSpec;
  motion: MotionSpec;
};
export type RepoContext = {repoRoot: string};
export function deriveRepoContext(cliModuleUrl: string): RepoContext;
export function resolveProjectPaths(context: RepoContext, projectId: string): ProjectPaths;
export async function createProject(context: RepoContext, projectId: string): Promise<ProjectPaths>;
export async function loadSourceArtifacts(paths: ProjectPaths): Promise<SourceArtifacts>;
export async function writeArtifact<T>(input: ArtifactWrite<T>): Promise<ArtifactEnvelope<T>>;
export async function writeRevisionRecord(input: RevisionWrite): Promise<RevisionRecord>;
export async function buildProjectRegistry(context: RepoContext): Promise<void>;
export async function runMotionCli(argv: string[], context?: RepoContext): Promise<number>;
```

Working visual source files under `projects/<id>/` contain the raw strict payloads shown above so a human or coding agent can edit them directly. Immutable revision snapshots and all derived files use `ArtifactEnvelope`; source `contentHash` values are computed by the toolchain and are not hand-maintained inside editable JSON. The post-lock `audio-brief.json` is deliberately outside the visual revision snapshot: it binds itself to one approved RenderPlan hash and becomes stale, rather than changing, when the visual revision changes.

- [ ] **Step 1: Write failing path, immutability and CLI tests**

Tests create an isolated temporary copy representing one complete repository context, with the tracked `_template`, minimal generated directory and no projects. They inject that `RepoContext` directly into `runMotionCli()` and project functions; they never expose the path as a command-line option. Assert:

```ts
expect(resolveProjectPaths(context, 'launch-film').root).toBe(join(root, 'projects', 'launch-film'));
expect(() => resolveProjectPaths(context, '../escape')).toThrow(/PROJECT_ID_INVALID/);
await createProject(context, 'launch-film');
await expect(createProject(context, 'launch-film')).rejects.toThrow(/PROJECT_EXISTS/);
await writeRevisionRecord(first);
await expect(writeRevisionRecord(first)).rejects.toThrow(/REVISION_EXISTS/);
expect(await readFile(oldRevisionPath, 'utf8')).toBe(oldRevisionBytes);
```

The CLI test calls `runMotionCli(['new', 'launch-film'], isolatedContext)` and verifies the exact draft project tree, `currentRevisionId: null`, no phantom revision directory and one unresolved registry entry. It then writes the known-valid contract fixture into the editable source files, calls `runMotionCli(['snapshot', 'launch-film'], isolatedContext)`, and verifies one complete immutable `rev-0001` source snapshot. A second snapshot attempt must fail `INITIAL_SNAPSHOT_ALREADY_EXISTS` even after direct source edits; only Task 14 may create later revisions. A separate assertion calls the production argument parser with `--workspace-root` and requires an unknown-option failure, proving the public CLI cannot become an installed engine for another workspace.

- [ ] **Step 2: Run tests and verify Red**

Run: `pnpm vitest run tests/project`

Expected: FAIL because project modules and CLI do not exist.

- [ ] **Step 3: Implement safe project paths and creation**

Resolve every project/output path from the already validated project ID and `RepoContext.repoRoot`; never accept a free-form project directory. `deriveRepoContext()` resolves the installed CLI module location once, finds the package root and validates its package/template fingerprint. Canonicalize that root with `realpath`, reject symlinked `projects`, `out` or target path components through `lstat`, then assert the resolved target starts with `${realRepoProjectsRoot}${sep}`. The public parser has no root option. `createProject(context, id)` copies only the tracked template from the same repository, replaces exact `__PROJECT_ID__` sentinel values, creates `assets/{images,fonts,references,audio}` and `revisions/`, and refuses an existing target.

The template `project.json` contains:

```json
{
  "schemaVersion": "project@1",
  "projectId": "__PROJECT_ID__",
  "currentRevisionId": null,
  "previewApproval": {"mode": "human"},
  "status": "draft"
}
```

`previewApproval` is a strict union of `{mode: 'human'}` or `{mode: 'host-allowed', allowedHosts: Array<'codex' | 'claude-code'>}`. This is a local workflow preference, not accounts, roles or authentication; the template always defaults to human approval.

- [ ] **Step 4: Implement atomic artifact and immutable revision writes**

`writeArtifact()` validates its payload, computes canonical bytes/hash, writes to an explicit temporary file in the same directory, `fsync`s the file, renames atomically, `fsync`s the parent directory and returns the envelope. If the exact immutable target already exists with identical canonical bytes it returns the existing artifact idempotently; different bytes at the same target fail `ARTIFACT_COLLISION`. `writeRevisionRecord()` is persistence only. Every revision writes `revision.record.json` (`kind: 'initial-snapshot' | 'semantic-patch'`), immutable copies of Brief/Treatment/MotionSpec, `source-hashes.json` and `revision.manifest.json`; a semantic revision additionally writes its validated `revision.patch.json`, while the initial snapshot has no fake patch. Task 14 owns semantic patch validation/application. The current project pointer is updated only after all immutable files succeed.

Project creation leaves the editable template in draft state and does not invent a revision for placeholder content. `motion snapshot` is an initialization command only: it requires `currentRevisionId: null`, validates all current source artifacts, computes their canonical hashes, assigns exactly `rev-0001`, writes the complete immutable source snapshot plus manifest through `writeRevisionRecord()`, and only then updates `currentRevisionId`. If a revision already exists it fails `INITIAL_SNAPSHOT_ALREADY_EXISTS`; every later change must use a validated Task 14 `motion revise --apply` SemanticPatch so locks and impact analysis cannot be bypassed. A project pointer is either `null` or names a complete revision directory; `resolve`, preview and render reject unsnapshotted source changes as `SOURCE_NOT_SNAPSHOTTED`.

No lock table, queue, lease or worker state is introduced. One local process writes at a time; Git remains the durable history.

- [ ] **Step 5: Implement generated project registration**

`buildProjectRegistry()` scans direct child directories of `projects/`, excludes names beginning `_`, parses each `project.json`, sorts by project ID and atomically writes only this deterministic source:

```ts
import type {RenderPlan} from '../contracts/render-plan.js';

export type ProjectRegistryEntry = {
  projectId: string;
  revisionId: string | null;
  renderPlanHash: string | null;
  plan: RenderPlan | null;
};

export const projectRegistry = [
  {projectId: 'launch-film', revisionId: null, renderPlanHash: null, plan: null},
] satisfies readonly ProjectRegistryEntry[];
```

An unresolved project has `plan: null`. After Task 9 resolves a project, the generator embeds its validated current RenderPlan and exact hash as canonical JSON data. This project module is also the sole discovery bridge for project-local capabilities: Task 14 extends the builder to validate an explicit source manifest, materialize its closed import graph into a content-addressed generated directory under `repoRoot/src/generated/project-capabilities/`, and emit only static relative imports to that snapshot. `engine/capability` never scans or imports `projects/`, and Runtime consumes only this generated registry. Generated files contain no timestamps, machine-specific paths or dynamic import paths.

- [ ] **Step 6: Implement the first CLI command**

Add `"motion": "node --import tsx src/cli/index.ts"` to `package.json`. `src/cli/index.ts` uses Commander and registers `new` plus initialization-only `snapshot`. Production startup calls `runMotionCli(process.argv.slice(2), deriveRepoContext(import.meta.url))`; only the internal function accepts an injected test context. `new` accepts exactly one project ID, calls `createProject(context, id)`, regenerates the unresolved registry and prints the repository-relative project path. `snapshot` requires a null revision pointer, validates the current raw source, refuses blocking diagnostics, persists only `rev-0001` and refreshes the registry; it can never create `rev-0002`. Reject `http:`, `https:` and `data:` inputs before any filesystem action, and reject every unknown root/path option.

- [ ] **Step 7: Run the M0 project gate**

```bash
pnpm vitest run tests/project
pnpm typecheck
pnpm lint
pnpm motion --help
```

Expected: tests PASS; the isolated CLI fixture creates only `<isolated-repo>/projects/smoke-project`, rerunning exits non-zero with `PROJECT_EXISTS`, and public help exposes no repository/workspace-root override.

- [ ] **Step 8: Commit**

```bash
git add package.json src/engine/project src/cli projects/_template src/generated tests/project tests/helpers
git commit -m "feat: add local project and revision store"
```

---

### Task 4: Build the Capability API and Style-Token Boundary

**Files:**
- Modify: `package.json`
- Create: `src/engine/capability/types.ts`
- Create: `src/engine/capability/define-node-renderer.ts`
- Create: `src/engine/capability/define-capability.ts`
- Create: `src/engine/capability/registry.ts`
- Create: `src/engine/capability/matcher.ts`
- Create: `src/engine/capability/index.ts`
- Create: `src/generated/core-capability-manifest.ts`
- Create: `scripts/build-core-capability-manifest.mjs`
- Create: `src/styles/types.ts`
- Create: `src/styles/catalog.ts`
- Create: `src/styles/index.ts`
- Create: `src/capabilities/base/text-node.tsx`
- Create: `src/capabilities/base/shape-node.tsx`
- Create: `src/capabilities/base/path-node.tsx`
- Create: `src/capabilities/base/group-node.tsx`
- Create: `src/capabilities/base/index.ts`
- Create: `src/capabilities/index.ts`
- Create: `tests/capability/capability-api.test.ts`
- Create: `tests/capability/capability-registry.test.ts`
- Create: `tests/capability/base-renderers.test.tsx`
- Create: `tests/styles/style-catalog.test.ts`

**Interfaces:**
- Consumes: a validated capability intent, a style-token reference and deterministic resolution context.
- Produces:

```ts
export type MotionChannel =
  | 'geometry' | 'opacity' | 'content' | 'style'
  | 'path' | 'filter';

export type NodeRendererDefinition<P> = {
  id: string;
  version: string;
  implementationHash: string;
  supportedNodeKinds: readonly NodeKind[];
  propsSchema: z.ZodType<P>;
  Component: React.ComponentType<NodeRendererProps<P>>;
  continuitySubnodeIds: readonly string[];
};

export type MotionCapabilityDefinition<I, R> = {
  id: string;
  version: string;
  implementationHash: string;
  family: 'text' | 'shape' | 'path' | 'diagram' | 'data' | 'ui' |
    'identity' | 'ambient';
  supportedNodeKinds: readonly NodeKind[];
  intentSchema: z.ZodType<I>;
  resolvedSchema: z.ZodType<R>;
  ownedChannels: readonly MotionChannel[];
  continuity: {
    stableRoot: true;
    continuitySubnodeIds: readonly string[];
  };
  resolve: (intent: I, context: CapabilityResolveContext) => R;
  Component: React.ComponentType<CapabilityRenderProps<R>>;
  fixture: CapabilityFixture;
  performanceBudget: {maxDomNodes: number; maxSvgPaths: number};
};

export function defineNodeRenderer<P>(definition: NodeRendererDefinition<P>): NodeRendererDefinition<P>;
export function defineCapability<I, R>(definition: MotionCapabilityDefinition<I, R>): MotionCapabilityDefinition<I, R>;
export class CapabilityRegistry {
  registerRenderer(definition: NodeRendererDefinition<unknown>, scope: 'core' | string): void;
  registerEffect(definition: MotionCapabilityDefinition<unknown, unknown>, scope: 'core' | string): void;
  resolveRenderer(id: string, version: string, projectId: string): NodeRendererDefinition<unknown>;
  resolveEffect(id: string, version: string, projectId: string): MotionCapabilityDefinition<unknown, unknown>;
  list(): readonly CapabilityManifest[];
}
```

- [ ] **Step 1: Write failing capability contract tests**

Test one valid `base.text@1.0.0` renderer and one valid `text.mask-rise@1.0.0` effect definition. Assert that registration rejects:

```ts
expect(() => registry.registerEffect(valid, 'core')).not.toThrow();
expect(() => registry.registerEffect(valid, 'core')).toThrow(/CAPABILITY_DUPLICATE/);
expect(() => defineCapability({...valid, id: 'Mask Rise'})).toThrow(/CAPABILITY_ID_INVALID/);
expect(() => defineCapability({...valid, version: 'latest'})).toThrow(/CAPABILITY_VERSION_INVALID/);
expect(() => defineCapability({...valid, ownedChannels: ['geometry', 'geometry']})).toThrow(/CAPABILITY_CHANNEL_DUPLICATE/);
expect(() => registry.resolveEffect('project.secret', '1.0.0', 'other-project')).toThrow(/CAPABILITY_SCOPE_FORBIDDEN/);
```

Also assert that a capability's `resolve()` called twice with the same frozen context returns canonically identical output. A node effect stack with the same owned channel and overlapping resolved ranges fails `CAPABILITY_CHANNEL_CONFLICT`; the same channel in two disjoint ranges is valid.

- [ ] **Step 2: Run tests and verify Red**

Run: `pnpm vitest run tests/capability tests/styles`

Expected: FAIL because the APIs do not exist.

- [ ] **Step 3: Implement the capability definition and registry**

IDs use lowercase dotted names such as `base.text` and `text.mask-rise`; versions use strict `major.minor.patch`. Add `"capabilities:manifest": "node scripts/build-core-capability-manifest.mjs"` and `"capabilities:manifest:check": "node scripts/build-core-capability-manifest.mjs --check"`. The builder hashes each renderer/effect's complete allowed static import graph and emits the canonical implementation hashes; handwritten or stale hashes fail the check gate. `defineNodeRenderer()` validates stable static markup and renderer props. `defineCapability()` freezes effect metadata, validates non-empty supported kinds, unique channels, positive budgets, stable-root continuity metadata and a fixture whose intent passes its schema. The registry keeps renderer and effect namespaces explicit, stores exact `id@version+implementationHash`, rejects duplicates and resolves only core definitions plus `project:<project-id>` definitions already present in the generated project registry.

The matcher accepts a semantic intent `{family, nodeKind, preferredIds, requiredChannels}` and returns a scored list. It never invents an ID or silently substitutes another family; zero candidates returns the diagnostic `CAPABILITY_GAP`.

- [ ] **Step 4: Implement the style-token catalog**

Define style packs as data only:

```ts
export type StylePack = {
  id: string;
  version: string;
  colors: Record<string, string>;
  typography: Record<string, {fontId: string; weight: number; trackingEm: number; lineHeight: number}>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, {x: number; y: number; blur: number; spread: number; color: string}>;
  motion: {
    profile: 'calm' | 'editorial' | 'energetic' | 'playful';
    heroEase: 'easeOutExpo';
    standardEase: 'easeOutQuart';
    travelEase: 'easeInOutQuint';
  };
};
```

`StyleCatalog` rejects duplicate IDs, invalid colors, missing typography roles and any function/React component in a style pack. Add only `styles/test-neutral@1.0.0` now; production packs arrive in Task 12.

- [ ] **Step 5: Implement the four non-animated base renderers**

Register `base.text@1.0.0`, `base.shape@1.0.0`, `base.path@1.0.0` and `base.group@1.0.0` as `NodeRendererDefinition`s, not Motion Capabilities. These render already-resolved content/geometry/style and contain no internal timing; engine tracks/effects provide all movement. `base.text` consumes pre-resolved lines, `base.shape` supports rectangle/rounded rectangle/ellipse, `base.path` consumes sanitized local path data, and `base.group` creates a stable container for `group | ui | chart | logo` semantic node kinds whose actual visible children remain persistent base text/shape/path nodes.

These base renderers are sufficient for Task 9's smoke fixture and Task 10's Golden Film. Tests mount one `react-test-renderer` instance, update its frame/props and prove the root plus declared continuity subnodes retain object identity; rendering two unrelated static trees is not accepted as identity evidence. Content-state changes may update children but cannot replace the shared geometry root or its key.

- [ ] **Step 6: Run the capability/style gate**

```bash
pnpm capabilities:manifest
pnpm vitest run tests/capability tests/styles
pnpm typecheck
pnpm lint
```

Expected: PASS; no registry operation reads a project file or contacts a network.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/build-core-capability-manifest.mjs src/generated/core-capability-manifest.ts src/engine/capability src/capabilities/base src/capabilities/index.ts src/styles tests/capability tests/styles
git commit -m "feat: add typed capability and style catalogs"
```

---

### Task 5: Enforce Continuity-First Motion at the Specification Boundary

**Files:**
- Create: `src/engine/resolver/validate-references.ts`
- Create: `src/engine/resolver/validate-continuity.ts`
- Create: `src/engine/resolver/validate-bridge-intent.ts`
- Create: `src/engine/resolver/detect-slide-reset.ts`
- Create: `src/engine/resolver/validate-camera-intent.ts`
- Create: `src/engine/resolver/continuity-diagnostics.ts`
- Create: `tests/continuity/valid-continuity.test.ts`
- Create: `tests/continuity/invalid-slide-deck.test.ts`
- Create: `tests/continuity/chapter-cut.test.ts`
- Create: `tests/continuity/bridge-intent.test.ts`
- Create: `tests/continuity/directional-push.test.ts`
- Create: `tests/fixtures/specs/valid-continuity.json`
- Create: `tests/fixtures/specs/invalid-slide-deck.json`
- Create: `tests/fixtures/specs/invalid-tiny-anchor.json`
- Create: `tests/fixtures/specs/justified-chapter-cut.json`

**Interfaces:**
- Consumes: validated `TreatmentSpec` and `MotionSpec`.
- Produces:

```ts
export function validateReferences(spec: MotionSpec): Diagnostic[];
export function validateContinuity(treatment: TreatmentSpec, spec: MotionSpec): Diagnostic[];
export function validateBridgeIntent(spec: MotionSpec): Diagnostic[];
export function detectSlideReset(spec: MotionSpec): Diagnostic[];
export function validateCameraIntent(spec: MotionSpec): Diagnostic[];
```

- [ ] **Step 1: Create the three canonical fixtures**

`valid-continuity.json` has three Beats and two bridges: the same hero node persists through all Beats, one bridge is `shared-element`, the other is `camera-navigation`, and the camera alternates hold/move/hold.

`justified-chapter-cut.json` has three Beats, one ordinary bridge and one `chapter-cut` with reason `time-jump`, a non-empty exception justification and outgoing/incoming eye-trace points.

`invalid-slide-deck.json` has four equal-duration Beats, three chapter cuts, no salient persistent anchor, near-total declared focal/full-frame area replacement at each boundary and reasons equal to “next scene.” It must fail even if many tiny decorative nodes are added to manipulate raw node counts.

`invalid-tiny-anchor.json` keeps one small decorative dot alive while replacing the outgoing and incoming focal/full-frame content. Its nominal shared-element declaration must not waive the reset and must emit `ANCHOR_NOT_SALIENT` plus `SLIDE_LIKE_CUT_PATTERN`.

- [ ] **Step 2: Write failing diagnostic tests**

Assert exact codes:

```ts
expect(codes(validateContinuity(validTreatment, validSpec))).toEqual([]);
expect(codes(validateContinuity(cutTreatment, justifiedCut))).not.toContain('UNJUSTIFIED_CHAPTER_CUT');
expect(codes(validateContinuity(cutTreatment, missingReason))).toContain('UNJUSTIFIED_CHAPTER_CUT');
expect(codes(validateContinuity(cutTreatment, missingAnchor))).toContain('CONTINUITY_ANCHOR_MISSING');
expect(codes(validateContinuity(zeroBudgetTreatment, justifiedCut))).toContain('CHAPTER_CUT_BUDGET_EXCEEDED');
expect(codes(validateContinuity(oneBudgetTreatment, twoNonAdjacentCuts))).toContain('CHAPTER_CUT_V1_LIMIT_EXCEEDED');
expect(codes(validateContinuity(cutTreatment, invalidSlides))).toEqual(expect.arrayContaining([
  'CONSECUTIVE_CHAPTER_CUTS',
  'SLIDE_LIKE_CUT_PATTERN',
]));
expect(codes(validateContinuity(validTreatment, noBridge))).toContain('BOUNDARY_BRIDGE_MISSING');
expect(codes(validateContinuity(validTreatment, twoBridges))).toContain('BOUNDARY_BRIDGE_MULTIPLE');
expect(codes(detectSlideReset(invalidTinyAnchor))).toEqual(expect.arrayContaining([
  'ANCHOR_NOT_SALIENT',
  'SLIDE_LIKE_CUT_PATTERN',
]));
expect(codes(validateContinuity(cutTreatment, eyeTraceJump))).toContain('EYE_TRACE_JUMP');
expect(codes(validateContinuity(validTreatment, declaredSharedWithoutTrackMotion))).toContain('BRIDGE_REALIZATION_MISMATCH');
expect(codes(validateContinuity(validTreatment, unexplainedCameraAndNodeTransform))).toContain('TRANSFORM_OWNERSHIP_CONFLICT');
expect(codes(validateContinuity(validTreatment, oneFrameCopyReplacement))).toContain('CONTENT_STATE_POP');
expect(codes(validateContinuity(validTreatment, validForwardPush))).not.toContain('BRIDGE_REALIZATION_MISMATCH');
expect(codes(validateContinuity(validTreatment, backwardMotionDeclaredForward))).toContain('BRIDGE_REALIZATION_MISMATCH');
```

These negative cases live in `bridge-intent.test.ts` and call the exported `validateContinuity()` entry point, proving that it delegates to `validateBridgeIntent()` instead of testing that helper in isolation. `directional-push.test.ts` also creates a repeated full-page push sequence and proves it still emits `SLIDE_LIKE_CUT_PATTERN`; a direction label cannot legalize slide rhythm.

- [ ] **Step 3: Run tests and verify Red**

Run: `pnpm vitest run tests/continuity`

Expected: FAIL because the validators do not exist.

- [ ] **Step 4: Implement reference and bridge validation**

Require ordered unique Beat IDs, positive Beat durations, valid `settleAt`/`holdRange`, exactly one bridge for every adjacent pair, no non-adjacent bridge, valid node/camera references and valid segment references. A shared-element bridge must identify one node used and visibly continuous in both Beats; exact shared-element/morph geometry cannot cross between world and screen spaces in V1. `morph-into-target` must name a real target node, positive preroll and a target content/geometry state. `camera-navigation` must name a move segment and a non-empty spatial relationship. Verify that every ordinary transition family appears in the Treatment vocabulary, at most one bridge is marked `signature`, and actual chapter-cut count does not exceed the Treatment budget.

`validateBridgeIntent()` cross-checks each declaration against source tracks rather than trusting its label: the shared node must have a continuous geometry/visibility track through the bridge; the referenced camera move must span the camera-navigation bridge; morph target visibility must begin during preroll and remain frozen until takeover; match-on-action must have the declared action at `actionAt`; directional pushes must agree with semantic direction. A bridge that declares both camera and node transform ownership must explain the combined semantic action; otherwise emit `TRANSFORM_OWNERSHIP_CONFLICT`. A content state change inside any bridge must name one of the allowed content-transition modes instead of popping on one frame. Independently of the Treatment value, more than one `chapter-cut` emits `CHAPTER_CUT_V1_LIMIT_EXCEEDED`.

Emit these stable errors where applicable:

```text
BOUNDARY_BRIDGE_MISSING
BOUNDARY_BRIDGE_MULTIPLE
BRIDGE_BEAT_MISMATCH
SHARED_NODE_NOT_PERSISTENT
TARGET_STATE_MISSING
CONTINUITY_ANCHOR_MISSING
UNJUSTIFIED_CHAPTER_CUT
CONSECUTIVE_CHAPTER_CUTS
CHAPTER_CUT_BUDGET_EXCEEDED
CHAPTER_CUT_V1_LIMIT_EXCEEDED
EYE_TRACE_JUMP
TRANSITION_VOCABULARY_EXCESS
BRIDGE_REALIZATION_MISMATCH
TRANSFORM_OWNERSHIP_CONFLICT
CONTENT_STATE_POP
```

- [ ] **Step 5: Implement slide-reset detection**

For each boundary, evaluate visibility tracks at the outgoing/incoming Beats' declared settled frames. An ordinary boundary is blocking when the focal/full-frame content resets without a meaningful persistent anchor, camera relation or match-on-action. Raw node count is only an auxiliary signal: the decision weights semantic role, focal/ancestor relationship, opacity, declared geometry coverage, z-order/full-frame-container role and a layout-structure fingerprint. An anchor must be a focal node, a focal ancestor or contribute at least 10% of weighted salient visible area on both sides. A tiny decorative node cannot waive a full-page reset. Task 6 repeats this test with resolved world-space bounds and projected visible area.

A chapter cut can waive one boundary only when its reason enum, exception justification, matched eye-trace anchors and Treatment budget are valid. Normalize both anchors against the canvas, compute their Euclidean distance and emit `EYE_TRACE_JUMP` when it exceeds the required bridge value; the declared value itself must be in `(0, 0.15]`. Two adjacent chapter cuts always block. Repeated equal Beat durations plus repeated full-frame replacement adds `SLIDESHOW_RHYTHM` as a warning.

The algorithm uses semantic roles, focal relationships, source tracks and declared anchors; it does not guess from component names. Emit `ANCHOR_NOT_SALIENT` when the only surviving anchor is decorative or unrelated to either Beat's focal hierarchy.

- [ ] **Step 6: Implement camera-intent validation**

One camera track named `main-camera` is required. Moves use `pan`, `zoom` or `orbit`, a non-linear easing and a non-empty `reveals` statement. Reject simultaneous large pan, zoom and rotation not represented by the declared primary verb as `CAMERA_MULTI_VERB`; reject discontinuous state endpoints as `CAMERA_TELEPORT`. Report `CAMERA_ALWAYS_MOVING` as a warning when a film has no meaningful hold, not as a universal timing error.

- [ ] **Step 7: Run the continuity gate**

```bash
pnpm vitest run tests/continuity
pnpm typecheck
pnpm lint
```

Expected: valid continuity and one justified cut PASS; the slide-deck fixture deterministically emits the blocking cut/reset diagnostics.

- [ ] **Step 8: Commit**

```bash
git add src/engine/resolver tests/continuity tests/fixtures/specs
git commit -m "feat: validate continuity-first motion specs"
```

---

### Task 6: Resolve Beats, Global Tracks, Camera Motion and Capability Bindings

**Files:**
- Create: `src/engine/resolver/types.ts`
- Create: `src/engine/resolver/resolve-timeline.ts`
- Create: `src/engine/resolver/resolve-node-tracks.ts`
- Create: `src/engine/resolver/resolve-camera-track.ts`
- Create: `src/engine/resolver/validate-resolved-continuity.ts`
- Create: `src/engine/resolver/validate-bridge-realization.ts`
- Create: `src/engine/resolver/bind-capabilities.ts`
- Create: `src/engine/resolver/resolve-motion.ts`
- Create: `src/engine/resolver/index.ts`
- Create: `tests/resolver/timeline.test.ts`
- Create: `tests/resolver/node-tracks.test.ts`
- Create: `tests/resolver/camera-track.test.ts`
- Create: `tests/resolver/resolved-continuity.test.ts`
- Create: `tests/resolver/determinism.property.test.ts`
- Create: `tests/resolver/fake-layout-service.ts`

**Interfaces:**
- Consumes: validated Brief/Treatment/Motion specs, capability/style catalogs and a caller-injected `LayoutService`; this task's unit tests use a deterministic `FakeLayoutService`, while Task 7 wires the production browser-measured implementation.
- Produces:

```ts
export type TimelineSegment = {
  id: string;
  kind: 'beat' | 'bridge';
  from: number;
  to: number;
};
export type LayoutService = {
  resolveNode(node: PersistentNode, context: LayoutContext): ResolvedNodeLayout;
};
export function resolveTimeline(spec: MotionSpec): ResolvedTimeline;
export function validateResolvedContinuity(ir: ResolvedMotionIR): Diagnostic[];
export function validateBridgeRealization(spec: MotionSpec, ir: ResolvedMotionIR): Diagnostic[];
export function resolveMotion(input: ResolveMotionInput): ResolveMotionResult;
```

- [ ] **Step 1: Write failing timeline tests**

For Beats of `90`, `120`, `60` frames and bridges of `20`, `30` frames, assert exact half-open windows:

```ts
expect(resolveTimeline(spec).segments).toEqual([
  {id: 'hook', kind: 'beat', from: 0, to: 90},
  {id: 'hook-to-proof', kind: 'bridge', from: 90, to: 110},
  {id: 'proof', kind: 'beat', from: 110, to: 230},
  {id: 'proof-to-cta', kind: 'bridge', from: 230, to: 260},
  {id: 'cta', kind: 'beat', from: 260, to: 320},
]);
expect(resolveTimeline(spec).durationInFrames).toBe(320);
```

A `chapter-cut` has `durationFrames: 0`, consumes no render frame and resolves to an explicit `cutAtFrame` between the outgoing final frame and incoming first frame. Reject non-chapter zero durations, negative durations and any total not exactly equal to `Math.round(brief.durationSeconds * spec.canvas.fps)`.

- [ ] **Step 2: Run resolver tests and verify Red**

Run: `pnpm vitest run tests/resolver`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Implement timeline and time-reference resolution**

Resolve segments in strict Beat/Bridge order. Map `{segmentId, progress}` to an integer frame with:

```ts
const frame = segment.from + Math.round(progress * Math.max(0, segment.to - segment.from - 1));
```

`progress: 0` maps to the first frame; `progress: 1` maps to the last rendered frame. A zero-frame chapter cut cannot be referenced by a keyframe, but its resolved `cutAtFrame` is available to QC. For an exact handoff, the terminal bridge value at `to - 1` and the immediate incoming value at `to` must be explicitly equal; a later settled frame is not an endpoint substitute. Preserve source ordering only after verifying frames are non-decreasing; duplicate-frame keyframes are allowed only when their interpolation is `hold` and values are equal.

- [ ] **Step 4: Implement persistent node-track resolution**

Resolve every declared node once. Geometry is parent-local; compose parent matrices deterministically and store resolved world-space bounds for continuity/QC. Split nodes explicitly into `world` and `screen` layers: only world-space nodes receive the camera transform, while persistent overlays remain screen-space. Convert all geometry/style/content/visibility keyframes to global frames, validate the injected `LayoutService` result, and attach one stable key equal to `node.id`. A node absent from a Beat is hidden through its visibility track, never omitted from `ResolvedMotionIR.nodes`. Reject duplicate IDs, missing parent groups, parent cycles, ambiguous coordinate spaces and channel conflicts. `tests/resolver/fake-layout-service.ts` returns explicit fixture rectangles/text lines only; it is never exported by production code and cannot become a runtime fallback.

- [ ] **Step 5: Implement the global camera track**

Resolve holds and moves to contiguous global frame ranges. The first camera state starts at frame `0`; the final state covers the last frame. Move endpoints must equal adjacent hold states within `1e-6`. Preserve the declared primary verb and easing; do not add automatic drift. Emit camera velocity samples for QC.

- [ ] **Step 6: Validate resolved bridge realization and emit handoff contracts**

After layout, `validateBridgeRealization(spec, ir)` uses resolved world bounds, opacity-weighted projected area, focal importance and layout fingerprints to rerun slide-reset and anchor-salience checks. It proves each bridge's declared action is realized by its node/camera/content tracks; a tiny decorative survivor cannot satisfy continuity. It rejects unexplained simultaneous camera and node transforms and single-frame content replacement, emitting `BRIDGE_REALIZATION_MISMATCH`, `ANCHOR_NOT_SALIENT`, `TRANSFORM_OWNERSHIP_CONFLICT` or `CONTENT_STATE_POP` as applicable. Runtime identity tests and rendered QC separately emit `CAPABILITY_ROOT_REMOUNTED` when an implementation breaks stable roots. Emit typed handoff checks with immediate adjacent frames and a resolved anchor mask: `exact-visual` only for pixel-locked takeover, `geometry-only` for shared bounds, `continuous-motion` for camera/match action, and `chapter-cut-evidence` for the outgoing/incoming cut pair plus both normalized points, declared maximum and measured distance.

- [ ] **Step 7: Bind exact capability versions**

For each node, resolve its base renderer and every ordered effect as exact `id@version+implementationHash` entries through `CapabilityRegistry`. Resolve every effect's declared `SegmentRange` to global frames, parse renderer/effect props, call each pure effect resolver with a frozen context, and reject equal owned channels only when their resolved frame windows overlap. Record exact scope/version/implementation hash, range and effect order in ResolvedMotionIR and RenderPlan, so a code change changes the RenderPlan hash even if someone forgets to bump the semantic version. A missing definition returns `CAPABILITY_GAP`; the resolver cannot substitute or create code.

- [ ] **Step 8: Implement orchestration and property tests**

`resolveMotion()` runs contract validation, source continuity validation, injected layout, node/camera track resolution, resolved continuity/bridge-realization validation and renderer/effect binding in that order. Any Error returns no IR. Warnings remain attached. These tests explicitly pass `FakeLayoutService`; no Task 7 module is imported yet.

Use fast-check to generate valid small timelines and prove:

```ts
expect(result.durationInFrames).toBe(sumBeatFrames + sumNonCutBridgeFrames);
expect(result.nodes.map((n) => n.id)).toHaveLength(new Set(result.nodes.map((n) => n.id)).size);
expect(sha256Canonical(resolveMotion(input))).toBe(sha256Canonical(resolveMotion(input)));
```

Run at least 500 generated cases with a fixed property-test seed in the local release gate.

- [ ] **Step 9: Run the resolver gate**

```bash
pnpm vitest run tests/resolver
pnpm typecheck
pnpm lint
```

Expected: all unit/property tests PASS; the same source bytes resolve to the same IR hash.

- [ ] **Step 10: Commit**

```bash
git add src/engine/resolver tests/resolver
git commit -m "feat: resolve global motion and camera tracks"
```

---

### Task 7: Add Deterministic Typography, Layout and Local Asset Handling

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `src/engine/resolver/resolve-motion.ts`
- Create: `src/engine/project/asset-store.ts`
- Create: `src/engine/project/materialize-render-assets.ts`
- Create: `src/engine/project/sanitize-svg.ts`
- Create: `src/engine/project/font-manifest.ts`
- Create: `src/engine/resolver/layout-catalog.ts`
- Create: `src/engine/resolver/resolve-layout.ts`
- Create: `src/engine/renderer/resolve-layout-artifact.ts`
- Create: `src/engine/resolver/resolve-typography.ts`
- Create: `src/engine/runtime/LayoutProbeComposition.tsx`
- Create: `src/engine/runtime/LayoutProbeRoot.tsx`
- Create: `src/engine/runtime/layout-probe-entry.tsx`
- Create: `src/engine/runtime/load-fonts.ts`
- Create: `scripts/verify-browser.mjs`
- Create: `public/fonts/NotoSansSC.woff2`
- Create: `public/fonts/NotoSansTC.woff2`
- Create: `public/generated-assets/.gitkeep`
- Create: `assets/fonts/README.md`
- Create: `assets/licenses/OFL-Noto-Sans.txt`
- Create: `tests/assets/asset-store.test.ts`
- Create: `tests/assets/sanitize-svg.test.ts`
- Create: `tests/layout/layout-resolution.test.ts`
- Create: `tests/layout/typography.test.ts`
- Create: `tests/layout/browser-layout-integration.test.ts`
- Create: `tests/fixtures/assets/safe-logo.svg`
- Create: `tests/fixtures/assets/unsafe-logo.svg`

**Interfaces:**
- Consumes: project-owned local assets, declared font IDs and semantic layout slots.
- Produces: a content-addressed Asset Manifest, Font Manifest and exact node rectangles/text lines for the Resolver.

- [ ] **Step 1: Add the Remotion layout package and local font packages**

Add exact dependencies:

```json
{
  "@fontsource-variable/noto-sans-sc": "5.3.0",
  "@fontsource-variable/noto-sans-tc": "5.3.0",
  "@remotion/layout-utils": "4.0.495"
}
```

Copy the packages' declared variable WOFF2 files byte-for-byte to the stable tracked names under `public/fonts/`, record package path/version and SHA-256 in `assets/fonts/README.md`, and copy the packages' OFL license text into `assets/licenses/OFL-Noto-Sans.txt`. Render-time font downloads and system-font fallback are forbidden.

Add `"verify:browser": "node --import tsx scripts/verify-browser.mjs"`. The script locates and launches the Remotion-managed local browser, loads a local blank page and exits non-zero as `ENV_BROWSER_MISSING` or `ENV_BROWSER_LAUNCH_FAILED`; it does not browse the Web. Installation instructions may run `pnpm exec remotion browser ensure` before this preflight.

- [ ] **Step 2: Write failing asset safety tests**

Assert that the Asset Store accepts local PNG/JPEG/WebP and `safe-logo.svg`, computes MIME/width/height/SHA-256 and rejects:

```text
http:// or https:// path
file outside the selected project
SVG <script>
SVG <foreignObject>
onload/onerror/event attributes
external href/xlink:href
CSS url(...)
data: URL
symlink or realpath escaping the selected project asset root
file larger than 20 MB
```

`unsafe-logo.svg` includes representative forbidden elements and must fail with `ASSET_SVG_UNSAFE`.

- [ ] **Step 3: Write failing layout and typography tests**

Tests cover `center-stack`, `full-frame-type`, `top-copy-bottom-visual`, `split`, `stat-focus` and `diagram-flow`. Assert normalized source slots resolve inside the safe area, children remain inside parents, collisions produce `LAYOUT_COLLISION`, and missing glyphs produce `FONT_GLYPH_MISSING` rather than a silent fallback.

Chinese tests verify punctuation does not begin a line, Latin words do not split arbitrarily, mixed Chinese/English uses the declared locale font, and text fitting either returns a size at/above the declared minimum or emits `TEXT_OVERFLOW`. The browser integration renders `LayoutProbeComposition`, waits for both packaged faces through `document.fonts.ready`, captures its typed layout artifact, and asserts its font hashes/rectangles/line breaks are stable across two runs.

- [ ] **Step 4: Run tests and verify Red**

Run: `pnpm vitest run tests/assets tests/layout`

Expected: FAIL because asset/layout services do not exist.

- [ ] **Step 5: Implement the local Asset Store and SVG allowlist**

Use `lstat`/`realpath`, MIME sniffing and Sharp metadata for raster images. Reject symlinks and require the canonical source to remain under the selected project import root before copying accepted assets into the project-owned asset directory under their content hash. The source record stores only `{assetId, relativePath, mime, width, height, sha256, sourceDeclaration, licenseStatus}`. `licenseStatus` is exactly `user-owned | licensed | open-license | unknown`; `unknown` may be analyzed as a reference but cannot enter a Final Render. Never expose the caller's absolute path to RenderPlan.

`materializeRenderAssets()` re-verifies the source hash and atomically copies each approved raster/sanitized SVG into `public/generated-assets/<sha256>/<safe-basename>` inside the same repository before layout/bundling. `.gitignore` ignores everything under that directory except `.gitkeep`; the source asset and manifest remain authoritative. The derived render-safe manifest adds only `{assetId, sha256, staticFilePath, mime, width, height}`, where `staticFilePath` is a canonical slash-separated path beneath `generated-assets/`. It rejects collisions, stale bytes, symlinks and `unknown` licenses. Base renderers call `staticFile(staticFilePath)`; they never point at `projects/` or an arbitrary filesystem path. Tests prove a sanitized SVG and raster are reachable through the probe/render server and that changed bytes cannot reuse an old static path.

The SVG sanitizer is deliberately conservative: parse text, reject the forbidden constructs above, require a finite `viewBox`, permit only local fragment references and write a normalized project-owned copy. It does not attempt to repair unsafe SVG.

- [ ] **Step 6: Implement layout and typography resolution**

Each layout preset is a pure function of canvas, safe area, node roles and style tokens. Production typography is a deterministic pre-render probe. `layout-probe-entry.tsx` calls `registerRoot(LayoutProbeRoot)`; that root registers a fixed `LayoutProbe` Composition independently of the main project Root, so Task 7 can select it before Task 8 exists. `resolve-layout-artifact.ts` bundles that dedicated entry with `publicDir: <repoRoot>/public`, calls Remotion `renderStill()` for `LayoutProbe`, and passes the candidate layout payload as input props. After packaged fonts are ready, the composition measures declared candidate lines with browser Canvas/SVG plus `@remotion/layout-utils` and emits one typed `layout-artifact@1` through Remotion's `onArtifact` callback. The Node caller captures the artifact bytes in memory, verifies revision/source/font/asset hashes, and returns a `BrowserLayoutService` result to `resolveMotion()`. Missing, duplicate or stale artifacts block resolution. The layout artifact hash is embedded into ResolvedMotionIR/RenderPlan; after the plan hash exists, Task 9 persists those same captured bytes inside the plan's immutable output directory. The output records exact lines, font metrics, rectangles and `fontFileHash`; the final Runtime receives no instruction to “fit if needed” and performs no measurement fallback.

`load-fonts.ts` loads only the packaged local WOFF2 files through Remotion's static asset mechanism and uses `delayRender`/`continueRender`; missing fonts fail the render.

Modify `resolve-motion.ts` only after the browser integration passes: CLI production calls construct `BrowserLayoutService`, while unit callers must still inject a service explicitly. There is no implicit default.

- [ ] **Step 7: Run the typography/asset gate**

```bash
pnpm install
pnpm exec remotion browser ensure
pnpm verify:browser
pnpm vitest run tests/assets tests/layout
pnpm typecheck
pnpm lint
```

Expected: PASS; the standalone `LayoutProbe` is selectable, sanitized local assets load from the generated public path, unsafe/remote assets and missing glyphs are blocking, and identical inputs produce identical layout hashes.

- [ ] **Step 8: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml scripts/verify-browser.mjs src/engine/project src/engine/resolver src/engine/renderer src/engine/runtime public/fonts public/generated-assets/.gitkeep assets tests/assets tests/layout tests/fixtures/assets
git commit -m "feat: add deterministic layout fonts and assets"
```

---

### Task 8: Compile a Canonical RenderPlan and Render One Persistent World

**Files:**
- Modify: `package.json`
- Create: `src/engine/compiler/compile-node-tracks.ts`
- Create: `src/engine/compiler/compile-camera-track.ts`
- Create: `src/engine/compiler/compile-continuity.ts`
- Create: `src/engine/compiler/compile-motion.ts`
- Create: `src/engine/compiler/validate-render-plan.ts`
- Create: `src/engine/compiler/index.ts`
- Create: `src/engine/runtime/easing.ts`
- Create: `src/engine/runtime/evaluate-track.ts`
- Create: `src/engine/runtime/offline-guard.ts`
- Create: `src/engine/runtime/MotionComposition.tsx`
- Create: `src/engine/runtime/PersistentWorld.tsx`
- Create: `src/engine/runtime/CameraHost.tsx`
- Create: `src/engine/runtime/ScreenSpaceHost.tsx`
- Create: `src/engine/runtime/PersistentNodeHost.tsx`
- Create: `src/engine/runtime/NodeRendererHost.tsx`
- Create: `src/engine/runtime/EffectStackHost.tsx`
- Create: `src/capabilities/base/image-node.tsx`
- Modify: `src/capabilities/base/index.ts`
- Modify: `src/generated/core-capability-manifest.ts`
- Create: `src/engine/runtime/index.ts`
- Create: `src/generated/engine-build-manifest.ts`
- Create: `scripts/build-engine-manifest.mjs`
- Modify: `src/index.ts`
- Modify: `src/Root.tsx`
- Create: `tests/compiler/compiler.test.ts`
- Create: `tests/compiler/render-plan-determinism.test.ts`
- Create: `tests/runtime/track-evaluator.test.ts`
- Create: `tests/runtime/persistent-world.test.tsx`

**Interfaces:**
- Consumes: a valid `ResolvedMotionIR`.
- Produces:

```ts
export function compileMotion(ir: ResolvedMotionIR, build: EngineBuildIdentity): RenderPlan;
export function validateRenderPlan(plan: RenderPlan): Diagnostic[];
export function evaluateTrack<T>(track: RenderTrack<T>, frame: number): T;
export const MotionComposition: React.FC<{plan: RenderPlan}>;
```

- [ ] **Step 1: Write failing compiler/runtime tests**

Assert that compilation:

```ts
expect(plan.durationInFrames).toBe(ir.durationInFrames);
expect(plan.nodes.map((n) => n.key)).toEqual(ir.nodes.map((n) => n.id));
expect(plan.camera.id).toBe('main-camera');
expect(plan.nodes).toHaveLength(ir.nodes.length);
expect(JSON.stringify(plan)).not.toContain('Sequence');
expect(sha256Canonical(compileMotion(ir, fixtureBuildIdentity))).toBe(
  sha256Canonical(compileMotion(ir, fixtureBuildIdentity)),
);
```

Runtime tests mount one renderer instance and update its frame through Beat/Bridge boundaries to prove every node's outer root and declared continuity subnodes retain object identity; separately rendering unrelated static trees is not accepted evidence. They use a spy base renderer plus two disjoint-channel effects, assert ordered effect composition, reject overlapping same-channel effect ranges and fail when a renderer/effect replaces a continuity root or key during a content-state change. Track tests cover hold, `easeOutExpo`, `easeOutQuart`, `easeInOutQuint`, clamping and exact terminal values.

The plan-string assertion above is only a data check. A separate architecture test walks the static production import graph rooted at `MotionComposition.tsx`, reads every runtime module and fails if it imports a Beat/Scene host or uses Remotion `Sequence` to mount a full-frame Beat. This source-graph assertion is required evidence that the runtime itself cannot secretly reintroduce slide mounting.

- [ ] **Step 2: Run tests and verify Red**

Run: `pnpm vitest run tests/compiler tests/runtime`

Expected: FAIL because compiler/runtime modules do not exist.

- [ ] **Step 3: Add the local image renderer and bind the runtime build identity**

Add `base.image@1.0.0` as the stable renderer for a validated project-owned raster/SVG asset; it uses Remotion's load-aware local image primitive, contains no timing and never accepts a URL. Regenerate the core capability manifest. Then add `"engine:manifest": "node scripts/build-engine-manifest.mjs"` and `"engine:manifest:check": "node scripts/build-engine-manifest.mjs --check"`. The generator hashes the exact allowlisted browser Runtime/easing/host source graph separately from the Node-side layout/resolver/compiler/renderer source graph, plus `pnpm-lock.yaml` and pinned Node/React/Remotion versions, excluding mutable project data and generated project registries. It emits `EngineBuildIdentity` with `runtimeImplementationHash`, `renderToolingImplementationHash`, `lockfileHash` and exact tool versions. A not-yet-created allowlisted directory contributes a canonical empty-directory sentinel; when Task 9 adds renderer files, regenerating the manifest necessarily changes `renderToolingImplementationHash`. Handwritten or stale values fail `--check`.

Every RenderPlan embeds that identity plus each bound renderer/effect implementation hash. Therefore a browser runtime, Node renderer/tooling or capability implementation change changes the RenderPlan content hash and derived output directory; bundle-cache invalidation is not the only safety mechanism.

- [ ] **Step 4: Implement canonical track compilation**

Sort nodes by layer, `zIndex` then ID, sort keyframes by global frame, reject conflicting duplicate frames and emit compact typed tracks. Embed the verified build identity and the two exact silent output profiles in the plan. Preserve the Resolver's typed handoff contracts verbatim: source/target frames must be immediately adjacent, with resolved anchor mask and mode-specific metrics. The compiler does not invent pixel checks for camera/match-on-action bridges or alter copy, layout, duration, easing or capability selection.

`validateRenderPlan()` rejects unresolved refs, unknown capability bindings, non-finite values, missing frame coverage, duplicate node keys, multiple cameras, non-local asset references and channel conflicts.

- [ ] **Step 5: Implement pure track evaluation and easing**

Implement named easing functions directly from deterministic math. `evaluateTrack()` binary-searches neighboring keyframes, holds when declared, interpolates only schema-approved numeric/geometry/color values and returns exact endpoint objects at keyframe frames. Unknown easing is a compile-time validation error, never a runtime fallback.

- [ ] **Step 6: Implement the fixed PersistentWorld runtime**

`MotionComposition` reads the current frame and passes it through one `PersistentWorld`. `PersistentWorld` maps the complete `plan.nodes` array on every frame; it never filters a node out by Beat. World-space nodes render under the single `CameraHost`; screen-space nodes render under a persistent `ScreenSpaceHost` outside that transform. `PersistentNodeHost` evaluates visibility/geometry/style/content and keeps `key={node.key}`. `NodeRendererHost` selects the already-bound base renderer; `EffectStackHost` applies the ordered, already-resolved effect stack around that stable renderer. Both read only the generated static registry. Resolved global tracks realize continuity; runtime does not improvise a transition or use a scene-local clock.

No full-frame Beat `<Sequence>` is allowed. A node can be visually absent through opacity/off-canvas geometry, but it remains mounted. `CameraHost` applies the one global camera transform around the declared origin. Capability roots and declared continuity subnodes remain stable even when content changes; conditional replacement of those roots is a render-plan/runtime contract violation.

`offline-guard.ts` uses Remotion's environment signal and activates only when `isRendering` is true, never in Studio (so local HMR continues to work). Before the composition tree evaluates project capabilities, it installs a render-only Content Security Policy allowing scripts/styles/fonts/images only from the renderer's own origin plus required `data:`/`blob:` local forms, with `connect-src 'none'`, `frame-src 'none'`, `object-src 'none'` and no remote media origin. It also replaces browser `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`, `Image` construction and network-capable resource URL setters with deterministic `RUNTIME_NETWORK_FORBIDDEN` failures for every non-local target. Asset schemas/base renderers accept only validated `staticFile()` project assets; project capabilities cannot render their own image/video/script/link/iframe resource elements and the central closed-closure scanner rejects remote/dynamic resource APIs before materialization. After a render/still, the renderer inspects captured browser resource entries and fails if any URL is outside the loopback bundle origin or approved `data:`/`blob:` set. Tests prove Studio mode is untouched, local bundled/font/image loads still work, and representative fetch, beacon, dynamic image, script/link and remote-media attempts in render mode are blocked.

- [ ] **Step 7: Register project compositions**

Update `Root.tsx` to map only registry entries whose `plan` is non-null to Remotion `<Composition>` entries. Dimensions, fps, duration and default props come from that validated embedded RenderPlan. Unresolved/stale projects are omitted from Studio and reported by `motion validate/resolve`; Root never reads project files or rebuilds a plan during render.

- [ ] **Step 8: Run the compiler/runtime gate**

```bash
pnpm capabilities:manifest
pnpm engine:manifest
pnpm vitest run tests/compiler tests/runtime
pnpm typecheck
pnpm lint
```

Expected: PASS; the static Runtime import-graph scan finds no Beat/Scene host or Beat-level full-frame `Sequence`, and the production scan finds no network access, current-time calls or unseeded randomness in Runtime.

- [ ] **Step 9: Commit**

```bash
git add package.json scripts/build-engine-manifest.mjs src/generated src/capabilities/base src/engine/compiler src/engine/runtime src/index.ts src/Root.tsx tests/compiler tests/runtime
git commit -m "feat: compile and render a persistent motion world"
```

---

### Task 9: Add Local Validate, Resolve, Preview, Stills and Inspect Commands plus the Internal Final Renderer

**Files:**
- Modify: `scripts/build-engine-manifest.mjs`
- Modify: `src/generated/engine-build-manifest.ts`
- Create: `src/engine/renderer/bundle-runtime.ts`
- Create: `src/engine/renderer/render-preview.ts`
- Create: `src/engine/renderer/render-final.ts`
- Create: `src/engine/renderer/render-stills.ts`
- Create: `src/engine/renderer/assert-final-render-gate.ts`
- Create: `src/engine/renderer/create-render-manifest.ts`
- Create: `src/engine/renderer/index.ts`
- Create: `src/cli/commands/validate.ts`
- Create: `src/cli/commands/resolve.ts`
- Create: `src/cli/commands/preview.ts`
- Create: `src/cli/commands/stills.ts`
- Create: `src/cli/commands/inspect.ts`
- Modify: `src/cli/index.ts`
- Create: `tests/integration/cli-pipeline.test.ts`
- Create: `tests/integration/render-smoke.test.ts`
- Modify: `tests/helpers/create-test-repo-context.ts`
- Create: `tests/fixtures/repos/render-smoke/projects/test-project/project.json`
- Create: `tests/fixtures/repos/render-smoke/projects/test-project/brief.spec.json`
- Create: `tests/fixtures/repos/render-smoke/projects/test-project/treatment.json`
- Create: `tests/fixtures/repos/render-smoke/projects/test-project/motion.spec.json`
- Create: `tests/fixtures/repos/render-smoke/projects/test-project/revisions/rev-0001/*`

**Interfaces:**
- Consumes: a local project ID and its validated source artifacts.
- Produces: immutable content-addressed resolved/render artifacts, low-resolution preview, stills and an internally tested gate-enforced full-resolution render function. The public Final Render/Approval commands arrive only after QC and reviewer workflows exist in Task 13.

- [ ] **Step 1: Write failing CLI pipeline tests**

`createTestRepoContext()` is extended to copy the exact allowlisted engine trees (`package.json`, lockfile, `src/`, `public/` and `projects/_template/`) into a test-owned temporary repository root, then overlays `tests/fixtures/repos/render-smoke/projects/test-project`. Its project uses only the Task 4 base text/shape capabilities and a shared-element bridge. The helper rejects unrelated files and never points production code back to the active checkout. Inject that complete `RepoContext`, execute commands in order and assert:

```text
motion validate → exit 0, no Error diagnostics
motion resolve → writes motion.resolved.json and render.plan.json
motion inspect → prints revision/hash/duration/capabilities/bridges
motion preview → writes 540p/960p long-edge preview from the same RenderPlan hash
motion stills → writes requested exact frames
direct renderFinal() before gate → rejects with FINAL_GATE_INCOMPLETE before opening output
test writes schema-valid QC + Creative/Motion review + approval fixtures bound to preview/hash
direct renderFinal() → writes master-silent.mp4 at source dimensions
```

A stale source hash must make preview/render exit non-zero with `RENDER_PLAN_STALE`. Any changed revision, plan, preview, QC or review hash invalidates approval and makes final render fail. Test-authored gate artifacts use the same strict production contracts; there is no `--force`, environment bypass or test-only production branch.

- [ ] **Step 2: Run integration tests and verify Red**

Run: `pnpm vitest run tests/integration/cli-pipeline.test.ts tests/integration/render-smoke.test.ts`

Expected: FAIL because the commands and renderer do not exist.

- [ ] **Step 3: Implement deterministic validate and resolve commands**

Regenerate `engine-build-manifest.ts` after the Node renderer files exist and add a negative test proving that changing one renderer byte changes `renderToolingImplementationHash`, RenderPlan hash and output directory. `validate` parses all source artifacts and prints JSON diagnostics without creating a revision. `resolve` refuses any Error, a null current revision, source hashes that differ from the current immutable snapshot, or stale capability/engine build manifests. It injects the verified `EngineBuildIdentity`, computes the RenderPlan hash and writes the captured `layout.artifact.json`, `motion.resolved.json` and `render.plan.json` under `out/<project>/<revision>/<render-plan-hash>/` through the Artifact Store. It regenerates the static project registry with the validated current revision/plan/hash and updates no project source file. Production commands derive the same immutable `repoRoot` from the CLI module and reject URL-like inputs; integration tests call command functions with an isolated injected `RepoContext`, never a public root flag.

- [ ] **Step 4: Implement a reusable Remotion bundle and render functions**

Bundle only `<repoRoot>/src/index.ts` with `publicDir: <repoRoot>/public`; no command accepts another entry point or public directory. Before bundling, re-verify/materialize the RenderPlan's approved content-addressed assets and fonts, then reject any manifest path that is missing or outside that public directory. Cache by a canonical key over the complete statically resolved entry dependency graph bytes, public asset/font hashes, `pnpm-lock.yaml`, exact Node/React/Remotion versions, core renderer/effect registry, generated project registry and current RenderPlan hash. If the dependency graph cannot be proven complete, disable reuse for that invocation. Do not use a single source-file hash or Git cleanliness as a proxy.

`render-preview()` reads the RenderPlan's explicit preview profile (long edge `960`, H.264 CRF `28`, silent). `render-final()` reads its explicit final profile (source dimensions, H.264 CRF `18`, silent). The renderer has no hidden profile defaults. Outputs live under `out/<project>/<revision>/<render-plan-hash>/`. An existing output for the same hash is accepted only when its manifest and bytes verify; otherwise fail `ARTIFACT_COLLISION`. A changed plan/profile/build identity cannot overwrite an old preview/master. Both use the plan's fps/duration and never download assets.

`render-stills()` validates integer frames in `[0, duration)` and writes deterministic filenames `<frame>-<label>.png`.

`assertFinalRenderGate()` loads `technical-qc.json`, `creative-review.json`, `motion-review.json` and `preview-approval.json`, validates every envelope/hash binding against the selected revision, RenderPlan and preview bytes, requires QC `pass`, both reviews complete with `ship`, and approval `approved`. `renderFinal()` calls this guard before opening an output file. Task 9 intentionally does not register public `motion render` or `motion approve` commands, because the real QC and reviewer workflows do not exist until Tasks 10 and 13.

- [ ] **Step 5: Implement the Render Manifest and inspect command**

The manifest records project/revision, source/resolved/plan hashes, Node/pnpm/Remotion versions, dimensions, fps, frame count, codec/CRF, seed, renderer/effect versions, asset/font hashes, gate artifact hashes, output hash and command arguments. It contains no timestamp, username, absolute path or secret.

`inspect` prints only the stable project summary plus unresolved warnings.

- [ ] **Step 6: Run the local render gate**

```bash
pnpm vitest run tests/integration/cli-pipeline.test.ts tests/integration/render-smoke.test.ts
pnpm typecheck
pnpm lint
```

Expected: integration tests PASS. The suite creates one isolated complete repository fixture through internal `RepoContext` injection, uses the production command functions, then has ffprobe verify planned fps/duration/preview scale and no audio stream. Direct function tests prove final rendering is impossible without current bound QC, both reviews and approval, while the public CLI still exposes only validate/resolve/preview/stills/inspect and rejects root overrides.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-engine-manifest.mjs src/generated/engine-build-manifest.ts src/engine/renderer src/cli tests/integration tests/helpers tests/fixtures/repos
git commit -m "feat: add local motion preview and render core"
```

---

### Task 10: Prove the Seamless Kernel with Quantitative QC and the First Golden Film

**Files:**
- Create: `src/engine/qc/types.ts`
- Create: `src/engine/qc/technical-qc.ts`
- Create: `src/engine/qc/frame-sampler.ts`
- Create: `src/engine/qc/seam-check.ts`
- Create: `src/engine/qc/brightness-check.ts`
- Create: `src/engine/qc/dead-frame-check.ts`
- Create: `src/engine/qc/slide-reset-check.ts`
- Create: `src/engine/qc/camera-motion-check.ts`
- Create: `src/engine/qc/focal-content-check.ts`
- Create: `src/engine/qc/create-qc-report.ts`
- Create: `src/engine/qc/index.ts`
- Create: `src/cli/commands/qc.ts`
- Modify: `src/cli/index.ts`
- Create: `projects/golden-continuity/project.json`
- Create: `projects/golden-continuity/brief.spec.json`
- Create: `projects/golden-continuity/treatment.json`
- Create: `projects/golden-continuity/motion.spec.json`
- Create: `projects/golden-continuity/NOTES.md`
- Create: `projects/golden-continuity/EDIT_MAP.md`
- Create: `projects/golden-continuity/revisions/rev-0001/*`
- Create: `tests/qc/seam-check.test.ts`
- Create: `tests/qc/brightness-check.test.ts`
- Create: `tests/qc/slide-reset-render.test.ts`
- Create: `tests/golden/golden-continuity.test.ts`

**Interfaces:**
- Consumes: RenderPlan, rendered preview/stills and declared bridge handoff regions.
- Produces: hash-bound `review/technical-qc.json`, seam difference images, sampled review frames and a blocking/warning technical decision.

- [ ] **Step 1: Write failing QC metric tests**

Generate controlled PNG pairs and assert:

```ts
expect(compareCrop(identicalA, identicalB).psnrDb).toBeGreaterThan(60);
expect(compareCrop(shiftedA, shiftedB).maxGeometryDriftPx).toBeGreaterThan(1);
expect(findBrightnessDiscontinuities(smoothSeries)).toEqual([]);
expect(findBrightnessDiscontinuities([...smoothSeries, 2, 100])).toContainEqual(expect.objectContaining({code: 'SEAM_FLASH'}));
expect(detectDeadFrame(backgroundOnly, declaration).code).toBe('DEAD_FRAME_DETECTED');
expect(checkCameraMotion(continuousVelocity)).toEqual([]);
expect(checkCameraMotion(teleportVelocity)).toContainEqual(expect.objectContaining({code: 'CAMERA_JERK'}));
```

Brightness detection uses the median absolute deviation of adjacent-frame luminance deltas; it does not require constant YAVG during legitimate motion.

- [ ] **Step 2: Run QC tests and verify Red**

Run: `pnpm vitest run tests/qc`

Expected: FAIL because the QC modules do not exist.

- [ ] **Step 3: Implement technical, seam, brightness and dead-frame QC**

Technical QC re-runs schema/reference/continuity checks and validates output dimensions, fps, duration, codec, frame count, local assets and deterministic hashes.

Execute each typed handoff contract according to mode. `exact-visual` compares the final bridge frame with the immediately following rendered frame (or the explicitly frozen real-target frame), using its resolved mask; fail below `40dB` or above `1px` geometry drift. `geometry-only` checks resolved bounds, while `continuous-motion` checks trajectory/velocity continuity instead of pixel equality. `chapter-cut-evidence` recomputes normalized eye-trace distance from the bound outgoing/incoming anchor positions, records it and emits `EYE_TRACE_JUMP` when it exceeds the bridge limit. Scan a configurable window around every bridge for abnormal luminance delta and camera jerk.

Dead-frame QC combines pixels and semantics: fail when more than `99.5%` of pixels equal the declared bare background, or when the only surviving pixels belong to tiny decorative/non-focal nodes and there is no intentional full-frame background event. A nominal decorative anchor cannot make an otherwise blank frame pass.

`slide-reset-check` combines semantic source diagnostics with resolved focal-node bounds, opacity/area-weighted node replacement, layout fingerprints, frame difference and histograms. Histogram similarity/difference alone is never decisive. Visual evidence can strengthen but never waive an invalid source bridge.

- [ ] **Step 4: Implement the review-frame sampler and QC command**

For every Beat, export its declared settled frame and mid-hold frame. For every non-zero Bridge, export pre-motion, midpoint, terminal, immediate-next and next-held frames. A zero-frame `chapter-cut` is still sampled as outgoing final, incoming first and incoming held frames, with eye-trace and full-frame-change evidence. Generate a 0.25× speed review copy locally with FFmpeg. `motion qc` writes `out/<project>/<revision>/<render-plan-hash>/review/technical-qc.json` containing revision/plan/preview hashes, diagnostics, metric evidence, relative evidence paths and `pass | fail`. Re-running against changed preview bytes or a changed plan creates/requires a new bound report; it never blesses an older output.

- [ ] **Step 5: Author the 20-second Golden Film specification**

Create a `1920×1080`, `30fps`, `600`-frame project with five Beats and four Bridges:

```text
Hook type
→ same keyword becomes a product card
→ camera enters the card and reveals a dashboard
→ one dashboard chip expands into a chart
→ chart line resolves into logo + CTA
```

This first film intentionally uses only `base.text`, `base.shape`, `base.path` and `base.group`: the dashboard/chart are compositions of persistent base shapes/paths, and the final logo is a local sanitized path. It does not depend on the expanded capability pack from Tasks 11–12.

Requirements:

- zero chapter cuts and zero full-frame wipes;
- at least one node persists across three Beats;
- one shared-element bridge, one camera-navigation bridge, one morph-into-target bridge and one match-on-action bridge; `morph-into-target` is explicitly the sole `signature` transition, so the other three comprise the ordinary vocabulary;
- one world, one camera and stable node IDs;
- no more than three ordinary transition families;
- camera hold frames at least twice camera move frames for this fixture;
- one focal node per Beat;
- only code-rendered type, shape, path, chart and logo elements;
- no audio dependency.

- [ ] **Step 6: Write the Golden Film acceptance test**

The test validates, resolves and compiles the project; renders all bridge evidence plus the complete preview; and asserts:

```ts
expect(errors(report)).toEqual([]);
expect(plan.durationInFrames).toBe(600);
expect(plan.bridges.filter((b) => b.mode === 'chapter-cut')).toHaveLength(0);
expect(plan.bridges.filter((b) => b.vocabularyRole === 'signature')).toHaveLength(1);
expect(report.metrics.filter((m) => m.mode === 'exact-visual').length).toBeGreaterThan(0);
expect(report.metrics.filter((m) => m.mode === 'exact-visual').every((m) => m.psnrDb > 40)).toBe(true);
expect(report.diagnostics.map((d) => d.code)).not.toContain('DEAD_FRAME_DETECTED');
expect(report.diagnostics.map((d) => d.code)).not.toContain('SLIDE_LIKE_CUT_PATTERN');
expect(report.diagnostics.map((d) => d.code)).not.toContain('BRIDGE_REALIZATION_MISMATCH');
```

Render the same sampled frame twice and require SSIM at least `0.9997`; do not use MP4 file hashes as the visual determinism metric.

- [ ] **Step 7: Run the M1 hard gate**

```bash
pnpm vitest run tests/qc tests/golden/golden-continuity.test.ts
pnpm motion validate golden-continuity
pnpm motion resolve golden-continuity
pnpm motion preview golden-continuity
pnpm motion qc golden-continuity
pnpm check
```

Expected: all automated checks PASS and the review bundle exists. A human/agent cold review at 1× and 0.25× must confirm that it feels like one visual idea evolving, the eye never has to find a new slide, holds are readable and no transition looks decorative.

**Stop condition:** If the Golden Film feels like slides despite passing metrics, do not start Task 11. Record the visual failure in `NOTES.md`, revise the continuity model or runtime, rerender and repeat M1.

- [ ] **Step 8: Commit**

```bash
git add src/engine/qc src/cli src/generated/project-registry.ts projects/golden-continuity tests/qc tests/golden
git commit -m "feat: prove the continuity-first motion kernel"
```

---

### Task 11: Build the Core Text, Shape and Path Capability Pack

**Files:**
- Create: `src/capabilities/text/mask-rise.tsx`
- Create: `src/capabilities/text/word-stagger.tsx`
- Create: `src/capabilities/text/line-reveal.tsx`
- Create: `src/capabilities/text/tracking-resolve.tsx`
- Create: `src/capabilities/text/highlight-sweep.tsx`
- Create: `src/capabilities/text/word-replace.tsx`
- Create: `src/capabilities/text/index.ts`
- Create: `src/capabilities/shape/shape-reveal.tsx`
- Create: `src/capabilities/shape/geometry-morph.tsx`
- Create: `src/capabilities/path/path-draw.tsx`
- Create: `src/capabilities/path/connector-draw.tsx`
- Create: `src/capabilities/shape/index.ts`
- Create: `src/capabilities/path/index.ts`
- Modify: `src/capabilities/index.ts`
- Modify: `src/generated/core-capability-manifest.ts`
- Create: `tests/capabilities/text-capabilities.test.ts`
- Create: `tests/capabilities/shape-path-capabilities.test.ts`
- Create: `tests/capabilities/capability-visual-fixtures.test.ts`
- Create: `tests/visual-baselines/capabilities/**/*.png`
- Create: `tests/visual-baselines/capabilities/manifest.json`

**Interfaces:**
- Consumes: Capability API from Task 4 and resolved node geometry/content from Task 6.
- Produces: deterministic `MotionCapabilityDefinition` effect instances registered under exact `@1.0.0` IDs.

- [ ] **Step 1: Write failing manifest and behavior tests**

Assert the registry exposes exactly these initial IDs:

```ts
[
  'text.mask-rise', 'text.word-stagger', 'text.line-reveal',
  'text.tracking-resolve', 'text.highlight-sweep', 'text.word-replace',
  'shape.reveal', 'shape.geometry-morph',
  'path.draw', 'path.connector-draw',
]
```

For every definition, validate its fixture, render start/mid/end frames and assert it owns only declared channels, stays within its DOM/SVG budget and is byte-deterministic for a fixed frame/seed.

- [ ] **Step 2: Run capability tests and verify Red**

Run: `pnpm vitest run tests/capabilities`

Expected: FAIL because the implementations are absent.

- [ ] **Step 3: Implement the text capabilities**

All entrances use the capability's resolved frame window and named easing; none use CSS transitions or wall-clock time.

- `text.mask-rise`: clips one text block and resolves `translateY + opacity` to its exact held geometry.
- `text.word-stagger`: uses planner-supplied word tokens and per-token offsets; Chinese tokens are supplied by typography resolution rather than `split(' ')`.
- `text.line-reveal`: reveals pre-resolved text lines without reflow.
- `text.tracking-resolve`: resolves tracking to the Style Pack value while preserving measured final width.
- `text.highlight-sweep`: animates one masked highlight layer and leaves copy stationary.
- `text.word-replace`: crossfades/masks old and new resolved line boxes; a one-frame text pop is invalid.

Each intent schema defines duration, delay/stagger where applicable and a motion-profile default. Numeric ranges are validated safety bounds, not claims that every film should use one timing.

- [ ] **Step 4: Implement shape and path capabilities**

- `shape.reveal` interpolates validated geometry/opacity.
- `shape.geometry-morph` requires compatible source/target shape topology or returns `CAPABILITY_INPUT_UNSUPPORTED`; it never fakes an unrelated morph.
- `path.draw` uses measured SVG path length and stroke-dash progress.
- `path.connector-draw` resolves connector endpoints from declared node anchors and maintains them during camera/node movement.

The same-node geometry morph writes no replacement DOM identity. Path capabilities reject remote SVG and unsanitized path input.

- [ ] **Step 5: Register the pack and add visual fixtures**

Register all definitions in deterministic ID order and regenerate/verify `core-capability-manifest.ts` before tests. For each capability, render a small start/mid/end PNG set under ignored `out/test-fixtures/` during tests and compare geometry/pixels against reviewed, tracked baselines under `tests/visual-baselines/capabilities/` with a narrow threshold. `manifest.json` binds every baseline to capability/version/implementation hash, frame, canvas, font hashes and approved pixel tolerance. Baselines are reviewed before commit; generated test output remains ignored and can never serve as its own oracle.

- [ ] **Step 6: Run the core capability gate**

```bash
pnpm capabilities:manifest
pnpm vitest run tests/capabilities
pnpm typecheck
pnpm lint
```

Expected: PASS; capability renderers contain no network, current-time or unseeded-random calls.

- [ ] **Step 7: Commit**

```bash
git add src/capabilities src/generated/core-capability-manifest.ts tests/capabilities tests/visual-baselines/capabilities
git commit -m "feat: add core text shape and path motion"
```

---

### Task 12: Add Data, Diagram, UI, Identity and Ambient Motion with Three Style Packs

**Files:**
- Create: `src/capabilities/data/count-up.tsx`
- Create: `src/capabilities/data/bar-grow.tsx`
- Create: `src/capabilities/data/line-chart.tsx`
- Create: `src/capabilities/data/index.ts`
- Create: `src/capabilities/diagram/node-stagger.tsx`
- Create: `src/capabilities/diagram/flow-pulse.tsx`
- Create: `src/capabilities/diagram/index.ts`
- Create: `src/capabilities/ui/card-transform.tsx`
- Create: `src/capabilities/ui/progress-fill.tsx`
- Create: `src/capabilities/ui/cursor-cue.tsx`
- Create: `src/capabilities/ui/index.ts`
- Create: `src/capabilities/identity/logo-resolve.tsx`
- Create: `src/capabilities/identity/index.ts`
- Create: `src/capabilities/ambient/grain.tsx`
- Create: `src/capabilities/ambient/grid-parallax.tsx`
- Create: `src/capabilities/ambient/glow-field.tsx`
- Create: `src/capabilities/ambient/index.ts`
- Create: `src/styles/bold-editorial.ts`
- Create: `src/styles/clean-tech.ts`
- Create: `src/styles/playful-geometric.ts`
- Modify: `src/styles/index.ts`
- Modify: `src/capabilities/index.ts`
- Modify: `src/generated/core-capability-manifest.ts`
- Create: `projects/golden-kinetic/*`
- Create: `projects/golden-data/*`
- Create: `projects/golden-ui/*`
- Create: `tests/capabilities/domain-capabilities.test.ts`
- Create: `tests/styles/production-style-packs.test.ts`
- Create: `tests/golden/motion-language-matrix.test.ts`

**Interfaces:**
- Consumes: the common Capability/Style APIs and continuity-first engine.
- Produces: domain capability families, three visually distinct token packs and three non-slide Golden projects.

All Task 12 definitions are composable effects over persistent `base.text`, `base.shape`, `base.path` or `base.group` renderers. A chart, diagram, UI panel or logo is a stable graph of those nodes; no effect secretly becomes a second node renderer or mounts a whole Beat-sized scene.

- [ ] **Step 1: Write failing domain capability tests**

Test exact start/mid/end semantics:

```ts
expect(evaluateCountUp({from: 0, to: 100}, 0)).toBe(0);
expect(evaluateCountUp({from: 0, to: 100}, 1)).toBe(100);
expect(resolveBarGrow(negativeData)).toMatchObject({baseline: 0});
expect(() => resolveLineChart(unsortedX)).toThrow(/DATA_ORDER_INVALID/);
expect(resolveCardTransform(sharedNode).nodeId).toBe(sharedNode.id);
expect(resolveLogoResolve(unlicensedAsset)).toThrow(/ASSET_LICENSE_UNDECLARED/);
```

Ambient fixtures prove deterministic seeded output and enforce budgets; they may support the focal point but cannot become an unbounded particle simulation.

- [ ] **Step 2: Run tests and verify Red**

Run: `pnpm vitest run tests/capabilities/domain-capabilities.test.ts tests/styles/production-style-packs.test.ts`

Expected: FAIL because the definitions/style packs do not exist.

- [ ] **Step 3: Implement data and diagram motion**

`count-up`, `bar-grow` and `line-chart` consume already verified data and never invent a number. Diagram nodes keep stable IDs; connectors bind to node anchors; `flow-pulse` animates progress along an existing path. Data labels use resolved typography and preserve a readable final hold.

- [ ] **Step 4: Implement UI, identity and ambient motion**

`ui.card-transform` operates on one persistent node across compact/detail states. `ui.progress-fill` and `ui.cursor-cue` use exact event frames; a cursor cue cannot imply an unverified product action. `identity.logo-resolve` uses a sanitized, licensed local vector/shape and keeps its final state still. Grain, grid parallax and glow use seeded math and strict layer/blur budgets.

- [ ] **Step 5: Implement three data-only Style Packs**

- `bold-editorial@1.0.0`: high-contrast type-led hierarchy and restrained accent color.
- `clean-tech@1.0.0`: neutral stage, crisp geometry, cool accents and soft depth.
- `playful-geometric@1.0.0`: warmer palette, rounded shapes and more elastic but still bounded motion.

Each pack declares complete semantic color, typography, spacing, radius, shadow and motion tokens. No pack imports a capability or component. Regenerate the core capability implementation manifest after adding the domain definitions; stale hashes are blocking.

- [ ] **Step 6: Author the M2 Golden matrix**

Create:

1. `golden-kinetic`: text-led, no device frame, shared keyword/text morph and one held typographic payoff.
2. `golden-data`: diagram flows into a chart through persistent nodes and connector paths.
3. `golden-ui`: overview card expands into a UI detail through camera navigation and same-node transform.

Each uses a different Style Pack and motion family, has zero unjustified chapter cuts, and requires no new schema field or engine special case.

- [ ] **Step 7: Run the M2 gate**

```bash
pnpm capabilities:manifest
pnpm vitest run tests/capabilities tests/styles tests/golden/motion-language-matrix.test.ts
for id in golden-kinetic golden-data golden-ui; do
  pnpm motion resolve "$id"
  pnpm motion preview "$id"
  pnpm motion qc "$id"
done
```

Expected: all three projects pass schema, continuity, typography, render and slide-reset QC; their style-token/capability selections differ while the engine stays unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/capabilities src/generated/core-capability-manifest.ts src/generated/project-registry.ts src/styles projects/golden-kinetic projects/golden-data projects/golden-ui tests/capabilities tests/styles tests/golden
git commit -m "feat: expand the reusable motion language"
```

---

### Task 13: Create the Shared Codex and Claude Code Prompt OS

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `.claude/skills/video/SKILL.md`
- Create: `agent/video-workflow.md`
- Create: `agent/prompts/brief-planner.md`
- Create: `agent/prompts/researcher.md`
- Create: `agent/prompts/creative-direction.md`
- Create: `agent/prompts/motion-planner.md`
- Create: `agent/prompts/capability-builder.md`
- Create: `agent/prompts/revision-interpreter.md`
- Create: `agent/prompts/sound-designer.md`
- Create: `agent/reviewers/creative-reviewer.md`
- Create: `agent/reviewers/motion-reviewer.md`
- Create: `craft/index.md`
- Create: `craft/motion-craft.md`
- Create: `craft/continuity-first.md`
- Create: `craft/continuous-world.md`
- Create: `craft/kinetic-type.md`
- Create: `craft/data-motion.md`
- Create: `craft/ui-motion.md`
- Create: `craft/logo-motion.md`
- Create: `craft/sound-design.md`
- Create: `craft/delivery.md`
- Create: `docs/workflows/audio-handoff.md`
- Create: `src/cli/commands/approve.ts`
- Create: `src/cli/commands/render.ts`
- Modify: `src/cli/index.ts`
- Create: `docs/reviews/host-compatibility.md`
- Create: `tests/prompts/prompt-contracts.test.ts`
- Create: `tests/prompts/authority-boundaries.test.ts`
- Create: `tests/prompts/no-conflicting-workflow.test.ts`
- Create: `tests/integration/final-gate-cli.test.ts`

**Interfaces:**
- Consumes: a user request, current project artifacts, local assets/references and tool diagnostics.
- Produces: canonical artifacts or structured reviews; never an in-repo model call.

- [ ] **Step 1: Write failing Prompt Contract tests**

Define a Markdown contract parser that requires every role prompt to declare `Purpose`, `Reads`, `Writes`, `Must`, `Must not`, `Stop conditions` and `Output schema`. Assert:

```ts
expect(entrypointLinks('AGENTS.md')).toContain('agent/video-workflow.md');
expect(entrypointLinks('CLAUDE.md')).toContain('agent/video-workflow.md');
expect(role('researcher').writes).not.toContain('TreatmentSpec');
expect(role('creative-direction').writes).toEqual(['treatment.json']);
expect(role('motion-planner').writes).toEqual(['motion.spec.json']);
expect(role('motion-reviewer').writes).toEqual(['review/motion-review.json']);
expect(allPromptText).not.toMatch(/OPENAI_API_KEY|ANTHROPIC_API_KEY|call the model API/i);
```

The conflict test fails if two roles claim final authority over Brief, Treatment, MotionSpec, code, review or audio. It also scans `agent/`, `craft/` and `docs/workflows/audio-handoff.md` for imperative score-first alternatives (`score first`, `score-first`, `music first`, `cut to music first`), requires every Sound Designer/craft link to resolve to the one canonical locked-cut-first workflow, and proves no second audio order is declared.

In the same Red phase, `final-gate-cli.test.ts` specifies missing/stale/non-ship evidence rejection, one valid approval/final render, and invalidation after any bound byte changes. It uses the strict test artifacts from Tasks 2/9/10 and cannot bypass production command functions.

- [ ] **Step 2: Run Prompt Contract tests and verify Red**

Run: `pnpm vitest run tests/prompts tests/integration/final-gate-cli.test.ts`

Expected: FAIL because prompt files do not exist.

- [ ] **Step 3: Write thin host entry points**

`AGENTS.md`, `CLAUDE.md` and the Claude skill each state only how to invoke the local video workflow, the no-API/no-generated-media boundary and which canonical document to read next. They do not duplicate craft, schema or review rules.

Claude invocation may be `/video <brief>`; Codex invocation is an ordinary request such as “Use this repo to create …”. Both operate on the same project files and commands.

- [ ] **Step 4: Write the canonical workflow**

`agent/video-workflow.md` defines this exact state machine:

```text
INTAKE
→ FACT_CHECK
→ BRIEF
→ TREATMENT
→ MOTION_SPEC
→ VALIDATE
→ SNAPSHOT
→ RESOLVE
→ PREVIEW
→ TECHNICAL_QC
→ CREATIVE_AND_MOTION_REVIEW
→ BOUNDED_FIX
→ PREVIEW_GATE
→ SILENT_FINAL
→ AUDIO_PROMPT
→ OPTIONAL_LOCAL_MUX
→ DELIVERY
```

At intake, ask only for facts that cannot safely be inferred. Creative assumptions are written into BriefSpec. The orchestrator never designs or edits a frame; it delegates authority through the artifact contracts and stops at blocking diagnostics or an approval gate.

`SNAPSHOT` is used only once, when `currentRevisionId` is null. `BOUNDED_FIX` always creates a SemanticPatch/new revision through `motion revise --apply` and loops back through `VALIDATE → REVISION → RESOLVE → PREVIEW → TECHNICAL_QC → REVIEWS`; it may not call `snapshot` or reuse old evidence. After one structural repair or two visual repair rounds, unresolved blocking issues stop with a report instead of looping forever. A `rebuild` decision returns to Treatment/MotionSpec through an explicit SemanticPatch/new revision; it is never disguised as an untracked source edit.

- [ ] **Step 5: Write role prompts with non-overlapping authority**

- Researcher measures only supplied local sources, including reference-film timing/geometry; it never invents or selects a style.
- Brief Planner owns facts, purpose, audience, one message, CTA and constraints.
- Creative Direction owns treatment, `compositionMode`, motion profile, style pack and the restrained vocabulary within the fixed `seamless-default` continuity policy. It cannot change that policy.
- Motion Planner owns MotionSpec and must declare one bridge per boundary.
- Capability Builder activates only for a recorded gap and follows Task 14.
- Creative Reviewer checks first-view comprehension, message, focus, hook/payoff/CTA where applicable and aesthetic coherence.
- Motion Reviewer checks easing, holds, eye trace, persistent identity, camera path, seam evidence and slide-like rhythm.
- Reviewers report frame ranges, evidence, violated rule, severity and `ship | fix | rebuild`; each writes its strict hash-bound artifact under `out/<project>/<revision>/<render-plan-hash>/review/`. They never modify code/specs or approve their own review.
- Revision Interpreter writes a SemanticPatch and respects locks.
- Sound Designer follows only the Task 15 audio handoff.

- [ ] **Step 6: Write craft documents without rigid universal timing**

`continuity-first.md` makes the selected A policy normative: Beat ≠ slide; bridge priority; persistent nodes; target preroll; no dead frame; end state equals next start; rare justified chapter cuts; one transition vocabulary; meaningful camera hold/travel. It also states that narrative/emotional truth outranks geometric continuity: never invent an identity or spatial relationship just to avoid an honest chapter cut. `continuous-world.md` covers spatial narratives but is not forced when a shared-element, held-shot or match-on-action structure is more honest.

Other craft files define information hierarchy and domain-specific motion. Timing values are labeled starting ranges tied to a motion profile, never universal pass/fail numbers. Create the canonical `docs/workflows/audio-handoff.md` contract here with the only permitted order—approved locked silent cut, AudioBrief, user-operated third-party generation, optional returned local track, local alignment/mux. `sound-design.md` links to that one file and contains no competing score-first instruction. Task 15 fills in exact CLI details without changing the order.

- [ ] **Step 7: Expose Final Approval and Render only after the real gates exist**

Register `motion approve <id> --reviewed-plan <hash> --actor <human|codex|claude-code> --reason <text>` and `motion render <id>`. `approve` reloads the current revision, RenderPlan, preview bytes, passing Task 10 QC and both hash-bound reviewer artifacts; it rejects `fix`, `rebuild`, stale hashes and empty reason before writing `preview-approval.json`. The default workflow permits `--actor human`; a project may explicitly opt into host approval, in which case `codex` or `claude-code` is accepted only after both reviews say `ship`. This is an audit boundary for one local operator, not authentication.

`render` calls Task 9's `renderFinal()` and has no `--force`, environment bypass or alternate entry point. `tests/integration/final-gate-cli.test.ts` proves missing, stale or non-ship evidence blocks before an output file is created; one complete current gate produces the silent master; modifying any source/plan/preview/review/QC bytes invalidates approval.

- [ ] **Step 8: Run Prompt OS tests and two-host dry runs**

```bash
pnpm vitest run tests/prompts tests/integration/final-gate-cli.test.ts
pnpm verify:boundary
pnpm lint
pnpm typecheck
```

The commands above are the automated Prompt Contract gate. Separately, before a release that claims both-host compatibility, an operator performs manual dry runs in one available Codex session and one available Claude Code session against clean project fixtures. Both must normalize the same one-sentence brief without rendering, create schema-valid Brief/Treatment/MotionSpec artifacts, use no API key and invoke the same local validators. Record host/tool versions, commands, artifact hashes and pass/fail in `docs/reviews/host-compatibility.md`; creative output may differ, contracts and gates may not. This manual record is not simulated by Vitest, but both records are required for the compatibility claim.

For an actual film, the two reviewer prompts write current bound review artifacts. After technical QC and both reviews say `ship`, the user or explicitly authorized host runs the fully attributed `motion approve` command; any subsequent artifact change invalidates approval before `SILENT_FINAL`.

- [ ] **Step 9: Commit**

```bash
git add AGENTS.md CLAUDE.md .claude agent craft src/cli docs/reviews docs/workflows/audio-handoff.md tests/prompts tests/integration/final-gate-cli.test.ts
git commit -m "feat: add shared codex and claude motion workflow"
```

---

### Task 14: Add Semantic Revisions, Locks and Project-Local Capability Gaps

**Files:**
- Create: `src/engine/revision/validate-patch.ts`
- Create: `src/engine/revision/impact-analysis.ts`
- Create: `src/engine/revision/locks.ts`
- Create: `src/engine/revision/apply-semantic-patch.ts`
- Create: `src/engine/revision/create-revision.ts`
- Create: `src/engine/revision/index.ts`
- Modify: `src/engine/project/build-project-registry.ts`
- Create: `src/engine/project/validate-project-capabilities.ts`
- Create: `src/engine/project/materialize-project-capabilities.ts`
- Create: `src/cli/commands/revise.ts`
- Modify: `src/cli/index.ts`
- Create: `projects/_template/capabilities/README.md`
- Create: `tests/revision/patch-validation.test.ts`
- Create: `tests/revision/patch-locality.test.ts`
- Create: `tests/revision/locks.test.ts`
- Create: `tests/revision/rebuild.test.ts`
- Create: `tests/capability/project-local-capability.test.ts`
- Create: `tests/capability/project-local-boundary.test.ts`
- Create: `tests/integration/natural-language-revision-fixture.test.ts`

**Interfaces:**
- Consumes: a host-authored `SemanticPatch`, current source hashes and lock set.
- Produces: a new immutable revision, an exact impact report and optionally a project-scoped tested capability.

- [ ] **Step 1: Write failing patch/lock/locality tests**

Start with a four-Beat project, lock Beats 1, 3 and 4 through semantic targets such as `{entity: 'beat', id: 'beat-1'}`, then reorder the Beat array and patch Beat 2 copy/timing. Assert:

```ts
expect(validatePatch(patch, state).errors).toEqual([]);
expect(impact.changedPaths).toEqual([
  '/motion/timeline/beats/1/durationFrames',
  '/motion/world/nodes/headline/contentTrack',
]);
expect(afterHashes.beat1).toBe(beforeHashes.beat1);
expect(afterHashes.beat3).toBe(beforeHashes.beat3);
expect(afterHashes.beat4).toBe(beforeHashes.beat4);
expect(() => applySemanticPatch(touchesLockedBeat, state)).toThrow(/REVISION_LOCKED/);
expect(() => applySemanticPatch(staleBase, state)).toThrow(/REVISION_BASE_STALE/);
```

`project-local-boundary.test.ts` constructs separate closed capability manifests containing a bare network call, aliased/dynamic remote request, `process.env`, current time, unseeded randomness, `<Video>`, `<OffthreadVideo>` and a dynamic image/script/link resource. Every case must fail through the same Task 1 `scanProductionSource()` policy before materialization; a valid local effect with no resource element passes.

`rebuild.test.ts` specifies a `rebuild` that replaces Treatment and MotionSpec to add/reorder a Beat, add/remove a persistent Node, change the global Camera Track and update motion cues. It must create a valid next revision while preserving a locked Brief field and locked existing Beat; an undeclared structural change, missing triggering review issue or locked removal fails before writes.

- [ ] **Step 2: Run tests and verify Red**

Run: `pnpm vitest run tests/revision tests/capability/project-local-capability.test.ts tests/capability/project-local-boundary.test.ts`

Expected: FAIL because revision modules do not exist.

- [ ] **Step 3: Implement validation, impact analysis and locks**

Validate only the Patch operations declared in Task 2. Resolve patch and lock targets by semantic entity/ID, never an external array index or JSON Pointer. `bounded` rejects whole-artifact replacement. `rebuild` requires review issue IDs/user instruction, parses every replacement through its strict schema, rebuilds parent hashes in canonical order and computes an entity-aware semantic diff before any write. Compare base revision/source hashes, expand retiming/structural impact through downstream segment frame offsets, bridges, camera tracks and audio cues, and reject any actual path outside the declared impact set. Existing locks apply to replacements, additions, removals and reorders; internally generated JSON Pointers are diagnostic evidence only. A semantic lock protects the selected entity/field and descendants after any array reorder.

- [ ] **Step 4: Implement atomic revision application**

`src/engine/revision/create-revision.ts` is the only domain operation named `createRevision()`: clone validated source objects in memory, apply operations, rerun all schemas/reference/continuity checks, compute before/after hashes, call Task 3's persistence-only `writeRevisionRecord()`, and then atomically replace the working source files/current revision pointer. If any validation or write fails, working files remain byte-identical. This avoids a second competing revision implementation in the Project Store.

Make the Step 1 rebuild test pass. This is the executable proof that a reviewer `rebuild` has a legal path after `rev-0001`.

- [ ] **Step 5: Implement project-local capability loading**

Project-local definitions live only under `projects/<id>/capabilities/`, export `MotionCapabilityDefinition` or `NodeRendererDefinition`, include a fixture/test and use an ID beginning `project.<project-id>.`. Their manifest lists every source/fixture file and entry point. A renderer/effect that participates in continuity must pass the same single-mounted-instance frame-update identity test as core capabilities; replacing its stable root or declared subnode emits `CAPABILITY_ROOT_REMOUNTED`. `validate-project-capabilities.ts` resolves and validates the complete static import closure, rejects imports outside that manifest or the public capability API, runs the central production-source boundary scan over every closure byte, then `materialize-project-capabilities.ts` copies the validated bytes into `repoRoot/src/generated/project-capabilities/<project-id>/<manifest-hash>/`. `buildProjectRegistry(context)` emits deterministic relative imports only to that content-addressed snapshot. No generated module contains an absolute repository path, and a changed source hash creates a new snapshot/cache key. Tests use an isolated temporary complete repository context so they never rewrite the active checkout. `engine/capability`, Resolver and Runtime never scan project directories or dynamically import a MotionSpec path. Reject global ID collisions, missing tests/fixtures, unlisted source files, cross-project resolution, `fetch`/XHR/WebSocket/network imports, `process.env`, `Date.now()`, unseeded `Math.random()`, `<Video>`/`<OffthreadVideo>` and runtime video-file imports; include one negative fixture for each boundary family.

The host workflow is:

```text
CAPABILITY_GAP
→ existing-capability composition check
→ documented approximation or project-local proposal
→ implementation + fixture + tests + performance check
→ explicit project registration
```

Promotion into `src/capabilities/` is a separate reviewed task, never automatic.

- [ ] **Step 6: Implement `motion revise` and the integration fixture**

`motion revise <id> --patch <local-json>` validates, prints the impact set, requires `--apply` to write, creates the revision, resolves only after success and marks old RenderPlan/audio artifacts stale. URL patches are forbidden.

The integration fixture represents the user request “Only shorten Beat 2 and replace its headline.” The test uses the already-authored patch JSON, proves unrelated hashes remain unchanged and renders affected bridge evidence.

- [ ] **Step 7: Run the M3 revision gate**

```bash
pnpm vitest run tests/revision tests/capability/project-local-capability.test.ts tests/integration/natural-language-revision-fixture.test.ts
pnpm typecheck
pnpm lint
```

Expected: PASS; stale/locked/out-of-scope patches fail before writes; a valid local patch changes only its declared impact set.

- [ ] **Step 8: Commit**

```bash
git add src/engine/revision src/engine/project src/cli projects/_template/capabilities tests/revision tests/capability tests/integration
git commit -m "feat: add local semantic revision workflow"
```

---

### Task 15: Add the Offline Third-Party Music Prompt, Local Alignment and Delivery Handoff

**Purpose:** Convert one locked RenderPlan into a paste-ready `MUSIC_PROMPT.md` without calling a music service or reading an API key. After the user manually generates and returns a local track, align its payoff to the cut, mux it with FFmpeg and produce the final delivery manifest. Motion cues refer to hero reveals, morphs, camera travel and payoff events—not slide/page hard cuts.

**Files:**
- Modify: `package.json`
- Create: `src/engine/audio/validate-audio-brief.ts`
- Create: `src/engine/audio/build-music-prompt.ts`
- Create: `src/engine/audio/build-alignment-plan.ts`
- Create: `src/engine/audio/align-and-mux.ts`
- Create: `src/engine/audio/hash-file.ts`
- Create: `src/engine/audio/index.ts`
- Create: `src/generated/audio-tool-manifest.ts`
- Create: `scripts/build-audio-tool-manifest.mjs`
- Create: `src/engine/renderer/create-delivery-manifest.ts`
- Create: `scripts/audio-prompt.mjs`
- Create: `scripts/audio-mux.mjs`
- Modify: `agent/prompts/sound-designer.md`
- Modify: `craft/sound-design.md`
- Modify: `docs/workflows/audio-handoff.md`
- Create: `tests/fixtures/audio/audio-brief.valid.json`
- Create: `tests/fixtures/audio/render-plan.valid.json`
- Create: `tests/fixtures/audio/preview-approval.valid.json`
- Create: `tests/fixtures/audio/build-audio-fixtures.ts`
- Create: `tests/audio/audio-brief.test.ts`
- Create: `tests/audio/build-music-prompt.test.ts`
- Create: `tests/audio/audio-prompt-cli.test.ts`
- Create: `tests/audio/align-and-mux.test.ts`
- Create: `tests/audio/no-api-boundary.test.ts`
- Create: `tests/integration/delivery-manifest.test.ts`

**Interfaces:**
- Consumes: a canonical `RenderPlanArtifact`, its valid hash-bound `PreviewApproval`, a matching host-authored `projects/<project-id>/audio-brief.json` parsed by Task 2's `AudioBriefArtifactSchema`, and optionally one user-supplied local WAV/MP3/M4A file.
- Produces:

```ts
export type RenderPlanAudioView = {
  projectId: string;
  revisionId: string;
  contentHash: string;
  fps: number;
  durationInFrames: number;
};

export function toRenderPlanAudioView(renderPlan: RenderPlanArtifact): RenderPlanAudioView;

export type MusicPromptDocument = {
  audioBriefHash: string;
  promptBlock: string;
  markdown: string;
  cutPayoffFrame: number;
  cutPayoffSeconds: number;
};

export type AudioAlignmentPlan = {
  cutPayoffFrame: number;
  cutPayoffSeconds: number;
  trackPayoffSeconds: number;
  trimStartSeconds: number;
  delayMilliseconds: number;
  targetDurationSeconds: number;
};

export function parseAudioBriefArtifact(input: unknown): AudioBriefArtifact;
export function assertAudioBriefMatchesRenderPlan(
  brief: AudioBriefArtifact,
  renderPlan: RenderPlanAudioView,
): void;
export function assertAudioApprovalMatchesRenderPlan(
  approval: PreviewApproval,
  renderPlan: RenderPlanAudioView,
): void;
export function buildMusicPromptDocument(brief: AudioBriefArtifact): MusicPromptDocument;
export function buildAlignmentPlan(
  brief: AudioBriefArtifact,
  trackPayoffSeconds: number,
): AudioAlignmentPlan;
export async function alignAndMux(input: AlignAndMuxInput): Promise<AudioAlignmentManifest>;
```

`AlignAndMuxInput` and `AudioAlignmentManifest` are imported unchanged from the canonical Task 2 contract; Task 15 does not redeclare or extend them. The input therefore includes the complete Preview Approval and Render Manifest, and the output records both artifact hashes. `RenderPlanArtifact` comes from `src/contracts/render-plan.ts`. Stable blocking codes are `AUDIO_BRIEF_INVALID`, `AUDIO_PAYOFF_INVALID`, `AUDIO_CUE_RANGE_INVALID`, `AUDIO_RENDER_PLAN_STALE`, `AUDIO_RENDER_PLAN_UNAPPROVED`, `AUDIO_VIDEO_STALE`, `AUDIO_PROMPT_TOO_LONG`, `AUDIO_REMOTE_INPUT_FORBIDDEN`, `AUDIO_TRACK_MISSING`, `AUDIO_TRACK_PAYOFF_INVALID`, `AUDIO_TRACK_COVERAGE_SHORT`, `AUDIO_GAIN_INVALID`, `AUDIO_SOURCE_LABEL_REQUIRED`, `AUDIO_VIDEO_COPY_MISMATCH`, `AUDIO_OUTPUT_QC_FAILED` and `AUDIO_FFMPEG_FAILED`.

The immutable audio layout beneath the visual RenderPlan root is:

```text
delivery/
├── audio/<audioBriefHash>/prompts/<promptAttemptHash>/
│   ├── audio-brief.snapshot.json
│   ├── MUSIC_PROMPT.md
│   └── prompt.manifest.json
├── mixes/<mixAttemptHash>/
│   ├── master-final.mp4
│   └── audio-alignment.json
└── manifests/<deliveryManifestHash>.json
```

`audioBriefHash` is SHA-256 of the canonical parsed AudioBrief. `build-audio-tool-manifest.mjs` hashes the closed static graph of the audio validator/prompt/alignment/mux implementation and emits a checked `audioToolImplementationHash`; stale handwritten values fail `audio:manifest:check`. `promptAttemptHash` is SHA-256 of canonical `{audioBriefHash, audioToolImplementationHash, approvalArtifactHash}`. `mixOptionsHash` is SHA-256 of canonical `{sourceLabel, trackPayoffSeconds, musicGainDb, audioCodec: 'aac', audioBitrate: '192k', alignmentAlgorithmVersion, ffmpegVersion}`. `mixAttemptHash` is SHA-256 of canonical `{audioBriefHash, sourceMusicSha256, mixOptionsHash, renderManifestHash, approvalArtifactHash, audioToolImplementationHash}`. All writes are exclusive-or-identical. A changed brief, returned track, payoff declaration, gain, algorithm/tool bytes, FFmpeg version, approval or silent render gets a different path; the tool never replaces `not-provided` delivery with a mixed one in place. The CLI prints the exact new content-addressed paths instead of maintaining a mutable “latest” pointer.

- [ ] **Step 1: Create the canonical AudioBrief and RenderPlan fixtures**

Create the paired fixtures through `tests/fixtures/audio/build-audio-fixtures.ts` so the Brief cannot contain a hand-written RenderPlan hash. The builder exports exactly:

```ts
export function makeGoldenContinuityRenderPlanArtifact(): RenderPlanArtifact;
export function makePreviewApprovalFor(plan: RenderPlanArtifact): PreviewApproval;
export function makeRenderManifestFor(
  plan: RenderPlanArtifact,
  silentVideoSha256: string,
): RenderManifestArtifact;
export async function writeCanonicalAudioFixtures(input: {
  renderPlan: RenderPlanArtifact;
  previewApproval: PreviewApproval;
  audioBrief: AudioBriefArtifact;
}): Promise<void>;
```

It then creates the paired fixture trio from this deterministic call:

```ts
const renderPlan = makeGoldenContinuityRenderPlanArtifact();
const previewApproval = makePreviewApprovalFor(renderPlan);
const audioBrief = AudioBriefArtifactSchema.parse({
  "schemaVersion": "audio-brief@1",
  "projectId": "golden-continuity",
  "revisionId": "rev-0001",
  "renderPlanHash": renderPlan.contentHash,
  "fps": 30,
  "durationInFrames": 600,
  "audio": {
    "style": "Warm, restrained editorial motion-film bed; instrumental and spacious.",
    "instrumentation": "Felt piano, warm analog pad, light sub-bass and one sparse mallet accent.",
    "tempoKey": "72 BPM, A major",
    "hook": "A four-note rising piano motif that returns and resolves at the payoff.",
    "cues": [
      {"frame": 0, "role": "intro", "label": "Opening field", "sound": "One held piano note with space."},
      {"frame": 90, "role": "build", "label": "Shared-element handoff", "sound": "The motif enters as the hero object travels into its next state."},
      {"frame": 360, "role": "riser", "label": "Continuous transformation", "sound": "Warmth and register rise without an aggressive drop."},
      {"frame": 450, "role": "payoff", "label": "Hero resolve", "sound": "The full motif resolves as the visual transformation lands."},
      {"frame": 540, "role": "outro", "label": "End resolve", "sound": "Resolve on a warm major chord with a clean tail."}
    ],
    "dynamics": "Wide dynamics with generous headroom; music remains a restrained bed.",
    "stingerFrame": 552,
    "exclude": "vocals, lyrics, hard EDM drop, aggressive drums, abrupt genre changes, fade-out ending",
    "sfxNotes": "Any optional local UI tap remains separate and lands on its exact event frame."
  }
});

await writeCanonicalAudioFixtures({renderPlan, previewApproval, audioBrief});
```

`makeGoldenContinuityRenderPlanArtifact()` compiles the existing `golden-continuity` fixture through Tasks 7–8 and wraps it with the Task 2 canonical Artifact helper. `render-plan.valid.json` is the complete schema-valid `RenderPlanArtifact`, not the reduced audio view. Its relevant fields are `projectId: "golden-continuity"`, `revisionId: "rev-0001"`, `payload.canvas.fps: 30` and `payload.durationInFrames: 600`; its `contentHash` is computed from the complete canonical envelope. `preview-approval.valid.json` is bound to that revision/plan and complete passing review/QC fixture hashes. The checked-in trio must pass `RenderPlanArtifactSchema`, `PreviewApprovalSchema` and `AudioBriefArtifactSchema`; placeholder hashes are forbidden.

- [ ] **Step 2: Write failing schema and RenderPlan-binding tests**

Create tests that accept the fixture trio and reject zero/two payoffs, a first cue after frame `0`, duplicate/non-increasing frames, out-of-range cues/stinger, invalid fps/duration, a changed revision/hash/fps/duration and a missing/stale/non-approved Preview Approval:

```ts
expect(parseAudioBriefArtifact(fixture).audio.cues).toHaveLength(5);
expect(() => parseAudioBriefArtifact(noPayoff)).toThrow(/AUDIO_PAYOFF_INVALID/);
expect(() => parseAudioBriefArtifact(twoPayoffs)).toThrow(/AUDIO_PAYOFF_INVALID/);
expect(() => parseAudioBriefArtifact(duplicateFrame)).toThrow(/AUDIO_CUE_RANGE_INVALID/);
expect(() => assertAudioBriefMatchesRenderPlan(brief, stalePlan)).toThrow(/AUDIO_RENDER_PLAN_STALE/);
expect(() => assertAudioApprovalMatchesRenderPlan(staleApproval, plan)).toThrow(/AUDIO_RENDER_PLAN_UNAPPROVED/);
```

- [ ] **Step 3: Run schema tests and verify Red**

Run: `pnpm vitest run tests/audio/audio-brief.test.ts`

Expected: FAIL because audio validation is absent.

- [ ] **Step 4: Implement strict AudioBrief validation and binding**

`parseAudioBriefArtifact()` delegates to Task 2's `AudioBriefArtifactSchema`; it does not duplicate that Schema. Require non-empty direction strings, integer fps `1..120`, positive integer duration, lowercase 64-character SHA-256, frame `0` first, strictly increasing in-range cue frames, exactly one payoff and an in-range stinger. Do not sort, infer or repair. `toRenderPlanAudioView()` first parses the complete `RenderPlanArtifact`, then returns exactly:

```ts
return {
  projectId: artifact.projectId,
  revisionId: artifact.revisionId,
  contentHash: artifact.contentHash,
  fps: artifact.payload.canvas.fps,
  durationInFrames: artifact.payload.durationInFrames,
};
```

`assertAudioBriefMatchesRenderPlan()` compares project ID, revision, hash, fps and duration; any mismatch begins its error with `AUDIO_RENDER_PLAN_STALE:`. `assertAudioApprovalMatchesRenderPlan()` parses the complete artifact created by `motion approve`, requires `approved`, matching revision/RenderPlan hash and non-empty bound review/QC hashes; any failure begins `AUDIO_RENDER_PLAN_UNAPPROVED:`. This is an audit/staleness check for one local operator, not a security signature.

- [ ] **Step 5: Write failing deterministic music-prompt tests**

`build-music-prompt.test.ts` asserts:

```ts
const result = buildMusicPromptDocument(parseAudioBriefArtifact(fixture));
expect(result.audioBriefHash).toBe(sha256Canonical(parseAudioBriefArtifact(fixture)));
expect(result.promptBlock).toContain('Instrumental music track for a 20.00s seamless motion film');
expect(result.promptBlock).toContain('0–15%, Intro');
expect(result.promptBlock).toContain('75–90%, Payoff');
expect(result.promptBlock).toContain('LENGTH: at least 23s');
expect(result.markdown).toContain('## PASTE THIS INTO THE MUSIC GENERATOR');
expect(result.markdown).toContain('## Motion cue reference — do not paste');
expect(result.markdown).toContain('payoff_at = 15.00s (frame 450)');
expect(result.cutPayoffFrame).toBe(450);
expect(result.markdown).toBe(buildMusicPromptDocument(parseAudioBriefArtifact(fixture)).markdown);
expect(() => buildMusicPromptDocument(overFourThousandCharacters)).toThrow(/AUDIO_PROMPT_TOO_LONG/);
```

`audio-prompt-cli.test.ts` specifies required JSON flags, deterministic local output, stale plan/approval rejection, URL-input rejection and non-zero exits before the CLI module exists.

- [ ] **Step 6: Run prompt/CLI tests and verify Red**

Run: `pnpm vitest run tests/audio/build-music-prompt.test.ts tests/audio/audio-prompt-cli.test.ts`

Expected: FAIL because prompt generation and its CLI do not exist.

- [ ] **Step 7: Implement deterministic prompt generation**

Calculate each cue band from its frame to the next cue, with the last ending at `durationInFrames`; convert to seconds and rounded percentages. Cue wording precedence is `cue.sound → fixed roleText[role] → role`. If `dynamics` is absent, use exactly “wide dynamic range, sparse opening, stronger contrast at the payoff, generous headroom, no brickwall limiting.” If `exclude` is absent, use exactly “vocals, lyrics, lo-fi hiss, fade-out ending, abrupt genre drift.” The generator-facing block includes only duration, proportional structure, STYLE, INSTRUMENTATION, TEMPO & KEY, HOOK, DYNAMICS, DO NOT INCLUDE and `LENGTH: at least ceil(duration + 3)s`.

Enforce `promptBlock.length <= 4000`; the explanatory Markdown below it is not part of that cap. Put the fenced paste block first. Put exact frame/second cue tables plus payoff/riser/outro/stinger alignment below a “do not paste” heading. Do not include paths, URLs, API instructions, page/scene numbering or the phrase “hard cut.”

`src/engine/audio/index.ts` exports validation, prompt generation, alignment planning, muxing and hashing with the exact names in the Interfaces block.

Implement `build-audio-tool-manifest.mjs` and add `"audio:manifest"` / `"audio:manifest:check"` package scripts. The manifest hashes the complete closed static import graph that can affect prompt/alignment/mux bytes; tests mutate a fixture implementation byte and prove the implementation hash and prompt/mix attempt paths change.

- [ ] **Step 8: Implement the canonical JSON-input prompt CLI**

Add `"audio:prompt": "node --import tsx scripts/audio-prompt.mjs"` and `"audio:mix": "node --import tsx scripts/audio-mux.mjs"` to `package.json`. `scripts/audio-prompt.mjs` uses only Node filesystem/path/`util.parseArgs` plus `src/engine/audio`. Required common flags are `--brief`, `--render-plan` and `--approval`. Canonical mode requires `--delivery-root <selected-plan-root>/delivery` and computes the full hash path itself; scratch-test mode may instead use `--out <local-MUSIC_PROMPT.md>`, but that path must be outside `out/`. The modes are mutually exclusive. The script rejects `http:`, `https:` and `data:`; parses all three JSON files; validates Brief and Approval bindings; computes `audioBriefHash` and `promptAttemptHash` from the checked audio-tool manifest, then writes the prompt plus sibling immutable `audio-brief.snapshot.json` and `prompt.manifest.json` using exclusive-or-identical semantics. It prints all hashes/paths and exits non-zero with the diagnostic on failure.

It must not discover or import TSX exports. This explicitly avoids the original repository's `default | video | videoDef` export-name bug.

The test runs:

```bash
pnpm audio:prompt -- --brief <tmp>/audio-brief.json --render-plan <tmp>/render-plan.json --approval <tmp>/preview-approval.json --out <tmp>/MUSIC_PROMPT.md
```

Expected: exit `0`, deterministic prompt/snapshot/manifest bytes and printed content hashes/local paths. Repeating identical input is idempotent; changed AudioBrief or tool hash at the same explicit directory fails rather than overwrites. A mismatched RenderPlan exits non-zero with `AUDIO_RENDER_PLAN_STALE`; missing/stale Approval exits with `AUDIO_RENDER_PLAN_UNAPPROVED`.

- [ ] **Step 9: Write failing alignment and mux tests**

Unit cases:

```ts
expect(buildAlignmentPlan(brief, 12.25)).toMatchObject({delayMilliseconds: 2750, trimStartSeconds: 0});
expect(buildAlignmentPlan(brief, 17)).toMatchObject({delayMilliseconds: 0, trimStartSeconds: 2});
```

Generated FFmpeg arguments must contain `atrim`, `asetpts`, `adelay`, `volume`, `apad`, `-c:v copy`, and must not contain `atempo`, `asetrate`, a URL, network protocol or video encoder.

Hash/path cases prove that identical inputs reuse the same `mixAttemptHash`; changing the AudioBrief, returned music bytes, payoff time, gain, approval, Render Manifest, FFmpeg version or audio-tool implementation produces a different mix directory. Two returned tracks for one locked picture must coexist, and attempting different bytes at one attempt path fails `ARTIFACT_COLLISION`.

The FFmpeg integration test creates a local silent H.264 fixture, hashes it, creates a bound Render Manifest through `makeRenderManifestFor()`, and creates a deterministic WAV containing one detectable chirp/impulse at the declared `trackPayoffSeconds`. It passes that manifest plus the complete approval to `alignAndMux()`, decodes the mixed AAC back to PCM for test inspection, locates the impulse and asserts `Math.abs(detectedPeakSeconds - 450 / 30) <= 1 / 30`. This proves real output—not only argument math—lands within one video frame. ffprobe also asserts one video stream, one audio stream, final duration within `±0.05s`, audio coverage for the full picture and identical pre/post video-stream MD5. Peak detection exists only in the test oracle; V1 product code trusts the user's declared payoff time.

- [ ] **Step 10: Run alignment/mux tests and verify Red**

Run: `pnpm vitest run tests/audio/align-and-mux.test.ts`

Expected: FAIL because alignment planning and muxing do not exist.

- [ ] **Step 11: Implement local alignment and mux**

Use:

```ts
const cutPayoffSeconds = payoff.frame / brief.fps;
const offsetSeconds = cutPayoffSeconds - trackPayoffSeconds;
const trimStartSeconds = Math.max(0, -offsetSeconds);
const delayMilliseconds = Math.round(Math.max(0, offsetSeconds) * 1000);
```

Before probing media, `alignAndMux()` itself parses and verifies the complete Approval/Render Manifest against the RenderPlan and silent-video hash; CLI-only checks are insufficient. Probe local inputs only after that gate. Validate `trackPayoffSeconds` as finite, non-negative and no greater than track duration. Validate `musicGainDb` as finite in `[-60, 0]`. Reject unless:

```ts
delaySeconds + (musicDurationSeconds - trimStartSeconds) >= videoDurationSeconds
```

`apad` protects fractional/container rounding only; it does not excuse a score that ends early. Apply:

```text
atrim=start=<trim>,asetpts=PTS-STARTPTS,adelay=<delayMs>:all=1,
volume=<gainDb>dB,apad,atrim=duration=<videoDuration>
```

Mux with `-map 0:v:0 -map [music] -c:v copy -c:a aac -b:a 192k -movflags +faststart`. Never pitch-shift or re-encode video. Spawn binaries with argument arrays and no shell interpolation.

Before opening an output file, compute/verify `audioBriefHash`, `audioToolImplementationHash`, exact FFmpeg version, `mixOptionsHash` and `mixAttemptHash`; require output/manifest paths to be the matching content-addressed directory when they are beneath `out/`. Both files use exclusive-or-identical writes. `AudioAlignmentManifest` records every identity component, so a second take or option set cannot collide with or erase the first.

- [ ] **Step 12: Implement and test `audio:mix`**

Required common flags:

```text
--brief <audio-brief.json>
--render-plan <render.plan.json>
--approval <preview-approval.json>
--render-manifest <render.manifest.json>
--video <master-silent.mp4>
--music <local-track.wav|mp3|m4a>
--source-label <user-declared origin/license note>
--track-payoff <seconds>
--gain-db <number from -60 to 0>
```

Canonical output adds `--delivery-root <selected-plan-root>/delivery`; scratch-test output instead adds both `--out <master-final.mp4>` and `--manifest <audio-alignment.json>`. The modes are mutually exclusive, and scratch paths must be outside `out/`.

The CLI validates the same Brief and Approval bindings, passes the complete Approval/Render Manifest into `alignAndMux()`, and requires a non-empty local-source declaration through `--source-label`. `--track-payoff` is the user's confirmed musical payoff time from the returned track; V1 does not pretend to detect musical meaning automatically. Canonical mode computes `delivery/mixes/<mixAttemptHash>/master-final.mp4` and `audio-alignment.json`; scratch mode remains exclusive-or-identical. `AudioAlignmentManifest` records revision/hash, audio/tool/options/attempt hashes, FFmpeg version, approval artifact hash, render-manifest artifact hash, source music SHA-256 and user-declared source, declared track payoff, cut payoff, applied offset, gain, measured media duration/max volume, output SHA-256 and proof that the video stream was copied.

- [ ] **Step 13: Add the permanent no-API audio test**

Call Task 1's exported `scanProductionSource()` against `src/engine/audio/`, both audio scripts and `package.json`; no second regex policy is allowed to drift. Add the audio-specific subprocess profile requiring every `child_process`/`execa` call to use a literal or validated executable from exactly `ffmpeg | ffprobe`; reject shell mode, command strings and all other subprocesses in the audio subsystem. Also assert no model/music SDK dependency. Plain provider names in user-facing documentation remain permitted.

- [ ] **Step 14: Write the one canonical audio workflow and Sound Designer prompt**

`docs/workflows/audio-handoff.md` defines only:

```text
approved silent RenderPlan
→ audio-brief.json
→ MUSIC_PROMPT.md
→ STOP for manual user generation
→ user supplies one local audio file
→ user identifies/confirms the returned track's payoff time
→ local payoff alignment
→ local FFmpeg mux and QC
→ final MP4
```

State explicitly: no API, API key, upload, polling or download. If source timing/hash changes, prompt/alignment is stale. `sfxNotes` is only a manual note and does not trigger synthesis or automatic SFX mixing. `MUSIC_PROMPT.md` remains a valid deliverable if the user never returns music.

The Sound Designer prompt reads the locked RenderPlan, authors only AudioBrief, and runs `audio:prompt --delivery-root out/<project>/<revision>/<render-plan-hash>/delivery`; the tool computes `audio/<audioBriefHash>/prompts/<promptAttemptHash>/MUSIC_PROMPT.md`. It gives the user that exact printed file and stops. After the user supplies a local track and confirms its payoff time, it runs `audio:mix` with the same delivery root and lets the tool compute the canonical mix attempt directory. It does not browse to a generator, analyze musical meaning, request a secret, claim generation succeeded or change visual code. `craft/sound-design.md` links to this workflow and removes every score-first conflict.

- [ ] **Step 15: Write failing content-addressed delivery tests**

`delivery-manifest.test.ts` specifies one `not-provided` manifest, two different selected mix attempts, stable hashes for identical input, different manifest hashes for status/take changes, coexistence of every file, rejection of a mutable `delivery.manifest.json` target and `ARTIFACT_COLLISION` for different bytes at one hash path.

- [ ] **Step 16: Run delivery tests and verify Red**

Run: `pnpm vitest run tests/integration/delivery-manifest.test.ts`

Expected: FAIL because content-addressed delivery-manifest creation does not exist.

- [ ] **Step 17: Implement content-addressed delivery manifests**

Build a complete canonical payload first, compute `deliveryManifestHash`, then exclusively write `out/<project>/<revision>/<render-plan-hash>/delivery/manifests/<deliveryManifestHash>.json`. A silent/not-provided delivery and each selected mix attempt produce separate manifests; no mutable `delivery.manifest.json` or “latest” pointer exists. Each manifest lists:

```text
master-silent.mp4
projects/<project>/audio-brief.json and its canonical SHA-256
audioBriefHash, promptAttemptHash and their exact prompt/snapshot/manifest paths
mixAttemptHash, audio-alignment.json and master-final.mp4 when selected
brief/treatment/motion source hashes
resolved/render plan hashes
render and QC manifests
Creative/Motion review and Preview Approval artifacts
review-frame directory
EDIT_MAP.md
asset/font manifests
```

Use relative paths and SHA-256. `audioStatus` is `not-provided | mixed`; `not-provided` is valid and points to no mix. Creating a mixed delivery never mutates the earlier not-provided manifest, and two returned music takes can each have a delivery manifest. The command prints the selected manifest path/hash. Do not create a clean-room ZIP: the repository project directory is the editable source.

- [ ] **Step 18: Run the M4 audio and delivery gate**

```bash
pnpm vitest run tests/audio tests/integration/delivery-manifest.test.ts
pnpm audio:manifest:check
pnpm verify:boundary
pnpm lint
pnpm typecheck
```

Expected: tests/lint/typecheck/boundary scan PASS; `promptBlock` contains the exact 15-second payoff reference and is ≤4,000 characters; subprocess tests prove the audio subsystem can launch only FFmpeg/ffprobe; no API key is requested and no network request occurs.

Acceptance requires payoff alignment within one video frame, full music coverage, copied video bitstream, valid silent delivery when no music is returned, stale audio rejection after any RenderPlan timing/hash revision, and coexistence of two different returned tracks/mix options plus their immutable delivery manifests without overwrites.

- [ ] **Step 19: Commit**

```bash
git add package.json src/engine/audio src/engine/renderer src/generated/audio-tool-manifest.ts scripts agent/prompts/sound-designer.md craft/sound-design.md docs/workflows tests/audio tests/fixtures/audio tests/integration
git commit -m "feat: add offline music prompt and local audio handoff"
```

---

### Task 16: Harden the Golden Suite, Documentation and Local Release Gate

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `vitest.config.ts`
- Create: `docs/architecture.md`
- Create: `docs/using-with-codex.md`
- Create: `docs/using-with-claude-code.md`
- Create: `docs/project-format.md`
- Create: `docs/adding-a-capability.md`
- Create: `docs/adding-a-style-pack.md`
- Create: `docs/revisions.md`
- Create: `docs/qc-and-delivery.md`
- Create: `docs/licensing-and-assets.md`
- Create: `docs/release-checklist.md`
- Create: `scripts/check-import-boundaries.mjs`
- Create: `scripts/validate-all-projects.mjs`
- Create: `scripts/render-golden-evidence.mjs`
- Create: `scripts/verify-clean-clone.mjs`
- Create: `projects/golden-logo-title/*`
- Create: `projects/golden-social-ad/*`
- Create: `projects/golden-infographic/*`
- Create: `projects/golden-chapter-cut/*`
- Create: `tests/architecture/import-boundaries.test.ts`
- Create: `tests/architecture/no-platform-or-api.test.ts`
- Create: `tests/golden/all-projects.test.ts`
- Create: `tests/integration/full-delivery.test.ts`
- Create: `tests/regression/continuity-regression.test.ts`
- Create: `tests/regression/audio-prompt-regression.test.ts`
- Create: `tests/regression/revision-locality-regression.test.ts`

**Interfaces:**
- Consumes: all completed M0–M4 modules and eight Golden projects.
- Produces: a clean-clone reproducibility check, complete operating documentation and local release evidence.

- [ ] **Step 1: Write failing architecture, all-project, delivery and regression tests**

The import-boundary test parses static imports and enforces the table in Section 2. The no-platform/API test calls the Task 1 production-source scanner across every current core/project capability closure, then adds dependency/package-shape assertions for Next.js, custom Web apps, model/media SDKs, databases and queues. It does not fork another pattern list. The common scanner already rejects Remotion `<Video>`, `<OffthreadVideo>` and runtime video-file imports: reference films may be decoded only by local research tooling and can never become the rendered visual substrate.

The all-project test discovers every direct `projects/golden-*` directory, requires the complete source artifact set and asserts every project validates, resolves and compiles without blocking diagnostics.

Also write the full-delivery and three regression tests described in Step 8 against their intended public interfaces. They must fail because the extra Golden projects, hardened scripts and final delivery orchestration are not yet present; Step 2 observes that Red state before implementation.

- [ ] **Step 2: Run the hardening tests and verify Red**

Run: `pnpm vitest run tests/architecture tests/golden/all-projects.test.ts tests/integration/full-delivery.test.ts tests/regression`

Expected: FAIL because the new Golden projects, local release scripts and hardening rules do not exist.

- [ ] **Step 3: Add four more Golden projects**

1. `golden-logo-title`: type/path motion resolves to a local logo and title sequence.
2. `golden-social-ad`: fast hook/problem/proof/CTA communication with shared anchors and no slide-reset pattern.
3. `golden-infographic`: abstract geometry becomes a diagram, then one node becomes the proof statistic.
4. `golden-chapter-cut`: the only fixture designed to contain one justified chapter cut; it declares a real time/chapter break, matched eye-trace anchors, a Treatment budget of one, and explicit outgoing-final/incoming-first/incoming-held evidence frames.

Together with `golden-continuity`, `golden-kinetic`, `golden-data` and `golden-ui`, the suite covers eight distinct treatments. No project may add a one-off engine field. The chapter-cut fixture must prove that one honest cut passes while the existing invalid-slide-deck fixture still fails.

- [ ] **Step 4: Implement project validation and Golden evidence scripts**

`validate-all-projects.mjs` runs source validation, continuity validation, resolution and RenderPlan validation in sorted project order and returns non-zero on the first Error while printing the complete diagnostic summary.

`render-golden-evidence.mjs` renders only the declared review frames and one low-resolution preview per project by default. `--full` is merely a batch caller for the public gated `motion render`: it renders a full-resolution silent master only for a project that already has current passing QC, both `ship` reviews and a matching Preview Approval, and reports `FINAL_GATE_INCOMPLETE` for every ungated project. It has no internal final-render bypass and writes no generated media into Git.

- [ ] **Step 5: Implement clean-clone verification**

`verify-clean-clone.mjs` requires a clean working tree, creates one explicit temporary directory, copies only committed files via `git archive HEAD`, and performs every check without assuming the archive contains `.git`. Run this verifier after the Task 16 commit (or amend the commit only after it passes). It then runs:

```text
pnpm install --frozen-lockfile
pnpm verify:environment
pnpm exec remotion browser ensure
pnpm verify:browser
pnpm verify:boundary
pnpm capabilities:manifest:check
pnpm engine:manifest:check
pnpm audio:manifest:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
node --import tsx scripts/validate-all-projects.mjs
node --import tsx scripts/render-golden-evidence.mjs
```

It deletes only the exact temporary directory it created after success/failure. It never removes a workspace, repository root, home directory or unresolved variable path.

- [ ] **Step 6: Add one local release command without secrets or external services**

Add `"check:local-release": "node --import tsx scripts/verify-clean-clone.mjs"` to `package.json`. That command owns the full static, unit, browser, FFmpeg, Golden evidence and delivery sequence already specified in Step 5. There is no GitHub Actions workflow or remote-render mode in V1; an operator runs the release check on the same local workstation where Codex/Claude Code uses the repository.

The release command accepts no credentials, remote destination, deployment flag or cloud-render option. It fails if `.github/workflows/` or any other automation file introduces a render/upload/deploy job without a future explicit user decision.

- [ ] **Step 7: Write the operating documentation**

`README.md` leads with the actual local workflow and explicitly says “text-to-motion, not AI-generated video.” It shows one Codex example, one Claude Code `/video` example, local Studio/preview/render commands, the Preview Gate, output locations and the manual music handoff.

The docs must answer:

- what the host agent decides versus what the Compiler guarantees;
- how Brief/Treatment/MotionSpec differ;
- why Beat is not Scene/slide;
- how persistent nodes, bridges and camera holds create continuity;
- when a chapter cut is allowed;
- how to add/test a project-local or core capability;
- how to add a Style Pack without changing the engine;
- how semantic revision locks work;
- how to create `MUSIC_PROMPT.md` and return local music;
- what files are delivered and which media/license responsibilities remain with the user.

`docs/licensing-and-assets.md` also points to the exact Remotion license bundled with `4.0.495` and instructs the operator to confirm that their intended commercial use is covered without a repository key. It records facts and links; it does not invent a legal conclusion. If the operator's intended use would require adding a key under the applicable terms, the documented action is to stop and revisit the engine/version choice with the user—not to add key handling, telemetry or a hidden exception to this plan.

- [ ] **Step 8: Complete the full-delivery and regression implementations**

`full-delivery.test.ts` runs one small fixture in the real legal order: source validation → resolution → preview → technical QC → test-authored strict Creative/Motion `ship` reviews → hash-bound Preview Approval → public gated silent render → AudioBrief/music prompt → local fixture-audio mux → delivery verification. Its review/approval artifacts use the same production schemas and are written only after the bound preview/QC exist; changing any bound byte before render must fail. Regression tests pin:

- continuity diagnostics for valid, chapter-cut, tiny-decorative-anchor and invalid-slide fixtures, including chapter-cut budget and resolved bridge realization;
- directional-push positive/negative cases, including a repeated full-page push that remains blocked as slide rhythm;
- canonical prompt output and exact payoff math;
- semantic patch locality and lock preservation;
- deterministic resolved/render-plan hashes;
- representative visual evidence within approved tolerances.

Add `"test:coverage": "vitest run --coverage"` to `package.json` and configure checked thresholds: at least `80%` statements/branches overall and `90%` for contracts, resolver, continuity validator, revision and audio validation. M5 executes this script; visual coverage comes from Golden evidence rather than line coverage alone.

- [ ] **Step 9: Run the full M5 release gate**

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test:coverage
pnpm capabilities:manifest:check
pnpm engine:manifest:check
pnpm audio:manifest:check
node --import tsx scripts/check-import-boundaries.mjs
node --import tsx scripts/validate-all-projects.mjs
node --import tsx scripts/render-golden-evidence.mjs
```

Expected:

- all eight Golden projects validate/resolve/compile;
- all declared evidence renders and passes QC;
- the invalid slide fixture remains blocked;
- one justified chapter cut passes;
- the tiny decorative-anchor fixture remains blocked and every zero-frame chapter cut has bound seam evidence;
- same source resolves/compiles to the same canonical hashes;
- no render performs a network request;
- no API key, model/media SDK, Studio Web app, worker, queue or database exists;
- the full delivery fixture succeeds without generated media or a remote service.

- [ ] **Step 10: Perform the final manual review**

Review every Golden preview at 1× and 0.25×. For each, record:

```text
message understood on first view
one focal point per Beat
each boundary has a visible causal/eye-trace relationship
holds are readable
camera movement is motivated
no dead frame, geometry snap or unexpected flash
no repeated full-page slide rhythm
no tiny decorative anchor masking a focal/full-frame reset
transition vocabulary is restrained
CTA/payoff is visible where the Brief requires one
```

Any “looks like slides” judgment is a release blocker even if numeric seam checks pass.

- [ ] **Step 11: Commit**

```bash
git add package.json vitest.config.ts README.md docs scripts src/generated/project-registry.ts projects/golden-* tests/architecture tests/golden tests/integration tests/regression
git commit -m "chore: harden and document the motion compiler"
node --import tsx scripts/verify-clean-clone.mjs
```

Expected after commit: clean-clone verification PASS. If it fails, fix the smallest cause, amend this Task 16 commit, and rerun; do not claim M5 complete before the archive of `HEAD` passes.

---

## Final Acceptance Checklist

### Product boundary

- [ ] One local repository, one user workflow, no multi-user/platform code.
- [ ] Public CLI has no repository/workspace-root override; projects, output, template and runtime stay inside that repository.
- [ ] Codex and Claude Code are host operators; the repo contains no embedded model.
- [ ] No API key, model/media-service SDK, remote generation call, AI image/video generation or video-footage substrate.
- [ ] Remotion Studio is used directly; no Next.js/custom dashboard.

### Motion architecture

- [ ] `BriefSpec → TreatmentSpec → MotionSpec → ResolvedMotionIR → RenderPlan` is the only production path.
- [ ] Beat is a semantic state, not a full-screen mounted Scene.
- [ ] Runtime uses one global clock, one PersistentWorld and one global Camera Track.
- [ ] Cross-Beat nodes keep stable IDs/keys.
- [ ] Every Beat boundary has exactly one declared ContinuityBridge.
- [ ] Hard cuts are justified chapter-cut exceptions with eye-trace anchors and an absolute V1 maximum of one per film.
- [ ] Every declared bridge is proven by resolved node/camera/content tracks; a decorative survivor cannot waive a focal/full-frame reset.
- [ ] Chapter cuts stay within the Treatment budget and receive outgoing/incoming evidence despite consuming zero frames.
- [ ] Repeated full-page replacement reliably fails as `SLIDE_LIKE_CUT_PATTERN`.
- [ ] Preview and Final use the same RenderPlan.

### Quality

- [ ] First Golden Film passes the M1 human “not slides” gate before M2 begins.
- [ ] Exact handoffs meet the declared geometry/PSNR thresholds.
- [ ] No dead/bare frames, remount snaps or unexplained brightness flashes.
- [ ] Typography, glyphs, safe areas and local assets pass deterministic validation.
- [ ] Motion profile values remain adaptable defaults rather than universal fixed timing rules.

### Editing and extensibility

- [ ] Natural-language change requests become SemanticPatch files through the host agent.
- [ ] Locks and unaffected source hashes survive revisions.
- [ ] Capability gaps are explicit; project-local capabilities require schemas, fixtures and tests.
- [ ] Shared engine promotion is reviewed separately.
- [ ] Three Style Packs and eight Golden projects use the same core schema.

### Audio and delivery

- [ ] Locked cut deterministically produces `MUSIC_PROMPT.md` whose generator-facing `promptBlock` is ≤4,000 characters; the separate cue-reference section is not truncated by that cap.
- [ ] The user manually operates the third-party generator; the repository stops at the handoff.
- [ ] Returned music is local, frame-aligned without pitch shift and muxed without video re-encoding.
- [ ] AudioBrief revisions, multiple returned tracks and mix-option changes create separate content-addressed prompt/mix/delivery attempts; none overwrites another.
- [ ] V1 treats SFX notes as manual notes only; it does not synthesize or automatically mix SFX.
- [ ] Silent master + Music Prompt remain valid if no music is returned.
- [ ] Delivery contains source specs, manifests, QC evidence, Edit Map and editable project source.

## Explicit Non-Goals

These are not hidden follow-ups and do not belong in V1:

- SaaS, authentication, accounts, collaboration or cloud storage.
- Studio Web UI, job dashboard or background worker.
- SQLite/PostgreSQL/Redis/queue infrastructure.
- Model gateway, provider adapter or Structured Outputs API.
- Automatic visual-model review uploads.
- AI image/video generation, stock-footage search or footage editing.
- Automatic music generation, upload, polling or download.
- TTS/voice generation.
- True 3D, fluid dynamics, character animation or hand-drawn frame animation.
- Automatic multi-aspect-ratio adaptation.

## Execution and Approval Boundary

This document is the implementation plan the user requested. Its existence does not authorize execution.

Implementation begins only after the user explicitly approves this revised plan. At that time:

1. Reconfirm that the new `motion-video/` target does not exist.
2. Use `superpowers:subagent-driven-development` by default, with a fresh implementation agent and review gate per Task.
3. Stop for user review at M1 after rendering the first Golden Film; do not continue to M2 if its continuity quality is not approved.
4. Continue through later milestones only while their preceding hard gates pass.
