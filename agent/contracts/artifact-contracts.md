# Artifact contracts

These are documentation interfaces. Where a contract names an executable producer or strict schema, that producer/schema is required later and is not implemented in Part 1. Markdown must not replace structured handoffs where a JSON artifact is defined.

## Repository-wide SHA-256 serialization

Every SHA-256 value in this repository uses one serialization: a **raw lowercase 64-hex** string matching `^[a-f0-9]{64}$`. This applies to every typed or prose-defined field named `*Hash`, `*ContentHash`, `sha256`, or equivalent, to hash values in examples, and to hash segments used in content-addressed paths. A SHA-256 value must not carry an algorithm prefix or a colon; in particular, the prefixed form `sha256:<digest>` is invalid. `null` is legal only where a closed shape explicitly declares it, and never means a fabricated value. Angle-bracket path placeholders are documentation tokens, not serialized hash examples.

## Canonical source and configuration chain

| Artifact | Path | Owner | Authority | Must bind |
|---|---|---|---|---|
| `ProjectPolicy@1` | immutable candidate path selected by `ArtifactCandidate` | User through future project-policy-ingress | Preview-approval actor policy only | Exact project; prior accepted policy-or-null; human default; explicit allowed host IDs only |
| `LocalAssetManifest@1` | immutable candidate path selected by `ArtifactCandidate` | Future local-source-ingress interface | Exact staged bytes, stable asset IDs, rights, requested/allowed uses | Direct user locators remain ephemeral; staged path/hash and rights must verify |
| `BriefSpec@1` | immutable candidate path selected by `ArtifactCandidate` | Brief Planner | Goal, audience, facts, one message, CTA, canvas/duration, supplied assets, constraints, assumptions | Project identity, accepted Research hash-or-null, accepted LocalAssetManifest hash-or-null, exact fact provenance |
| `ResearchFindings@1` | immutable candidate path selected by `ArtifactCandidate` | Researcher | Observations and measurements from supplied local sources | Accepted non-null LocalAssetManifest hash; eligible asset ID/use, exact staged path/hash, location, confidence, observation/inference distinction |
| `TreatmentSpec@1` | immutable candidate path selected by `ArtifactCandidate` | Creative Direction | Narrative and visual strategy | Accepted Brief, Research-or-null, asset-manifest-or-null, and validated catalog-registry snapshot bindings; registered motion/style IDs; fixed `seamless-default`; chapter-cut budget 0 or 1 |
| `MotionSpec@1` | immutable candidate path selected by `ArtifactCandidate` | Motion Planner | Beats, persistent nodes, tracks, camera intent, bridges, cues | Direct Brief/Treatment/Research/assets bindings, registry snapshot/receipt identities, capability IDs/versions, one bridge per boundary |
| `CapabilityGap@1` | immutable candidate path selected by `ArtifactCandidate` | Motion Planner | Exact unsupported approved intent and honest available route descriptions | Closed payload in `capability-gap-contract.md`; source parents and current registry binding; external `gapContentHash` |
| `SemanticPatch@1` | immutable candidate path selected by `ArtifactCandidate` | Revision Interpreter | Bounded operations or owner-scoped rebuild directive, locks, impact | Base revision, current/staged parent hashes, expected lock-set hash, and closed user-request/review-repair cause |
| `AudioBriefArtifact@1` | immutable candidate path selected by `ArtifactCandidate` | Sound Designer | Music language and exactly one payoff cue | Current approved revision, RenderPlan, `previewApprovalHash`, `renderManifestHash`, `silentMasterHash` |

`ProjectPolicy@1` is user-owned configuration, not an orchestrator or host decision. The future deterministic `project-policy-ingress` interface only projects an attributed typed human request to canonical immutable candidate bytes; it cannot enable a host, add a host ID, or alter the user's policy fields.

```ts
type ProjectPolicy = {
  schemaVersion: "project-policy@1";
  projectId: string;
  previewApproval: {
    defaultActor: "human";
    hostOptIn: {
      enabled: boolean;
      allowedHostIds: HostId[];
    };
  };
};

type EffectivePolicyBinding =
  | {
      mode: "implicit-human-only";
      projectId: string;
      policyPath: null;
      policyHash: string;
      previewApproval: {
        defaultActor: "human";
        hostOptIn: {enabled: false; allowedHostIds: []};
      };
    }
  | {
      mode: "explicit-file";
      projectId: string;
      policyPath: string;
      policyHash: string;
      previewApproval: {
        defaultActor: "human";
        hostOptIn: {enabled: boolean; allowedHostIds: HostId[]};
      };
    };
```

When the checkpoint has no accepted current ProjectPolicy, resolve this exact hash preimage, which deliberately contains no `policyHash`: `{schemaVersion:"effective-policy@1", projectId, previewApproval:{defaultActor:"human", hostOptIn:{enabled:false, allowedHostIds:[]}}}`. `policyHash` is SHA-256 of that RFC 8785 projection. The resulting `implicit-human-only` binding adds `mode`, `projectId`, `policyPath:null`, and that hash; it is not self-referential. This implicit policy does not approve, auto-approve, or infer a human decision; it only defines who may submit one.

A host approval additionally requires the checkpoint's externally accepted current explicit policy, `enabled: true`, and the exact out-of-band `TrustedHostContext.hostId` in `allowedHostIds`. The recorder derives the durable actor as `{type:"host", id: trustedHostContext.hostId}` and requires the same trusted context to match the current request's adapter-bound host. Neither `WorkflowInvocation`, a Prompt, a model result, nor an operator payload may supply or override that actor ID. One adapter therefore cannot claim the other adapter's identity merely by writing its name. Missing policy permits explicit human approval but never host approval. The non-authoritative `_template` example is input guidance only and grants no authority.

Sound Designer owns only `audio-brief.json`. A future deterministic audio-prompt tool—not any role—owns `MUSIC_PROMPT.md`.

## Derived and gate artifacts

`RendererBuildManifest@1`, `ResolvedMotionIR@1`, `RenderPlan@1`, preview, sampled evidence bundle, `TechnicalQCReport@1`, `PreviewApproval@1`, silent final, `RenderManifestArtifact`, `MusicPromptDocument`, `MusicPromptAttempt@1`, `AudioAlignmentManifest@1`, `MuxManifest@1`, and `DeliveryManifest` are future deterministic-tool outputs. Creative and motion review paths are uniquely assigned in `prompt-manifest.json`. The future Approval recorder is the only producer of `PreviewApproval@1`; the attributed actor supplies the decision but does not hand-author the artifact.

The compiler and post-lock mux identities have closed, reloadable artifacts rather than free-floating hashes:

