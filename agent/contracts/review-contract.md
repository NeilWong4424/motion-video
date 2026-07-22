# Review artifact documentation contract

Creative and Motion Reviews are provenance-complete canonical envelopes for one exact preview evidence tuple. This file documents the closed result unions; it does not implement a JSON Schema, hashing tool, media reader, QC system, or review runtime.

## Provenance envelope

Every completed or incomplete review contains these fields:

```ts
type ReviewEnvelope = {
  schemaVersion: "creative-review@1" | "motion-review@1";
  contentHash: string;             // canonical SHA-256 of the envelope with this field omitted
  producer: {
    role: "creative-reviewer" | "motion-reviewer";
    promptPath: "agent/reviewers/creative-reviewer.md" | "agent/reviewers/motion-reviewer.md";
    promptContentHash: string;
  };
  parentHashes: string[];          // actually observed parent hashes; may be [] only when incomplete
  sourceHashes: {
    briefHash: string;
    treatmentHash: string;
    motionSpecHash: string;
  };
  projectId: string;
  revisionId: string;
  renderPlanHash: string;          // delegated expected target hash
  previewHash: string;             // delegated expected target hash
  reviewBundleHash: string;        // delegated expected sampled-evidence target hash
  evidenceHash: string | null;     // observed resolved evidence-ref set; null when incomplete
  technicalQcHash: string;         // delegated expected QC target hash, not proof of pass by itself
  observedBindings: {
    projectId: string | null;
    revisionId: string | null;
    renderPlanHash: string | null;
    previewHash: string | null;
    reviewBundleHash: string | null;
    technicalQcHash: string | null;
    technicalQcDecision: "pass" | "blocking" | null;
  };
  expectedBindings: {
    projectId: string;
    revisionId: string;
    renderPlanHash: string;
    previewHash: string;
    reviewBundleHash: string;
    technicalQcHash: string;
  };
};
```

`producer.role` and `producer.promptPath` must match the unique output path owner. The top-level project/revision/RenderPlan/preview/review-bundle/Technical-QC fields and `expectedBindings` identify the exact **delegated expected target**; they are not claims that the reviewer observed those bytes. `observedBindings` is nullable field-by-field so an incomplete review records only what it actually inspected and never fabricates a missing hash. `parentHashes` contains only parents actually observed; `sourceHashes` labels the delegated source targets. Replacing any observed byte/hash under the same revision or RenderPlan makes a completed review stale.

## Evidence references

```ts
type EvidenceRef = {
  relativePath: string;            // repository-relative; no absolute path, `..`, URL, or glob
  contentHash: string;             // expected SHA-256 of exact bytes
  frameRange: { startFrame: integer; endFrameExclusive: integer } | null;
  purpose: string;
};

type FrameEvidenceRef = EvidenceRef & {
  frameIndex: integer;
  frameRange: {startFrame: integer; endFrameExclusive: integer}; // exactly [frameIndex, frameIndex + 1)
  actualFrameRole: "before" | "midpoint" | "after" | "outgoing-last" | "incoming-first" | "incoming-held";
};

type MissingEvidenceRef = {
  expectedRelativePath: string;
  expectedContentHash: string | null;
  purpose: string;
  missingReason: string;
};

type PlaybackRate = "1.0x" | "0.25x";

type PlaybackEvidence = {
  rate: PlaybackRate;
  preview: EvidenceRef;             // exact preview bytes; frameRange covers [0, durationInFrames)
  completedFromStartToEnd: true;
  observerAttestation: string;      // non-empty, role-authored observation record
};
```

Every present sampled/frame reference must resolve beneath the bound review bundle and match `contentHash`. The `PlaybackEvidence.preview` reference instead resolves to the canonical preview beneath the same bound RenderPlan root and must match `previewHash`. Labels or arbitrary strings are not evidence references. `MissingEvidenceRef` describes the expected-but-missing path/hash without pretending it resolved; `expectedContentHash` is null only when the delegated inputs omitted that expected hash.

## Playback evidence

`playbackEvidence` is a structured, content-hashed reviewer observation record. It does not pretend that software can physiologically prove attention; it makes the reviewer's exact rate, preview bytes, full-film range, and start-to-end attestation explicit and rejectable. Its `preview.contentHash` must equal the bound `previewHash`, its relative path must resolve to those exact preview bytes, and its frame range is exactly `[0, durationInFrames)`. A rate may appear at most once. A PlaybackEvidence member may be recorded only after that exact preview was actually watched from start to end at the stated rate.

A completed Creative Review requires normal playback at 1.0× and contains exactly one `PlaybackEvidence` with `rate: "1.0x"`. A completed Motion Review requires both 1.0× and 0.25× playback and contains exactly two members, one with `rate: "1.0x"` and one with `rate: "0.25x"`. An incomplete review records only playback actually completed and lists every required absent rate in `missingPlaybackRates`; it must not fabricate playback evidence or copy a delegated expectation into an observation.

