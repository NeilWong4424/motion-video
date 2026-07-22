# Role-authored artifact contracts

## Status and scope

This is the single normative, documentation-only shape contract for the three role-authored source artifacts `BriefSpec@1`, `ResearchFindings@1`, and `AudioBriefArtifact@1`. Part 1 does not implement parsers, validators, canonical JSON, hashing, or persistence. A later deterministic interface must enforce every invariant here before accepting an artifact.

The notation is TypeScript-like only to make the JSON shapes auditable. Every declared object is a **closed object**: the listed keys are required unless a union explicitly says otherwise, and additional fields are forbidden. A discriminated union accepts only its declared variants and only the keys declared for the selected variant. Arrays preserve order. JSON numbers must be finite.

`InputTrustFinding` is the exact type owned by [`input-trust.md`](input-trust.md); it is referenced here rather than redefined. Content hashes are lowercase SHA-256 hex strings produced only by an authorized deterministic interface.

```ts
type PositiveInteger = number;
type NonNegativeInteger = number;
type NonNegativeNumber = number;
type Sha256 = string;
```

`PositiveInteger` is an integer greater than zero. `NonNegativeInteger` is an integer greater than or equal to zero. `NonNegativeNumber` is finite and greater than or equal to zero. `Sha256` matches `^[a-f0-9]{64}$`.

## `BriefSpec@1`

```ts
type BriefLanguage = "zh-CN" | "zh-TW" | "en" | "mixed";
type BriefFps = 24 | 25 | 30 | 50 | 60;

type BriefCanvas = {
  width: PositiveInteger;
  height: PositiveInteger;
  fps: BriefFps;
};

type VerifiedFact = {
  id: string;
  claim: string;
  localSourceLabel: string;
};

type BriefSpec = {
  schemaVersion: "brief@1";
  projectId: string;
  title: string;
  language: BriefLanguage;
  goal: string;
  audience: string;
  message: string;
  cta: string | null;
  canvas: BriefCanvas;
  durationSeconds: number;
  durationInFrames: PositiveInteger;
  verifiedFacts: VerifiedFact[];
  suppliedAssetIds: string[];
  constraints: string[];
  prohibitedContent: string[];
  assumptions: string[];
  inputTrustFindings: InputTrustFinding[];
};
```

Brief invariants:

- `durationSeconds` is finite and within 5 through 60 seconds inclusive.
- `durationInFrames === durationSeconds * canvas.fps`; the product must be a `PositiveInteger`. No role may round, floor, ceil, or independently retime this value.
- `message` contains exactly one primary message. `cta` is either one action or `null`; omission is not a valid substitute for `null`.
- IDs are unique within their containing array. Strings used for required meaning are non-empty after trimming.
- Every `verifiedFacts[].localSourceLabel` resolves to user-supplied local evidence. Assumptions are explicitly non-factual and may not contradict a verified fact.
- The future canonical Brief hash is computed from the complete closed `BriefSpec` bytes. Downstream MotionSpec binds that `briefHash`, and its Beat durations must sum to this Brief's exact `durationInFrames`; neither downstream role may silently repair a mismatch.

## `ResearchFindings@1`

### Closed measurement vocabulary

```ts
type MeasurementValue =
  | {kind: "scalar"; number: number}
  | {kind: "range"; min: number; max: number}
  | {kind: "point"; x: number; y: number}
  | {kind: "rectangle"; x: number; y: number; width: NonNegativeNumber; height: NonNegativeNumber};

type NormalizedRegion = {
  x: number;
  y: number;
  width: NonNegativeNumber;
  height: NonNegativeNumber;
};

type AudioChannel = "mono" | "left" | "right" | "stereo-mix";

type MeasurementLocation =
  | {kind: "whole-source"}
  | {kind: "frame-range"; startFrame: NonNegativeInteger; endFrameExclusive: PositiveInteger; region: NormalizedRegion | null}
  | {kind: "time-range"; startSeconds: NonNegativeNumber; endSecondsExclusive: number; channel: AudioChannel | null}
  | {kind: "page-region"; pageNumber: PositiveInteger; region: NormalizedRegion | null}
  | {kind: "image-region"; region: NormalizedRegion}
  | {kind: "data-path"; jsonPointer: string};

type MeasurementUnit =
  | "frames"
  | "seconds"
  | "pixels"
  | "normalized"
  | "ratio"
  | "percent"
  | "degrees"
  | "count"
  | "decibels"
  | "LUFS"
  | "unitless";

type MeasurementUncertainty =
  | {kind: "exact"}
  | {kind: "absolute"; value: NonNegativeNumber; unit: MeasurementUnit}
  | {kind: "relative"; percent: NonNegativeNumber}
  | {kind: "bounded"; min: number; max: number; unit: MeasurementUnit};
```

Measurement invariants:

- A `range` or `bounded` value has `min <= max`. A `rectangle` or `NormalizedRegion` has non-negative dimensions. Normalized-region `x`, `y`, `width`, and `height` are each within `[0,1]`, and its right and bottom edges do not exceed `1`.
- A `frame-range` has `startFrame < endFrameExclusive`. A `time-range` has `startSeconds < endSecondsExclusive`. A JSON pointer is non-empty and follows RFC 6901 syntax; it remains a data location, never an instruction or a filesystem path.
- `MeasurementValue` contains only numbers. Qualitative observations belong in a finding, never in `value`.
- The uncertainty variant states what the Researcher can support. `exact` is permitted only for directly represented values requiring no sampling or estimation; it must not be used merely because uncertainty was not measured.
- `unit` describes `value`; an `absolute` or `bounded` uncertainty uses a unit compatible with the measurement. `relative.percent` is in percentage points.