```ts
type ResolvedFrameRange = {
  id: string;
  startFrame: number;
  endFrameExclusive: number;
};

type ResolvedMotionIR = {
  schemaVersion: "resolved-motion-ir@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  capabilityRegistrySnapshotHash: string;
  implementationBindingHashes: string[];
  acceptedImplementationReceiptHashes: string[];
  canvas: {width: number; height: number; fps: 24 | 25 | 30 | 50 | 60};
  durationInFrames: number;
  beatRanges: [ResolvedFrameRange, ...ResolvedFrameRange[]];
  bridgeRanges: ResolvedFrameRange[];
  cameraSegments: Array<{id: string; range: ResolvedFrameRange; mode: "hold" | "move"; from: CameraState; to: CameraState}>;
  nodes: Array<{
    nodeId: string;
    renderer: RendererBinding;
    effects: EffectBinding[];
    geometrySamples: Array<{frame: number; value: GeometryState}>;
    styleSamples: Array<{frame: number; value: StyleState}>;
    contentSamples: Array<{frame: number; value: ContentState}>;
    visibilitySamples: Array<{frame: number; value: number}>;
  }>;
  producer: {interfaceId: "resolver-compiler"; interfaceVersion: "1.0.0"};
};

type EvidenceFrameRange = {
  startFrame: number;
  endFrameExclusive: number;
};

type EvidenceRequirement =
  | {
      requirementId: SafeAuditLabel;
      kind: "scan";
      purpose: "film-frame-scan";
      extension: "json";
      frameIndex: null;
      frameRange: EvidenceFrameRange;
      beatId: null;
      bridgeId: null;
    }
  | {
      requirementId: SafeAuditLabel;
      kind: "still";
      purpose: "beat-settled-frame";
      extension: "png";
      frameIndex: number;
      frameRange: EvidenceFrameRange;
      beatId: string;
      bridgeId: null;
    }
  | {
      requirementId: SafeAuditLabel;
      kind: "still";
      purpose: "positive-bridge-before" | "positive-bridge-midpoint" | "positive-bridge-after";
      extension: "png";
      frameIndex: number;
      frameRange: EvidenceFrameRange;
      beatId: null;
      bridgeId: string;
    }
  | {
      requirementId: SafeAuditLabel;
      kind: "scan";
      purpose: "positive-bridge-brightness-scan";
      extension: "json";
      frameIndex: null;
      frameRange: EvidenceFrameRange;
      beatId: null;
      bridgeId: string;
    }
  | {
      requirementId: SafeAuditLabel;
      kind: "still";
      purpose: "chapter-cut-outgoing-last" | "chapter-cut-incoming-first" | "chapter-cut-incoming-held";
      extension: "png";
      frameIndex: number;
      frameRange: EvidenceFrameRange;
      beatId: null;
      bridgeId: string;
    }
  | {
      requirementId: SafeAuditLabel;
      kind: "scan";
      purpose: "chapter-cut-full-frame-change";
      extension: "json";
      frameIndex: null;
      frameRange: EvidenceFrameRange;
      beatId: null;
      bridgeId: string;
    };

type FrameScanSample = {
  frameIndex: number;
  rgbaHash: string;
  pixelCount: number;
  minimumLuma8: number;
  maximumLuma8: number;
  luma8Sum: number;
  nonOpaquePixelCount: number;
  changedPixelCountFromPrevious: number | null;
};

type FrameScanArtifact = {
  schemaVersion: "frame-scan@1";
  scannerId: "rgba8-bt709-frame-scan-v1";
  frameRange: EvidenceFrameRange;
  canvas: {width: number; height: number; pixelFormat: "rgba8-bt709-limited"};
  samples: [FrameScanSample, ...FrameScanSample[]];
};

type RenderedFrameSequenceProbe = {
  schemaVersion: "rendered-frame-sequence-probe@1";
  algorithm: "sha256-rgba8-bt709-frame-sequence-v1";
  canvas: {width: number; height: number; pixelFormat: "rgba8-bt709-limited"};
  fps: 24 | 25 | 30 | 50 | 60;
  durationInFrames: number;
  frameCount: number;
  orderedFrameHashListHash: string;
  frameSequenceFingerprint: string;
};

type EvidenceProfile = {
  schemaVersion: "evidence-profile@1";
  profileId: "continuity-review-evidence-v1";
  motionSpecHash: string;
  durationInFrames: number;
  requirements: [EvidenceRequirement, ...EvidenceRequirement[]];
};

type TechnicalQCCheckId =
  | "profile-binding-integrity"
  | "preview-media-profile"
  | "evidence-manifest-bijection"
  | "evidence-byte-integrity"
  | "whole-film-frame-integrity"
  | "bridge-range-scan-coverage"
  | "text-layout-and-glyph-integrity"
  | "deterministic-replay";

type TechnicalQCProfile = {
  schemaVersion: "technical-qc-profile@1";
  profileId: "technical-qc-v1";
  evidenceProfileHash: string;
  requiredCheckIds: [
    "profile-binding-integrity",
    "preview-media-profile",
    "evidence-manifest-bijection",
    "evidence-byte-integrity",
    "whole-film-frame-integrity",
    "bridge-range-scan-coverage",
    "text-layout-and-glyph-integrity",
    "deterministic-replay",
  ];
};

type RendererBuildMember = {
  componentId: SafeAuditLabel;
  purpose: "engine-runtime" | "core-capability" | "project-capability" | "dependency-lock" | "render-profile";
  repositoryPath: RepositoryArtifactPath;
  contentHash: string;
  byteLength: number;
};

type RendererBuildManifest = {
  schemaVersion: "renderer-build-manifest@1";
  rendererBuildId: SafeAuditLabel;
  engineAbiVersion: "motion-renderer-abi@1";
  projectId: string;
  capabilityRegistrySnapshotHash: string;
  implementationBindingHashes: string[];
  acceptedImplementationReceiptHashes: string[];
  members: [RendererBuildMember, ...RendererBuildMember[]];
  producer: {interfaceId: "resolver-compiler"; interfaceVersion: "1.0.0"};
};

type RenderPlan = {
  schemaVersion: "render-plan@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  resolvedMotionIrHash: string;
  capabilityRegistrySnapshotHash: string;
  implementationBindingHashes: string[];
  acceptedImplementationReceiptHashes: string[];
  durationInFrames: number;
  canvas: {width: number; height: number; fps: 24 | 25 | 30 | 50 | 60};
  evidenceProfile: EvidenceProfile;
  evidenceProfileHash: string;
  technicalQcProfile: TechnicalQCProfile;
  technicalQcProfileHash: string;
  deterministicSeed: 0;
  rendererBuildId: SafeAuditLabel;
  rendererBuildHash: string;
  renderProfileHash: string;
  producer: {interfaceId: "resolver-compiler"; interfaceVersion: "1.0.0"};
};

type RepositoryArtifactPath = string & {readonly __repositoryArtifactPath: unique symbol};

type SampledEvidenceMember = {
  evidenceId: SafeAuditLabel;
  requirement: EvidenceRequirement;
  path: RepositoryArtifactPath;
  contentHash: string;
};

type SampledEvidenceManifest = {
  schemaVersion: "sampled-evidence-manifest@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  renderPlanHash: string;
  rendererBuildHash: string;
  renderProfileHash: string;
  evidenceProfileHash: string;
  technicalQcProfileHash: string;
  previewPath: RepositoryArtifactPath;
  previewHash: string;
  previewFrameSequenceProbe: RenderedFrameSequenceProbe;
  members: [SampledEvidenceMember, ...SampledEvidenceMember[]];
  producer: {interfaceId: "preview-evidence-renderer"; interfaceVersion: "1.0.0"};
};

type TechnicalQCCheckResult = {
  checkId: TechnicalQCCheckId;
  result: "pass";
  evidenceIds: [SafeAuditLabel, ...SafeAuditLabel[]];
};

type TechnicalQCReport = {
  schemaVersion: "technical-qc@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  renderPlanHash: string;
  rendererBuildHash: string;
  renderProfileHash: string;
  evidenceProfileHash: string;
  technicalQcProfileHash: string;
  previewHash: string;
  sampledEvidenceManifestHash: string;
  checkedMemberHashes: [string, ...string[]];
  checks: [TechnicalQCCheckResult, ...TechnicalQCCheckResult[]];
  decision: "pass";
  producer: {interfaceId: "technical-qc"; interfaceVersion: "1.0.0"};
};

type ApprovalTuple = {
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  renderPlanHash: string;
  rendererBuildHash: string;
  renderProfileHash: string;
  evidenceProfileHash: string;
  technicalQcProfileHash: string;
  previewHash: string;
  sampledEvidenceManifestHash: string;
  technicalQcHash: string;
  technicalQcDecision: "pass";
  creativeReviewHash: string;
  motionReviewHash: string;
  creativeDecision: "ship";
  motionDecision: "ship";
  effectivePolicyBinding: EffectivePolicyBinding;
  actor: {type: "human"; id: HumanActorId} | {type: "host"; id: HostId};
  reason: DurableInstructionText;
};

type PreviewApproval = ApprovalTuple & {
  schemaVersion: "preview-approval@1";
  producer: {interfaceId: "approval-recorder"; interfaceVersion: "1.0.0"};
};

type PictureStreamSampleRecord = {
  sampleIndex: number;
  decodeTimeTicks: number;
  durationTicks: number;
  compositionOffsetTicks: number;
  isSync: boolean;
  payloadByteLength: number;
  payloadHash: string;
};

type PicturePresentationMetadata = {
  pixelAspectRatio: {horizontalSpacing: 1; verticalSpacing: 1};
  cleanAperture: null;
  displayMatrix: "identity";
  rotationDegrees: 0;
  colorPrimaries: "bt709";
  transferCharacteristics: "bt709";
  matrixCoefficients: "bt709";
  fullRange: false;
  chromaLocation: "left";
};

type PictureStreamProbe = {
  schemaVersion: "picture-stream-probe@1";
  algorithm: "sha256-iso-bmff-h264-sample-table-v1";
  codec: "h264";
  width: number;
  height: number;
  fps: 24 | 25 | 30 | 50 | 60;
  durationInFrames: number;
  trackTimescale: number;
  trackDurationTicks: number;
  codecConfigurationHash: string;
  presentationMetadata: PicturePresentationMetadata;
  presentationMetadataHash: string;
  sampleCount: number;
  orderedSampleTableHash: string;
  pictureStreamFingerprint: string;
};

type RenderManifestArtifact = {
  schemaVersion: "render-manifest@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  renderPlanHash: string;
  previewApprovalHash: string;
  previewHash: string;
  sampledEvidenceManifestHash: string;
  silentMasterPath: RepositoryArtifactPath;
  silentMasterHash: string;
  durationInFrames: number;
  canvas: {width: number; height: number; fps: 24 | 25 | 30 | 50 | 60};
  codec: "h264";
  audioStreams: 0;
  rendererBuildId: SafeAuditLabel;
  rendererBuildHash: string;
  renderProfileHash: string;
  approvedPreviewFrameSequenceProbe: RenderedFrameSequenceProbe;
  silentFinalFrameSequenceProbe: RenderedFrameSequenceProbe;
  pictureEquivalencePolicy: "exact-rendered-rgba-sequence";
  pictureProbe: PictureStreamProbe;
  producer: {interfaceId: "silent-final-renderer"; interfaceVersion: "1.0.0"};
};

type AudioAlignmentManifest = {
  schemaVersion: "audio-alignment-manifest@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  previewApprovalHash: string;
  silentMasterHash: string;
  renderManifestHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
  promptContentHash: string;
  manualAudioReturnHash: string;
  trackContentHash: string;
  visualPayoffFrame: number;
  trackPayoffSeconds: number;
  trackPayoffMilliseconds: number;
  trackStartFrame: number;
  declaredPayoffFrame: number;
  trackSampleRateHz: number;
  trackSampleFrames: number;
  trackChannels: number;
  gainDb: number;
  gainMilliDb: number;
  pictureTimingPolicy: "locked-no-retime";
  producer: {interfaceId: "local-alignment-mux"; interfaceVersion: "1.0.0"};
};

type MuxManifest = {
  schemaVersion: "mux-manifest@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  previewApprovalHash: string;
  silentMasterHash: string;
  renderManifestHash: string;
  alignmentManifestHash: string;
  manualAudioReturnHash: string;
  trackContentHash: string;
  mixedMasterHash: string;
  durationInFrames: number;
  pictureStreamPolicy: "unchanged-locked-picture";
  sourcePictureProbe: PictureStreamProbe;
  mixedPictureProbe: PictureStreamProbe;
  audioStatus: "mixed";
  producer: {interfaceId: "local-alignment-mux"; interfaceVersion: "1.0.0"};
};

type DeliveryAudioSelection =
  | {
      audioStatus: "not-provided";
      manualAudioReturnHash: null;
      alignmentManifestHash: null;
      muxManifestHash: null;
      mixedMasterHash: null;
      deliveryMasterPath: RepositoryArtifactPath;
      deliveryMasterHash: string;
    }
  | {
      audioStatus: "mixed";
      manualAudioReturnHash: string;
      alignmentManifestHash: string;
      muxManifestHash: string;
      mixedMasterHash: string;
      deliveryMasterPath: RepositoryArtifactPath;
      deliveryMasterHash: string;
    };

type DeliveryManifest = {
  schemaVersion: "delivery-manifest@1";
  projectId: string;
  revisionId: string;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  renderPlanHash: string;
  previewApprovalHash: string;
  silentMasterHash: string;
  renderManifestHash: string;
  audioBriefHash: string;
  promptContentHash: string;
  promptAttemptHash: string;
  selection: DeliveryAudioSelection;
  editableProjectRoot: RepositoryArtifactPath;
  producer: {interfaceId: "delivery-packager"; interfaceVersion: "1.0.0"};
};
```