For a completed review, `evidenceHash` is the canonical SHA-256 of `{evidenceRefs, playbackEvidence, bridgeEvidence}` in their artifact order. The hash therefore binds the structured playback observations as well as sampled frame/bridge proof. An incomplete review uses `evidenceHash: null` whenever any member needed for that projection is unresolved; it never hashes a delegated expectation as observed evidence.

Motion bridge evidence is a closed union:

```ts
type PositiveDurationBridgeMode =
  | "shared-element"
  | "camera-navigation"
  | "morph-into-target"
  | "match-on-action"
  | "directional-push";

type PositiveDurationBridgeEvidenceBase = {
  kind: "positive-duration";
  bridgeId: string;
  declaredMode: PositiveDurationBridgeMode;
  bridgeStartFrame: integer;
  boundaryFrame: integer;
  bridgeEndFrameExclusive: integer;
  before: FrameEvidenceRef;
  midpoint: FrameEvidenceRef;
  after: FrameEvidenceRef;
  brightnessDeadFrameScan: EvidenceRef;
  measuredEyeTraceDistanceNormalized: number;
};

type SharedElementBridgeEvidence = PositiveDurationBridgeEvidenceBase & {
  declaredMode: "shared-element";
  realization: "persistent-shared-element";
  endpointCheck: "exact-visual";
};

type CameraNavigationBridgeEvidence = PositiveDurationBridgeEvidenceBase & {
  declaredMode: "camera-navigation";
  realization: "camera-navigation";
  endpointCheck: "continuous-motion";
};

type MorphIntoTargetBridgeEvidence = PositiveDurationBridgeEvidenceBase & {
  declaredMode: "morph-into-target";
  realization: "scene-stack-real-target";
  endpointCheck: "exact-visual";
};

type MatchOnActionBridgeEvidence = PositiveDurationBridgeEvidenceBase & {
  declaredMode: "match-on-action";
  realization: "match-on-action";
  endpointCheck: "continuous-motion";
};

type DirectionalPushBridgeEvidence = PositiveDurationBridgeEvidenceBase & {
  declaredMode: "directional-push";
  realization: "directional-push";
  endpointCheck: "continuous-motion";
};

type PositiveDurationBridgeEvidence =
  | SharedElementBridgeEvidence
  | CameraNavigationBridgeEvidence
  | MorphIntoTargetBridgeEvidence
  | MatchOnActionBridgeEvidence
  | DirectionalPushBridgeEvidence;

type ChapterCutEvidence = {
  kind: "chapter-cut";
  bridgeId: string;
  declaredMode: "chapter-cut";
  durationFrames: 0;
  boundaryFrame: integer;
  incomingHoldStartFrame: integer;
  outgoingLast: FrameEvidenceRef;
  incomingFirst: FrameEvidenceRef;
  incomingHeld: FrameEvidenceRef;
  fullFrameChange: EvidenceRef;
  declaredEyeTraceDistanceNormalized: number;
  measuredEyeTraceDistanceNormalized: number;
};

type BridgeEvidence = PositiveDurationBridgeEvidence | ChapterCutEvidence;
```

A positive-duration evidence member is not allowed to choose a convenient review interval. Its `bridgeId` selects one exact positive MotionSpec bridge; `declaredMode` must equal that bridge's `mode`. `bridgeStartFrame`, `boundaryFrame`, and `bridgeEndFrameExclusive` must be exactly equal to the resolved MotionSpec bridge start, its actual adjacent-Beat boundary, and its resolved exclusive end. They must satisfy the MotionSpec seam-straddling inequality. `brightnessDeadFrameScan.frameRange` is non-null and exactly `[bridgeStartFrame, bridgeEndFrameExclusive)`.

Mode, realization, and endpoint policy are one closed mapping, with no alternate combinations:

```text
shared-element      -> persistent-shared-element -> exact-visual
camera-navigation   -> camera-navigation         -> continuous-motion
morph-into-target   -> scene-stack-real-target   -> exact-visual
match-on-action     -> match-on-action            -> continuous-motion
directional-push    -> directional-push           -> continuous-motion
```

A positive-duration bridge derives `beforeFrame = bridgeStartFrame - 1`, `midpointFrame = bridgeStartFrame + floor((bridgeEndFrameExclusive - bridgeStartFrame - 1) / 2)`, and `afterFrame = bridgeEndFrameExclusive`. These populate `before.frameIndex`, `midpoint.frameIndex`, and `after.frameIndex`; their roles must respectively be `before`, `midpoint`, and `after`. Because the bridge crosses the real seam, `before` is inside the outgoing Beat and `after` is inside the incoming Beat.