### Artifact shape

```ts
type ResearchStatus = "complete" | "partial";
type ResearchConfidence = "low" | "medium" | "high";
type LocalSourceKind =
  | "brand-guide"
  | "logo"
  | "font"
  | "data"
  | "document"
  | "image"
  | "audio"
  | "reference-film"
  | "other-local";

type ResearchSource = {
  sourceId: string;
  localPath: string;
  sha256: Sha256 | null;
  kind: LocalSourceKind;
};

type ResearchFinding = {
  id: string;
  sourceId: string;
  location: MeasurementLocation;
  observation: string;
  measurementIds: string[];
  confidence: ResearchConfidence;
  inference: false;
};

type ResearchMeasurement = {
  measurementId: string;
  sourceId: string;
  metric: string;
  value: MeasurementValue;
  unit: MeasurementUnit;
  sampleBasis: string;
  location: MeasurementLocation;
  method: string;
  uncertainty: MeasurementUncertainty;
};

type ResearchInference = {
  id: string;
  basedOnFindingIds: [string, ...string[]];
  text: string;
  confidence: ResearchConfidence;
};

type UnresolvedResearchItem = {
  sourceId: string;
  question: string;
  reason: string;
  blocksRequestedConclusion: boolean;
};

type ResearchFindings = {
  schemaVersion: "research-findings@1";
  projectId: string;
  status: ResearchStatus;
  sources: ResearchSource[];
  findings: ResearchFinding[];
  measurements: ResearchMeasurement[];
  inferences: ResearchInference[];
  inputTrustFindings: InputTrustFinding[];
  unresolved: UnresolvedResearchItem[];
};
```

Research invariants:

- `sourceId`, finding `id`, `measurementId`, and inference `id` are unique in their respective collections. Every referenced ID resolves inside this artifact.
- Every `localPath` is a normalized repository-relative path to a declared user-supplied local source. Absolute paths, URLs, `..` traversal, globs, and paths outside the delegated source roots are forbidden.
- Each finding cites its source and exact `location`. Each measurement cites the same source independently; `measurementIds` may be empty only for a purely qualitative direct observation.
- A `ResearchFinding` is always a direct observation (`inference: false`). Interpretations appear only in `inferences` and cite at least one finding.
- `status: "complete"` requires `unresolved` to be empty. `status: "partial"` requires at least one unresolved item, and every unresolved item that remains in a written artifact has `blocksRequestedConclusion: false`. If an item blocks the requested conclusion, the role returns a blocked result and writes no authoritative artifact.
- `sha256: null` truthfully means that an authorized deterministic interface did not provide the source hash. It never authorizes a fabricated digest.

## `AudioBriefArtifact@1`

```ts
type AudioCueRole = "intro" | "build" | "riser" | "payoff" | "sustain" | "outro";

type AudioCue = {
  frame: NonNegativeInteger;
  role: AudioCueRole;
  label: string;
  sound: string;
};

type AudioDirection = {
  style: string;
  instrumentation: string;
  tempoKey: string;
  hook: string;
  cues: [AudioCue, ...AudioCue[]];
  dynamics: string;
  stingerFrame: NonNegativeInteger;
  exclude: string;
  sfxNotes: string;
};

type AudioBriefArtifact = {
  schemaVersion: "audio-brief@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: Sha256;
  previewApprovalHash: Sha256;
  renderManifestHash: Sha256;
  silentMasterHash: Sha256;
  fps: BriefFps;
  durationInFrames: PositiveInteger;
  audio: AudioDirection;
};
```

AudioBrief invariants:

- All four hashes are current owner-produced bindings for the same approved, locked silent cut. Placeholder or inferred hashes are invalid.
- `fps` and `durationInFrames` equal the locked RenderPlan values. The artifact is stale if any bound visual evidence, review, approval, manifest, silent-master bytes, fps, or duration changes.
- Cues are strictly increasing by `frame`; the first cue is at frame `0`; every cue and `stingerFrame` is within `[0, durationInFrames)`.
- Exactly one cue has `role: "payoff"`. No other field creates an alignment anchor.
- Directions are provider-neutral and instrumental unless the verified Brief explicitly authorizes otherwise. `sfxNotes` is manual production guidance only.
- This artifact contains no provider, credential, remote URL, generated-track claim, prompt-attempt field, or mutable “latest” pointer. The later deterministic music-prompt interface owns its separate output.

## Ownership and conformance

- Brief Planner alone authors `BriefSpec@1`.
- Researcher alone authors `ResearchFindings@1`.
- Sound Designer alone authors `AudioBriefArtifact@1`.
- Each owner normatively inherits this file and must emit the complete selected artifact shape, not a role-local extension. `RoleResult@1` is a separate handoff envelope and is never embedded in these artifacts.
- A role may show an illustrative JSON instance, but the example has no authority beyond this contract. If an example and this contract differ, this contract wins and the example must be repaired.