All ID-bearing projection arrays use unique stable IDs and their declared canonical order. Frame indices are non-negative integers and ranges are positive half-open intervals within `durationInFrames`. Within each `ResolvedMotionIR` node's geometry, style, content, or visibility sample array, frame values are unique ascending integers; evidence requirements instead use the exact purpose order below and may intentionally sample one frame under two distinct requirements. All states/bindings are the exact closed MotionSpec types. `cameraSegments`, Beat/bridge ranges, nodes, renderer/effect tuples, and state samples are a deterministic projection of the accepted MotionSpec and bound registry; the compiler cannot add a fallback, asset, copy value, capability, or timing decision.

Before constructing a RenderPlan, the resolver/compiler creates one `RendererBuildManifest` from safely opened, same-handle-hashed repository bytes. `members` is the exact transitive static-import and runtime-byte closure: it contains at least one `engine-runtime` member; exactly every built-in implementation selected by the bound registry as `core-capability`; exactly every accepted project implementation selected by the receipt/binding lists as `project-capability` (possibly none); exactly one `dependency-lock`; and exactly one `render-profile`. The literal canonical purpose order is engine runtime, core capability, project capability, dependency lock, then render profile, with `repositoryPath` ascending inside one purpose. Component IDs and paths are unique. A directory, glob, package-name-only claim, unlisted dynamic import, ambient dependency, symlink, mutable alias, missing transitive byte, or extra runtime byte is refusal.