A zero-frame cut's `boundaryFrame` must be exactly equal to the MotionSpec chapter-cut's resolved adjacent-Beat boundary; `declaredMode` must be `chapter-cut`. Its `declaredEyeTraceDistanceNormalized` must be exactly equal to that bridge's `maxEyeTraceDistanceNormalized`, and completion requires `measuredEyeTraceDistanceNormalized <= declaredEyeTraceDistanceNormalized`. It derives `outgoingLastFrame = boundaryFrame - 1`, `incomingFirstFrame = boundaryFrame`, and `incomingHeldFrame` from the incoming Beat's declared `holdRange`. Therefore `outgoingLast.frameIndex = boundaryFrame - 1`, `incomingFirst.frameIndex = boundaryFrame`, and `fullFrameChange.frameRange` is exactly `[boundaryFrame - 1, boundaryFrame + 1)`. The roles must respectively be `outgoing-last`, `incoming-first`, and `incoming-held`. Every still is single-frame evidence with `frameRange` exactly `[frameIndex, frameIndex + 1)`. Incorrect bridge identity, mode, boundary, range, eye-trace declaration/measurement, sample position, scan coverage, or hash refuses completion even when files otherwise exist.

## Issues and disposition invariants

```ts
type ReviewIssue = {
  issueId: string;
  severity: "error" | "warning" | "info";
  blocking: boolean;
  scope: "bounded" | "structural";
  semanticTargets: [SemanticImpactTarget, ...SemanticImpactTarget[]];
  frameRange: { startFrame: integer; endFrameExclusive: integer } | null;
  evidenceRefs: [EvidenceRef, ...EvidenceRef[]];
  violatedRule: string;
  observation: string;
  requiredAction: string;
};
```

`SemanticImpactTarget` is the exact closed target union in `revision-contract.md`, including stable child identities for Treatment arc/intention/rationale items, camera segments, node tracks, node effects, and content transitions. A reviewer cannot use a broad parent target to conceal a known affected child.

An `error` is always blocking; a warning or info issue is never blocking. `ship` has no blocking issue. `fix` has at least one bounded blocking issue and no structural blocking issue. `rebuild` has at least one structural blocking issue. Aggregation precedence is `rebuild > fix > ship`. Issue IDs and evidence references are non-empty and unique within a review.

## Completed and incomplete result union

```ts
type CompletedReview = ReviewEnvelope & {
  complete: true;
  decision: "ship" | "fix" | "rebuild";
  evidenceHash: string;
  observedBindings: {
    projectId: string;
    revisionId: string;
    renderPlanHash: string;
    previewHash: string;
    reviewBundleHash: string;
    technicalQcHash: string;
    technicalQcDecision: "pass";
  };
  evidenceRefs: EvidenceRef[];
  playbackEvidence: [PlaybackEvidence, ...PlaybackEvidence[]];
  missingPlaybackRates: [];
  bridgeEvidence: BridgeEvidence[]; // required complete set for Motion Review; [] for Creative Review
  issues: ReviewIssue[];
  blockingReasons: [];
  missingEvidenceRefs: [];
};

type IncompleteReview = ReviewEnvelope & {
  complete: false;
  decision: null;
  evidenceRefs: EvidenceRef[];
  missingEvidenceRefs: MissingEvidenceRef[];
  playbackEvidence: PlaybackEvidence[];
  missingPlaybackRates: PlaybackRate[];
  bridgeEvidence: BridgeEvidence[];
  issues: ReviewIssue[];
  blockingReasons: [string, ...string[]];
};

type ReviewResult = CompletedReview | IncompleteReview;
```

For a completed Motion Review, `bridgeEvidence` is an ordered bijection over `MotionSpec.timeline.bridges`: it has the same length, the same order, a unique bridgeId for every member, exactly one evidence member for each declared bridge, with no missing and no extra bridge evidence. Each evidence member's closed variant must match the corresponding bridge mode and the exact ranges described above. A completed Creative Review always has `bridgeEvidence: []`. An incomplete Motion Review may contain only an ordered, unique subset of evidence actually observed for bridges in that bound MotionSpec; it cannot add evidence for another bridge or duplicate an ID.

An incomplete result compares nullable actual `observedBindings` against the delegated `expectedBindings`, describes absent file/frame proof in `missingEvidenceRefs`, absent required viewing rates in `missingPlaybackRates`, and **must not fabricate** a missing hash or playback observation; it cannot carry `ship`, `fix`, or `rebuild`. At least one of `missingEvidenceRefs` or `missingPlaybackRates` is non-empty; they may not both be empty. This permits an honest incomplete result when every file exists but one required playback rate was not actually observed. Only a completed review requires every observed binding to be non-null and exactly equal its expected/top-level target, `technicalQcDecision: "pass"`, a matching passing `technicalQcHash`, the exact role-required playback set, resolvable evidence hashes, all domain-required evidence checks, and a decision consistent with its issue scopes. Neither variant is Preview Approval.