Each build member's positive `byteLength` and `contentHash` come from the exact regular single-link handle that the later sandbox receives. `capabilityRegistrySnapshotHash`, `implementationBindingHashes`, and `acceptedImplementationReceiptHashes` equal the RenderPlan source bindings. The unique render-profile member's `contentHash` is `renderProfileHash`. `rendererBuildHash` is external SHA-256 of the complete RFC 8785/JCS `RendererBuildManifest` bytes; the manifest contains no `rendererBuildHash` or other self identity. Only after computing it does the compiler derive `out/<project-id>/<revision-id>/<render-plan-hash>/renderer/<renderer-build-hash>/renderer-build-manifest.json`, exclusively write/reload those exact bytes, and bind `rendererBuildHash` plus `renderProfileHash` in the RenderPlan. `rendererBuildId` is only a safe diagnostic label, not content identity, version proof, or authority.

The preview renderer, Technical QC, Approval recorder, and silent-final renderer safely reload that content-addressed build manifest and require exact equality with the RenderPlan. `SampledEvidenceManifest`, `TechnicalQCReport`, `ApprovalTuple`, and `RenderManifestArtifact` repeat `rendererBuildHash` and `renderProfileHash`; the Render Manifest also repeats the non-authoritative label. A changed engine byte, core/project capability byte, dependency lock, profile byte, build manifest, hash, or member order makes every preview/evidence/QC/review/approval/final result under the old RenderPlan stale. Runtime access to a byte absent from the manifest is refusal.

The compiler derives `EvidenceProfile.requirements` from the accepted MotionSpec in one closed non-empty order. The first member is the whole-film `film-frame-scan` over `[0, durationInFrames)`. Next comes exactly one `beat-settled-frame` for every Beat in timeline order, sampled at that Beat's resolved `settleAt`. Then each bridge contributes members in timeline order. A positive-duration bridge contributes `positive-bridge-before`, `positive-bridge-midpoint`, `positive-bridge-after`, and `positive-bridge-brightness-scan` in that order, using the exact frame formulas and exact scan range in `review-contract.md`. A chapter cut contributes `chapter-cut-outgoing-last`, `chapter-cut-incoming-first`, `chapter-cut-incoming-held`, and `chapter-cut-full-frame-change` in that order, using that contract's exact boundary, resolved incoming-hold start, and two-frame scan range. Every still has `[frameIndex, frameIndex + 1)`; every scan has `frameIndex:null`. No other purpose, convenient sample, optional member, or caller-selected profile is legal.

The compiler assigns each requirement the safe ID `e` followed by its one-based, six-digit zero-padded ordinal in that exact list (`e000001`, `e000002`, and so on); more than 999999 requirements is refusal. `evidenceProfileHash` is SHA-256 of the complete RFC 8785/JCS `EvidenceProfile` bytes. `TechnicalQCProfile.evidenceProfileHash` must equal it. `technicalQcProfileHash` is SHA-256 of the complete RFC 8785/JCS `TechnicalQCProfile` bytes. Both nested profiles and both recomputed hashes must equal the values embedded in the RenderPlan; neither profile contains its own hash.

`SampledEvidenceManifest.members` forms an exact ordered bijection with `EvidenceProfile.requirements`, with no missing, extra, duplicate, or reordered member. For every position, `evidenceId === requirement.requirementId`, the nested requirement is byte-for-byte equal to the same-position profile requirement, and `path` equals `out/<project-id>/<revision-id>/<render-plan-hash>/evidence/items/<evidence-id>.<extension>`. Stills are deterministic full-canvas PNGs. Every scan file is the complete RFC 8785/JCS `FrameScanArtifact` for the requirement's exact range: its samples are a non-empty ascending frame-by-frame bijection over that half-open range, its canvas equals the RenderPlan, and `pixelCount === width * height` under checked integer arithmetic.

The scanner decodes the locked render profile to row-major RGBA8 using its literal BT.709 limited-range conversion. `rgbaHash` is SHA-256 of one frame's exact row-major RGBA bytes. For each pixel it computes integer `luma8 = floor((54 * R + 183 * G + 19 * B) / 256)`; the minimum, maximum, and checked integer sum cover all pixels, and `nonOpaquePixelCount` counts alpha values other than 255. The first sample has `changedPixelCountFromPrevious:null`; every later sample counts positions whose complete RGBA tuple differs from the immediately prior sample in that same scan. A missing frame, non-canonical result, wrong range/order/canvas/count, overflow, unsupported color conversion, or decoder ambiguity refuses the evidence render. These metrics expose black/empty/full-frame-change evidence deterministically; whether a dark or empty composition is narratively justified remains Motion Review judgment, not a Technical-QC invention. Every path is under the same render-plan lineage and every content hash is recomputed from a safely opened handle. The manifest's two profile hashes equal the safely reloaded RenderPlan profiles.

`RenderedFrameSequenceProbe` is computed from the exact pre-encode full-canvas row-major RGBA8 frames emitted by the deterministic motion renderer, not from container bytes or a caller summary. Each frame hash is SHA-256 of that frame's exact bytes in ascending frame order. `orderedFrameHashListHash` is SHA-256 of the RFC 8785/JCS non-empty frame-hash array, `frameCount === durationInFrames`, and `frameSequenceFingerprint` is SHA-256 of the RFC 8785/JCS projection `{schemaVersion,algorithm,canvas,fps,durationInFrames,frameCount,orderedFrameHashListHash}`. The evidence renderer stores this probe as `SampledEvidenceManifest.previewFrameSequenceProbe`; its canvas, FPS, and duration equal the RenderPlan, and its frames are the same frames sent to the preview encoder.

`TechnicalQCProfile.requiredCheckIds` is the literal eight-member tuple shown above and is not configurable. The checks have these fixed pass predicates: `profile-binding-integrity` reloads and recomputes the RenderPlan, renderer-build/profile identities, and both evidence/QC profile identities; `preview-media-profile` verifies the exact codec, canvas, FPS, duration, frame count, stream set, complete decodability, and bound preview frame-sequence probe; `evidence-manifest-bijection` verifies the ordered requirement/member equality; `evidence-byte-integrity` safely reloads every path and recomputes every hash; `whole-film-frame-integrity` verifies that the whole-film `FrameScanArtifact` has exactly one valid sample for every frame; `bridge-range-scan-coverage` verifies every bridge still plus the exact complete typed scan range required above; `text-layout-and-glyph-integrity` verifies every visible text node's resolved bounds, safe area, line limit, and glyph coverage; and `deterministic-replay` reruns the same RenderPlan in a clean deterministic runtime and requires a byte-for-byte equal `RenderedFrameSequenceProbe` plus equal RGBA hashes for every required still and scan range. A check may say `pass` only after its complete predicate succeeds.

`TechnicalQCReport.checks` forms an exact ordered bijection with `TechnicalQCProfile.requiredCheckIds`, with no missing, extra, duplicate, or reordered check. Every check result's `evidenceIds` equals the complete non-empty manifest member-ID list in manifest order. `checkedMemberHashes` has the same non-empty length and order as `SampledEvidenceManifest.members` and contains the corresponding `contentHash` at every position; equal file bytes may therefore produce repeated hashes. The report's profile hashes must equal the safely reloaded manifest and RenderPlan hashes. A successful report contains only those eight `pass` members and `decision:"pass"`; any false predicate, absent profile/member/check, unknown result, duplicate, mismatch, or incomplete execution is interface refusal, never a smaller successful report.

The compiler writes immutable sibling files at `out/<project-id>/<revision-id>/<render-plan-hash>/resolved-motion-ir.json` and `.../render-plan.json`. `resolvedMotionIrHash` is SHA-256 of the complete RFC 8785/JCS `ResolvedMotionIR` bytes, and `renderPlanHash` is SHA-256 of the complete RFC 8785/JCS `RenderPlan` bytes; neither file contains its own external identity. Directory `<render-plan-hash>` equals the recomputed plan identity, and `RenderPlan.resolvedMotionIrHash` equals the recomputed IR identity.

The evidence renderer writes immutable preview bytes and `evidence-manifest.json`; `previewHash` is SHA-256 of the exact MP4 bytes and `sampledEvidenceManifestHash` is SHA-256 of the complete RFC 8785/JCS `SampledEvidenceManifest` bytes, including its preview frame-sequence probe. Technical QC writes `technical-qc.json`; `technicalQcHash` is SHA-256 of the complete RFC 8785/JCS `TechnicalQCReport` bytes. Approval writes `preview-approval.json`; external `previewApprovalHash` is SHA-256 of the complete RFC 8785/JCS `PreviewApproval` bytes. Silent final writes exact master bytes plus `render-manifest.json`; `silentMasterHash` is SHA-256 of the MP4 and `renderManifestHash` is SHA-256 of the complete RFC 8785/JCS `RenderManifestArtifact`. None contains its own external identity.

Before silent-final success, the renderer verifies the reloaded PreviewApproval and then safely reloads its exact bound sampled evidence manifest and preview bytes. `RenderManifestArtifact.previewHash` and `sampledEvidenceManifestHash` must equal those reloaded identities and the complete Approval tuple. The renderer copies the manifest's exact preview probe into `approvedPreviewFrameSequenceProbe`, independently computes `silentFinalFrameSequenceProbe` from the exact pre-encode frames sent to the silent-master encoder, and requires `approvedPreviewFrameSequenceProbe` and `silentFinalFrameSequenceProbe` to be byte-for-byte equal under `pictureEquivalencePolicy:"exact-rendered-rgba-sequence"`. It also requires the probe metadata to equal the current RenderPlan and renderer build. A missing preview/evidence byte, stale approval binding, mismatched frame, reordered frame, changed canvas/FPS/duration, or unavailable exact frame capture refuses without a silent master or Render Manifest. The preview and silent-final MP4 containers may have different byte hashes or encoder settings, but the approved rendered picture sequence may not change.

`PictureStreamProbe` has one deterministic algorithm. A safe ISO-BMFF demux must find exactly one H.264 picture track with exactly one active AVC sample description and walk its samples in decode/sample-table order. `codecConfigurationHash` is SHA-256 of the exact active `avcC` box payload bytes. The only accepted display semantics are the literal `PicturePresentationMetadata` above: square pixels, no clean-aperture crop, identity display matrix and zero rotation, BT.709 primaries/transfer/matrix, limited range, and left chroma location. `presentationMetadataHash` is SHA-256 of the complete RFC 8785/JCS metadata object after exact demux normalization; missing, contradictory, duplicate, or alternate presentation metadata is refusal rather than a default. For each sample the probe constructs the exact `PictureStreamSampleRecord` above: `sampleIndex` is the zero-based ordinal, `decodeTimeTicks` is cumulative prior duration, `durationTicks` and signed `compositionOffsetTicks` come from the track tables, `isSync` comes from the sync table, `payloadByteLength` is the exact sample byte length, and `payloadHash` is SHA-256 of those exact sample payload bytes. All counts/times except the signed composition offset are checked non-negative integers, `durationTicks` is positive, and `sampleCount` equals the non-empty record count. Unknown timing, edit-list ambiguity, an absent or multiple/unsupported H.264 description, any extra picture track, integer overflow, or an unenforceable bound is refusal.

`orderedSampleTableHash` is SHA-256 of the RFC 8785/JCS bytes of the complete ordered non-empty `PictureStreamSampleRecord[]`. `pictureStreamFingerprint` is SHA-256 of the RFC 8785/JCS projection `{schemaVersion,algorithm,codec,width,height,fps,durationInFrames,trackTimescale,trackDurationTicks,codecConfigurationHash,presentationMetadataHash,sampleCount,orderedSampleTableHash}` in that named-field shape. It contains no path, unrelated container metadata, audio metadata, build ID, wall clock, or caller value. `RenderManifestArtifact.pictureProbe` is computed from the safely opened silent master and its canvas/duration fields must agree with the manifest.

The mux interface first computes `alignmentManifestHash` from the complete RFC 8785/JCS `AudioAlignmentManifest` bytes, produces the exact mixed-master bytes, computes `mixedMasterHash` over those bytes, and probes both the safely reloaded silent source and mixed output. `sourcePictureProbe` must be byte-for-byte equal to the safely reloaded `RenderManifestArtifact.pictureProbe`, and `sourcePictureProbe` and `mixedPictureProbe` must be byte-for-byte equal. This equality proves that muxing preserved every H.264 sample payload and its decode/composition timing, as well as canvas, FPS, duration, and frame count; a literal policy label alone is not proof.

Only after those values exist does the interface construct the path-free `MuxManifest`, compute `muxManifestHash` as SHA-256 of its complete RFC 8785/JCS bytes, and derive the immutable output paths `out/<project-id>/<revision-id>/<render-plan-hash>/audio/mux/<mux-manifest-hash>/alignment-manifest.json`, `.../mux-manifest.json`, and `.../mixed-master.mp4`. No output path is in the MuxManifest hash preimage, and neither manifest contains its own identity. The writer exclusively creates those exact derived targets, reloads them safely, and requires the alignment, manifest, and mixed-master identities to match before success.

Delivery writes exactly `out/<project-id>/<revision-id>/<render-plan-hash>/delivery/<delivery-manifest-hash>/delivery-manifest.json`. `deliveryManifestHash` is external SHA-256 over the complete RFC 8785/JCS `DeliveryManifest` bytes; the manifest contains no self identity. For `not-provided`, `deliveryMasterHash === silentMasterHash` and the path is the exact silent master; all mixed-only hashes are null. For `mixed`, `deliveryMasterHash === mixedMasterHash`, the path selects the exact mux-lineage master, and all manual/alignment/mux identities are non-null and match safely reloaded artifacts. `editableProjectRoot` equals the normalized `projects/<project-id>` root; it grants no new write authority.

Every canonical artifact has schema version, project ID, revision ID where applicable, parent hashes, canonical SHA-256 content identity, and strict producer identity. Determinism means canonical inputs, exact plans and timings, bound implementation identities, exact preview-to-final rendered-frame equivalence, and tolerance-based measurements only where a separate review rule explicitly declares a tolerance. It does not require separately encoded MP4 containers to have identical bytes.

## Exact same-plan dependency tuples

Hash binding is byte binding. A dependency byte/content-hash change is stale even when `revisionId` and `renderPlanHash` remain the same.

- `PreviewEvidenceTuple@1` = `{projectId, revisionId, briefHash, treatmentHash, motionSpecHash, renderPlanHash, rendererBuildHash, renderProfileHash, evidenceProfileHash, technicalQcProfileHash, previewHash, sampledEvidenceManifestHash}`. `previewHash` identifies exact preview bytes; the sampled manifest binds the exact renderer build/profile, both closed evidence/QC profiles, and every sampled frame/scan path and content hash.
- `TechnicalQCTuple@1` = `PreviewEvidenceTuple@1 + {technicalQcHash, technicalQcDecision:"pass"}`. The report itself binds and verifies the whole preview tuple.
- Each completed Review tuple = `TechnicalQCTuple@1 + {reviewKind, reviewContentHash, producerPromptHash, reviewBundleHash, evidenceHash, decision}`. `reviewBundleHash` equals the sampled evidence manifest hash unless a deterministic wrapper manifest is documented and itself binds that hash.
- `ApprovalTuple@1` is the exact `ApprovalTuple` type above: the complete Technical-QC tuple plus both exact review hashes and `ship` decisions, the nested attributed `actor`, non-empty `DurableInstructionText` reason, and `effectivePolicyBinding`. Its `policyHash` is the exact effective implicit projection or accepted explicit `ProjectPolicy@1` identity. `PreviewApproval@1` intersects that one tuple with only schema version and recorder producer identity; it adds no self-hash field and cannot omit or restate a tuple member under another shape.
- `LockedPictureTuple@1` = `ApprovalTuple@1 + {previewApprovalHash, silentMasterHash, renderManifestHash}`. The Render Manifest binds the silent-master bytes, the exact RenderPlan, renderer/build identity, and approval hash.
- `PostLockAudioTuple@1` = `LockedPictureTuple@1 + {audioBriefHash, promptContentHash, promptAttemptHash}` and, when a track is returned, `{manualAudioReturnHash, sourceLabel, trackPayoffSeconds, trackPayoffMilliseconds, gainDb, gainMilliDb, trackSampleRateHz, trackSampleFrames, trackChannels, alignmentManifestHash, muxManifestHash, mixedMasterHash}`. `promptContentHash` always means the SHA-256 of the exact selected `MUSIC_PROMPT.md` bytes; no second prompt-byte hash name exists. Every post-lock artifact binds the Render Manifest and approval hash; audio can never retime picture.
- `DeliveryTuple@1` = one exact complete `PostLockAudioTuple@1` plus `{audioStatus:"not-provided"|"mixed", deliveryManifestHash}`. This is the Ledger's external delivery record, not the `DeliveryManifest` hash preimage. `not-provided` still requires the actual AudioBrief and content-addressed prompt attempt; it omits only manual-track/alignment/mux/mixed-master members.

Silent delivery therefore always binds `audioBriefHash` and `promptContentHash` plus `promptAttemptHash`; silence means no returned track, not a bypass around the prompt handoff.

QC is stale if preview bytes or the sampled evidence bundle changes. Either review is stale if any preview/QC/evidence dependency or its own bytes change. Approval is stale if any preview, evidence, QC, review, actor attribution, reason, or Project Policy byte/hash changes. Silent final verifies the whole approval tuple; replacing approval bytes or the Render Manifest invalidates downstream audio. Any Render Manifest, silent master, approval, AudioBrief, prompt, manual return, alignment, or mux hash change invalidates dependent post-lock audio and delivery.

## Preview approval artifact

`PreviewApproval@1` is stored beneath the exact output lineage at `out/<project-id>/<revision-id>/<render-plan-hash>/approval/preview-approval.json`. It contains the complete `ApprovalTuple@1`, attributed actor and non-empty reason, recorder producer identity, and named parent hashes. `PreviewApproval@1` **does not contain** `previewApprovalHash`, `contentHash`, or any other self-identity field. The external `previewApprovalHash` is raw lowercase SHA-256 of the complete canonical file bytes; the Ledger and downstream artifacts store that identity. It is valid only when both exact completed reviews say `ship` and Technical QC passes. Reviewer `ship`, policy opt-in, or conversational approval alone is never the artifact.

## Capability-gap identity

The persisted `CapabilityGap@1` payload does not contain `contentHash`. Its external `gapContentHash` is the lowercase SHA-256 of the complete canonical JSON bytes, so the identity cannot be self-referential. Persisted bytes must equal that canonical serialization; non-canonical bytes are refused. The exact `CapabilityGapRouteDecision@1` shape is `{schemaVersion, pauseId, gapPath, gapContentHash, originPlanningContext, decision, actor, reason}` as closed in `capability-gap-contract.md`; this summary may not omit or default a binding. The orchestrator reloads/recomputes the external identity and requires every field to match the current pause/context before routing. Changing any payload, pause, context, decision, actor, or reason invalidates the old route evidence.

## Music prompt attempt

The future deterministic audio-prompt generator creates one immutable attempt directory:

`out/<project-id>/<revision-id>/<render-plan-hash>/audio/<audio-brief-hash>/prompts/<prompt-attempt-hash>/`

It contains `MUSIC_PROMPT.md` and `prompt-attempt.json`:

```ts
type MusicPromptAttempt = {
  schemaVersion: "music-prompt-attempt@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  previewApprovalHash: string;
  renderManifestHash: string;
  silentMasterHash: string;
  promptContentHash: string;
  producer: {
    interfaceId: "audio-prompt-generator";
    interfaceVersion: "1.0.0";
    templateId: "music-prompt-document";
    templateVersion: "1.0.0";
    compilerId: "audio-prompt-compiler";
    compilerVersion: "1.0.0";
    compilerContractVersion: "audio-prompt-projection/1";
  };
  parentHashes: {
    audioBriefHash: string;
    previewApprovalHash: string;
    renderManifestHash: string;
    silentMasterHash: string;
  };
  contentHash: string;
};
```

The named `parentHashes` object has no ordering ambiguity under JCS and exactly duplicates the four matching top-level bindings. `promptContentHash` is the exact Markdown-byte hash. The stored attempt identity is only `contentHash`, computed over the canonical attempt envelope with `contentHash` omitted. `promptAttemptHash` is an external/path alias equal to that `contentHash`; `prompt-attempt.json` stores no second `promptAttemptHash`. Both files are immutable; a changed brief, picture binding, compiler/template/compiler version, implementation, normalization/projection rule, or prompt bytes creates a new attempt.

## Prompt-layer interfaces

- `WorkflowInvocation`: ephemeral `{userRequest, requestedProjectId?, suppliedLocalPaths[]}` with no host field. The adapter supplies `TrustedHostContext` separately out-of-band. Arbitrary host-native source paths are direct user locators only. Before ingress, the adapter assigns deterministic locator IDs, records the typed declaration request without path values, and binds the ephemeral locator set by hash; the local-source ingress rule in `artifact-acceptance.md` must stage accepted bytes before any canonical ResearchSource may refer to them.
- `WorkflowDecision@1`: the exact closed union in `workflow-decision.md`, with deterministic project-ID/default policy, exact role delegation, deterministic non-role interface invocation, producer-free advances, state/evidence/route/stop metadata, `repairCycleId`, both counters, and no source authority.
- `RoleResult@1`: ephemeral `written | blocked | advisory` handoff defined in `role-result.md`; `written` carries an exact `ArtifactCandidate`, and `advisory` is non-canonical.
- `ResearchFindings@1`: the exact closed shape in `role-artifact-contracts.md`, summarized as `{schemaVersion, projectId, status, sources[], findings[], measurements[], inferences[], inputTrustFindings[], unresolved[]}`; every finding and measurement points to a declared local source and typed location.
- `CapabilityGap@1` and `CapabilityGapRouteDecision@1`: the exact closed, separate types in `capability-gap-contract.md`. The payload excludes all hash/actor/decision/authorization fields; the route decision binds external `gapContentHash`, attributed human actor, and reason.
- `ProjectLocalCapabilityProposal@1`: ephemeral in Part 1. It may describe gap/project/capability identity, closed proposed source manifest, fixtures, tests, performance budget, stable-root continuity identity, boundary checks, and registration request, but it grants no current writes or implementation success.
Manual third-party output uses a two-part local ingress contract. The durable attributed request contains only a stable locator ID and the hash of a separate ephemeral envelope; the arbitrary host-native locator is never a `WorkflowOperatorInput` and never enters the Ledger:

```ts
type ManualAudioIngressBudget = {
  maxEncodedBytes: 268435456;
  maxDecodedBytes: 536870912;
  maxDurationSeconds: 300;
  maxSampleRateHz: 192000;
  maxChannels: 8;
};

type ManualAudioIngressRequest = {
  kind: "manual-audio-ingress-request";
  pauseId: string;
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
  promptContentHash: string;
  localAudioLocatorId: SafeLocatorId;
  locatorEnvelopeHash: string;
  sourceLabel: DurableInstructionText;
  trackPayoffSeconds: number;
  gainDb: number;
  rights: {
    status: "owned" | "licensed" | "permission-confirmed";
    statement: DurableInstructionText;
  };
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type EphemeralManualAudioLocatorEnvelope = {
  locatorEnvelopeHash: string;
  locatorId: SafeLocatorId;
  localAudioLocator: string;
};

type ManualAudioReturn = {
  schemaVersion: "manual-audio-return@1";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
  promptContentHash: string;
  promptAttemptPath: RepositoryArtifactPath;
  stagedTrackPath: RepositoryArtifactPath;
  trackContentHash: string;
  sourceLabel: DurableInstructionText;
  trackPayoffSeconds: number;
  trackPayoffMilliseconds: number;
  gainDb: number;
  gainMilliDb: number;
  trackSampleRateHz: number;
  trackSampleFrames: number;
  trackChannels: number;
  rights: {
    status: "owned" | "licensed" | "permission-confirmed";
    statement: DurableInstructionText;
  };
  actor: {type: "human"; id: HumanActorId};
  producer: {interfaceId: "manual-audio-ingress"; interfaceVersion: "1.0.0"};
};
```

`locatorEnvelopeHash` is SHA-256 of the RFC 8785 projection `{locatorId,localAudioLocator}`. `manual-audio-ingress` receives the durable request and separately supplied ephemeral envelope, requires `localAudioLocatorId === locatorId`, recomputes the exact envelope hash, and reads only that directly supplied locator—never a URL/directory/glob/embedded path. It performs `lstat`, refuses every symlink, directory, device, socket, or non-regular file, opens with `O_NOFOLLOW` (or an equivalent no-follow primitive), then copies and hashes bytes from that same opened file handle so a path swap cannot change the observed source between validation and staging. The envelope is not written to a candidate, event, diagnostic, receipt, or return.

`ManualAudioIngressRequest.trackPayoffSeconds` and `gainDb` are never open floating-point controls. `trackPayoffSeconds` must be a finite non-negative JSON number no greater than `ManualAudioIngressBudget.maxDurationSeconds`, with a mathematical decimal expansion of at most three decimal places. `gainDb` must be finite, between `-60` and `+12` inclusive, and also have at most three decimal places. Exponent spellings, negative zero, a value requiring rounding, NaN, infinity, and overflow are refusal. The ingress interface converts without rounding to the exact integers `trackPayoffMilliseconds = trackPayoffSeconds * 1000` and `gainMilliDb = gainDb * 1000`; both products must be safe integers, with `-60000 <= gainMilliDb <= 12000`.

The sandbox decoder reports `trackSampleRateHz`, `trackSampleFrames`, and `trackChannels` as positive integers, where `trackSampleFrames` is the per-channel decoded sample-frame count. They must satisfy the exact manual-audio ceilings, checked decoded-byte accounting, and `trackPayoffMilliseconds * trackSampleRateHz < trackSampleFrames * 1000`, so the declared payoff is inside rather than at the exclusive end of the track. The closed `ManualAudioReturn` repeats the two exact human numbers and stores those five derived integers; the request cannot supply them. Reloading the staged bytes must reproduce the same metadata exactly or the return is stale/refused.

The interface derives the exact canonical `promptAttemptPath` from the already verified tuple as `out/<project-id>/<revision-id>/<render-plan-hash>/audio/<audio-brief-hash>/prompts/<prompt-attempt-hash>/prompt-attempt.json`; the durable request cannot supply or redirect it. Before any destination creation, `manual-audio-ingress` verifies a supported audio format from magic bytes and decoder output only inside the central `MediaDecodeSandbox` in `artifact-acceptance.md`. The sandbox receives the same opened file descriptor already checked with no-follow semantics; it never reopens a caller path. It inherits the exact `ManualAudioIngressBudget` ceilings without widening: encoded bytes, cumulative decoded bytes, duration, sample rate, and channels may not exceed those values. Inside that sandbox there is no network, no ambient credentials, no general host filesystem access beyond that inherited descriptor, no writable temporary storage, and no child process creation. It may return only the contract's typed bounded outputs. Unknown size, integer overflow, malformed metadata, unknown sandbox support, or a host/decoder that cannot enforce every sandbox property and resource ceiling is refusal before staging. The interface then stages exact bytes at `projects/<project-id>/audio/manual/<track-content-hash>/track.<verified-audio-extension>`. The extension is one of `wav | mp3 | m4a | ogg | flac` and never comes from the original basename. Destination creation/reuse follows the anchored directory-handle, no-follow, exclusive-create, regular-file, link-count-one protocol in `artifact-acceptance.md`. The closed return carries only the derived repository path, attribution, and rights; no original locator or basename byte enters it.

Before alignment, the interface safely reloads the derived `prompt-attempt.json`, its sibling `MUSIC_PROMPT.md`, and the returned staged track through anchored repository handles, no-following every component. It recomputes the attempt envelope identity from the exact reloaded `prompt-attempt.json` bytes and requires it to equal the selected `promptAttemptHash`; it separately recomputes and verifies `promptContentHash` and `trackContentHash` from their exact opened handles. Each file must be regular with link count one, and only those verified bytes may be parsed or muxed. Every alignment/mux audio or picture decode, demux, and probe inherits the same central `MediaDecodeSandbox`: it receives only each same opened file descriptor, applies the exact applicable central and ingress resource ceilings without widening, has no network, ambient credentials, general host filesystem access, writable temporary storage, or child process creation, and emits only typed bounded outputs. Unknown sandbox support or any runtime that cannot enforce every isolation property and ceiling refuses before alignment or mux output. Project, revision, RenderPlan, AudioBrief, prompt, and locked-picture bindings must match. Track A cannot be aligned under attempt B. `trackPayoffSeconds` is the human declaration, never claimed automatic analysis. The external `manualAudioReturnHash` is SHA-256 of the canonical `ManualAudioReturn` bytes; the return contains no self-hash and no alternate manual-audio identity name exists.

Alignment is a deterministic frame-quantized shift, never musical analysis. `visualPayoffFrame` is the unique payoff cue frame safely reloaded from the exact bound `AudioBriefArtifact`; `fps` and `durationInFrames` are the locked RenderPlan values. Using checked integer arithmetic and round-half-up for the sole seconds-to-frame conversion, derive exactly:

```text
declaredPayoffFrame = floor((2 * trackPayoffMilliseconds * fps + 1000) / 2000)
trackStartFrame = visualPayoffFrame - declaredPayoffFrame
```

`visualPayoffFrame`, `declaredPayoffFrame`, `trackPayoffMilliseconds`, `trackSampleRateHz`, `trackSampleFrames`, `trackChannels`, and `gainMilliDb` are integers; only `trackStartFrame` may be negative. `AudioAlignmentManifest` copies every derived value plus the exact validated `trackPayoffSeconds` and `gainDb`. Full-picture coverage requires both exact checked inequalities:

```text
trackStartFrame <= 0
trackSampleFrames * fps >= (durationInFrames - trackStartFrame) * trackSampleRateHz
```

The first condition forbids a leading uncovered interval; the second proves the unretimed track reaches the picture's exclusive end. Audio before frame zero and after the picture end is excluded by output timestamps. There is no padding, looping, time-stretching, or resampling, and picture frames/timestamps never move. Gain is the sole sample-level adjustment; automatic normalization, payoff detection, beat detection, clipping, and a second alignment anchor are forbidden. Any non-finite intermediate, checked-integer overflow, out-of-track payoff, uncovered picture time, stale decoder metadata, or inability to preserve these rules refuses before muxing.

## Lifecycle

Initial validated visual source with `currentRevisionId: null` may be snapshotted exactly once as `rev-0001`. Every later source change uses a `SemanticPatch@1`, creates a new revision, preserves locks, validates declared impact, and invalidates all downstream tuples. Direct edits plus another snapshot are forbidden.

An approved locked silent cut precedes AudioBrief. The deterministic prompt attempt is content-addressed beneath that RenderPlan lineage. The user may deliver no track, or manually return one for optional local alignment/mux. Post-lock audio never mutates plan-addressed visual files, and immutable attempts coexist rather than overwriting an authoritative “latest.”

## Continuity invariants

Beats are narrative states in one Persistent World, not slides. Stable nodes retain identity. Every adjacent pair has one measurable bridge. The maximum across the film is one justified zero-duration chapter cut. Non-cut bridges have positive duration and prove preroll, eye trace, motion ownership, and the appropriate endpoint/geometry/velocity evidence.
