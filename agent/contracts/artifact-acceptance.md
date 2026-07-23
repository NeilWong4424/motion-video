# Artifact acceptance documentation contract

## Status and purpose

This Part 1 contract defines the future deterministic `artifact-validation-and-hashing` interface. It implements no schema runtime, validator, serializer, writer, CLI, media engine, or Remotion code.

Semantic producers author and supply immutable canonical candidate bytes; only the trusted host candidate writer persists them. Acceptance owns only mechanical validation, parent verification, prompt provenance, and external content identity. It cannot normalize prose, reorder author-owned arrays, repair a schema, make a creative decision, or back-patch a self-hash.

```text
producer decision records exact prompt binding (for roles)
→ producer supplies exact canonical candidate bytes to the opaque sink
→ trusted candidate writer exclusively persists them and returns a matching receipt
→ RoleResult@1.status="written" carries ArtifactCandidate
→ Ledger captures candidate bytes/hash as pending
→ artifact-validation-and-hashing reloads and verifies the same bytes
→ one interface-result-recorded event embeds ArtifactAcceptance@1
→ that same event atomically applies AcceptanceContext's one continuation
```

## Canonical byte and path law

Canonical JSON is RFC 8785/JCS UTF-8 with no BOM or trailing newline. Duplicate keys, undeclared fields, non-finite numbers, unpaired surrogates, comments, and non-canonical bytes are refused rather than rewritten. Every SHA-256 is raw lowercase 64-hex. `ArtifactAcceptance.contentHash` is SHA-256 over the complete accepted candidate bytes; it is external and is never inserted into the semantic artifact.

Every path is normalized repository-relative, with no URL, absolute prefix, `..`, glob, environment/tilde expansion, command substitution, or mutable `latest` alias. Role candidates use request/attempt paths beneath `projects/<project-id>/.workflow/candidates/`; review attempts are separately immutable. Accepted bytes cannot be modified in place.

Every role/reviewer JSON candidate also obeys one exact non-adjustable parser/storage envelope:

```ts
type ArtifactCandidateBudget = {
  profile: "artifact-candidate-budget@1";
  maxUtf8Bytes: 8388608;
  maxJsonDepth: 128;
  maxJsonTokens: 262144;
  maxObjectMembersPerObject: 65536;
  maxArrayMembersPerArray: 65536;
  maxStringUnicodeScalarsPerValue: 65536;
  maxStringUnicodeScalarsTotal: 1048576;
};

type ReviewCandidateBudget = {
  profile: "review-candidate-budget@1";
  maxUtf8Bytes: 4194304;
  maxJsonDepth: 64;
  maxJsonTokens: 131072;
  maxObjectMembersPerObject: 16384;
  maxArrayMembersPerArray: 16384;
  maxStringUnicodeScalarsPerValue: 32768;
  maxStringUnicodeScalarsTotal: 524288;
};
```

Creative- and Motion-Review candidates use `ReviewCandidateBudget`; every other role candidate uses `ArtifactCandidateBudget`. The limits are literal system constants and cannot be raised by the user, role, prompt, project, or artifact. Before creating a destination, the trusted candidate writer counts the exact UTF-8 bytes and performs a bounded streaming JSON/JCS lexical and structural pass over the supplied bytes, stopping as soon as any depth, token, object-member, array-member, per-string, total-string, duplicate-key, scalar-validity, or byte limit fails. It uses checked integer arithmetic and never truncates, partially writes, repairs, normalizes, or parses an unbounded in-memory tree. Unknown counts, overflow, invalid UTF-8/JCS, or unavailable limit enforcement refuse before filesystem mutation.

Acceptance independently repeats the applicable complete budget check from the same safely reopened and rehashed candidate handle before schema parsing. The captured byte length must equal the writer receipt and the actual EOF. No parser, schema validator, compiler, reviewer, or recovery path may consume a candidate that failed, bypassed, or predates this bounded check; such a candidate must be re-authored under a new attempt rather than grandfathered.

## Trusted role/reviewer candidate creation

Roles and reviewers own candidate semantics but never perform an ambient filesystem open. The host exposes one deterministic trusted candidate writer; it is a byte sink, not a semantic Agent or a workflow router.

This is a host-enforced capability boundary, not prompt etiquette. Each Codex/Claude role or reviewer execution receives only the exact read-only, hash-bound input handles authorized by its pending action, canonical contracts/craft files explicitly selected for that role, and one opaque candidate-byte sink. It receives no ambient shell, general filesystem read or file-write, rename, delete, network, process-spawn, environment, credentials, or secret access; it cannot choose a sink path. The trusted recorder/writer remains outside the role execution and alone holds candidate creation capability. A host unable to enforce this least-privilege tool surface must refuse delegation before any model turn, rather than relying on the role to obey prose.

```ts
type CanonicalCandidateBytes = Uint8Array & {readonly __canonicalCandidateBytes: unique symbol};
type TrustedCandidateWriteRequest = {
  actionId: ActionId;
  decisionEventHash: Sha256;
  acceptanceRouteId: ArtifactRouteId;
  ledgerDerivedCandidatePath: RepositoryArtifactPath;
  bytes: CanonicalCandidateBytes;
};
type CandidateWriteReceipt = {
  actionId: ActionId;
  acceptanceRouteId: ArtifactRouteId;
  candidatePath: RepositoryArtifactPath;
  candidateByteHash: Sha256;
  candidateByteLength: number;
  writer: "trusted-host-candidate-writer@1";
};
```

The role supplies only its canonical candidate bytes for the current pending action; it never supplies or directly opens a path. The recorder derives the exact candidate/review path from the pending route, project/request-or-revision/review attempt IDs, expected filename, and prompt binding, then constructs `TrustedCandidateWriteRequest`. A caller/model path, alternate basename, directory, mutable alias, or candidate from another action is invalid.

The trusted writer opens the verified repository root as an anchored directory descriptor, walks/creates only the Ledger-derived candidate path with component-relative no-follow operations, and creates the final file exactly once using `O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW` and mode `0600`. Immediate and post-write `fstat` must prove the same regular file with link count one; it writes/hashes the complete bytes through that handle, performs file `fsync` followed by parent-directory `fsync`, closes, and reopens through the same anchored no-follow chain before returning `CandidateWriteReceipt`. Any pre-existing file/directory, symlink, hard link, case-fold collision, changed ancestor/inode, short write, flush failure, byte/hash/length mismatch, or path outside the exact allocation refuses and returns no receipt. Candidate/review paths are never idempotently reused.

A role/reviewer may return `RoleResult@1.status="written"` only after receiving the matching receipt; its `ArtifactCandidate.artifactPath` must equal `candidatePath`. The Ledger's atomic candidate capture reloads that exact file and requires the same byte hash/length. If the trusted writer is unavailable or refuses, the role returns `blocked` and cannot claim that bytes were written. This protocol applies equally to request candidates, rebuild candidates, capability-gap candidates, and creative/motion review attempts.

## Untrusted media decode and render isolation

Every future interface that parses, probes, decodes, rasterizes, demuxes, shapes, or extracts from an untrusted document, PDF, JSON-with-external-features, raster image, font, audio file, video file, subtitle, preview, evidence member, silent master, or mixed master must use this closed sandbox. Validation by magic bytes does not make compressed bytes trusted.

```ts
type MediaDecodeSandbox = {
  profile: "media-decode-sandbox@1";
  maxCpuMillisecondsPerInput: 15000;
  maxWallMillisecondsPerInput: 30000;
  maxResidentBytes: 536870912;
  maxDecodedOutputBytesPerInput: 536870912;
  maxOpenFileDescriptors: 16;
  maxChildProcesses: 0;
  maxWritableFilesystemBytes: 0;
};

type MotionRenderSandbox = {
  profile: "motion-render-sandbox@1";
  maxCpuMillisecondsPerInvocation: 900000;
  maxWallMillisecondsPerInvocation: 1200000;
  maxResidentBytes: 4294967296;
  maxOutputBytesPerInvocation: 4294967296;
  maxOpenFileDescriptors: 256;
  maxFixedRendererProcesses: 16;
  maxWritableFilesystemBytesOutsidePreopenedOutputs: 0;
};
```

`MediaDecodeSandbox` receives only an already-open, no-followed, regular, single-link input descriptor whose bytes were rehashed from that same handle against the accepted identity. It has no network namespace, inherited environment or credentials, ambient host filesystem, writable temporary storage, dynamically loaded decoder/plugin path, or child-process creation. Its only output is bounded typed metadata, normalized text records, decoded pixels/frames/audio samples, or a typed refusal through a pre-opened channel. The applicable source/manual-audio resource envelope may reduce these ceilings but never widen them. CPU, wall time, resident memory, decoded output, descriptor count, and arithmetic are metered; missing sandbox support, unavailable metering, overflow, unsupported external-reference feature, decoder crash, or any exceeded bound refuses before authoritative output or staging.

Researcher media inspection is performed by this host boundary: the role receives only the bounded typed output and never a decoder, shell, source locator, or general file handle. The same rule applies symmetrically to local ingress inspection, font shaping, PDF/image/audio/video metadata, sampled-evidence creation, Technical QC, reviewer playback/evidence parsing, final-equivalence probing, manual-audio ingress, alignment, mux picture/audio probes, and delivery verification.

Preview and final rendering additionally run inside `MotionRenderSandbox`. The sandbox receives only the exact hash-verified accepted asset descriptors, resolved IR/RenderPlan, read-only engine and authorized capability files, and pre-opened exact output destinations. It receives no network, inherited environment or credentials, arbitrary host filesystem, caller-selected output path, or writable location outside those destinations. All asset decoders inside it still obey `MediaDecodeSandbox`; fixed renderer subprocesses may not outlive the invocation or exceed the declared count. Preview/final/evidence output sizes and resource use are metered. A host unable to enforce every isolation and limit property must refuse the render. This prevents staged original compressed image/font bytes from escaping validation by being reparsed later in an ambient browser.

## Closed artifact and parent types

```ts
type AcceptedArtifactKind =
  | "local-asset-manifest"
  | "research-findings"
  | "brief"
  | "treatment"
  | "motion-spec"
  | "capability-gap"
  | "semantic-patch"
  | "creative-review"
  | "motion-review"
  | "audio-brief"
  | "capability-implementation-receipt"
  | "project-policy";

type Parent<N extends string, H extends string | null = string> = {
  name: N;
  contentHash: H;
};

type ArtifactParentSet =
  | {artifactKind: "local-asset-manifest"; expectedParentBindings: [Parent<"previousLocalAssetManifestHash", string | null>]}
  | {artifactKind: "research-findings"; expectedParentBindings: [Parent<"localAssetManifestHash">]}
  | {artifactKind: "brief"; expectedParentBindings: [Parent<"researchFindingsHash", string | null>, Parent<"localAssetManifestHash", string | null>]}
  | {artifactKind: "treatment"; expectedParentBindings: [Parent<"briefHash">, Parent<"researchFindingsHash", string | null>, Parent<"localAssetManifestHash", string | null>, Parent<"catalogRegistrySnapshotHash">]}
  | {artifactKind: "motion-spec"; expectedParentBindings: [Parent<"briefHash">, Parent<"treatmentHash">, Parent<"researchFindingsHash", string | null>, Parent<"localAssetManifestHash", string | null>, Parent<"capabilityRegistrySnapshotHash">, Parent<"capabilityReceiptSetHash">]}
  | {artifactKind: "capability-gap"; expectedParentBindings: [Parent<"briefHash">, Parent<"treatmentHash">, Parent<"localAssetManifestHash", string | null>, Parent<"capabilityRegistrySnapshotHash">, Parent<"capabilityReceiptSetHash">]}
  | {artifactKind: "semantic-patch"; expectedParentBindings: [Parent<"revisionManifestHash">, Parent<"briefHash">, Parent<"treatmentHash">, Parent<"motionSpecHash">, Parent<"lockSetHash">, Parent<"stagedLocalAssetManifestHash", string | null>, Parent<"stagedResearchFindingsHash", string | null>]}
  | {artifactKind: "creative-review"; expectedParentBindings: [Parent<"revisionManifestHash">, Parent<"motionSpecHash">, Parent<"renderPlanHash">, Parent<"previewHash">, Parent<"sampledEvidenceManifestHash">, Parent<"technicalQcHash">]}
  | {artifactKind: "motion-review"; expectedParentBindings: [Parent<"revisionManifestHash">, Parent<"motionSpecHash">, Parent<"renderPlanHash">, Parent<"previewHash">, Parent<"sampledEvidenceManifestHash">, Parent<"technicalQcHash">]}
  | {artifactKind: "audio-brief"; expectedParentBindings: [Parent<"previewApprovalHash">, Parent<"renderManifestHash">, Parent<"silentMasterHash">, Parent<"technicalQcHash">, Parent<"creativeReviewHash">, Parent<"motionReviewHash">]}
  | {artifactKind: "capability-implementation-receipt"; expectedParentBindings: [Parent<"gapContentHash">, Parent<"routeDecisionHash">, Parent<"advisoryResultReceiptHash">, Parent<"implementationAuthorizationHash">]}
  | {artifactKind: "project-policy"; expectedParentBindings: [Parent<"previousProjectPolicyHash", string | null>]};
```

Every `expectedParentBindings` member is an **exact ordered tuple**, not an open record or set. Names, tuple length, order, nullability, and artifact kind are fixed by the selected union variant. ResearchFindings always has a non-null accepted LocalAssetManifest parent; if no accepted staged manifest exists, no ResearchFindings candidate is valid. Brief/Treatment/Motion may use the explicitly permitted null asset/research parents only under their central contracts.

`capabilityReceiptSetHash` is SHA-256 of the JCS array of unique implementation-receipt hashes sorted ascending; the empty array still has a real deterministic hash. It is never `null`.

## Candidate, continuation, and acceptance

```ts
type DeterministicArtifactProducerId =
  | "local-source-ingress"
  | "project-local-capability-implementation-and-registration"
  | "user";

type ArtifactCandidateBase = {
  schemaVersion: "artifact-candidate@1";
  artifactPath: string;
  projectId: string;
  revisionId: string | null;
};

type ArtifactRouteRule =
  | {acceptanceRouteId: "initial-local-assets"; artifactKind: "local-asset-manifest"; semanticProducer: "local-source-ingress"; expectedSchemaVersion: "local-asset-manifest@1"}
  | {acceptanceRouteId: "source-update-local-assets"; artifactKind: "local-asset-manifest"; semanticProducer: "local-source-ingress"; expectedSchemaVersion: "local-asset-manifest@1"}
  | {acceptanceRouteId: "initial-research"; artifactKind: "research-findings"; semanticProducer: "researcher"; expectedSchemaVersion: "research-findings@1"}
  | {acceptanceRouteId: "source-update-research"; artifactKind: "research-findings"; semanticProducer: "researcher"; expectedSchemaVersion: "research-findings@1"}
  | {acceptanceRouteId: "initial-brief"; artifactKind: "brief"; semanticProducer: "brief-planner"; expectedSchemaVersion: "brief@1"}
  | {acceptanceRouteId: "rebuild-brief"; artifactKind: "brief"; semanticProducer: "brief-planner"; expectedSchemaVersion: "brief@1"}
  | {acceptanceRouteId: "initial-treatment"; artifactKind: "treatment"; semanticProducer: "creative-direction"; expectedSchemaVersion: "treatment@1"}
  | {acceptanceRouteId: "rebuild-treatment"; artifactKind: "treatment"; semanticProducer: "creative-direction"; expectedSchemaVersion: "treatment@1"}
  | {acceptanceRouteId: "initial-motion-spec"; artifactKind: "motion-spec"; semanticProducer: "motion-planner"; expectedSchemaVersion: "motion-spec@1"}
  | {acceptanceRouteId: "rebuild-motion-spec"; artifactKind: "motion-spec"; semanticProducer: "motion-planner"; expectedSchemaVersion: "motion-spec@1"}
  | {acceptanceRouteId: "initial-capability-gap"; artifactKind: "capability-gap"; semanticProducer: "motion-planner"; expectedSchemaVersion: "capability-gap@1"}
  | {acceptanceRouteId: "rebuild-capability-gap"; artifactKind: "capability-gap"; semanticProducer: "motion-planner"; expectedSchemaVersion: "capability-gap@1"}
  | {acceptanceRouteId: "bounded-patch"; artifactKind: "semantic-patch"; semanticProducer: "revision-interpreter"; expectedSchemaVersion: "semantic-patch@1"}
  | {acceptanceRouteId: "rebuild-patch"; artifactKind: "semantic-patch"; semanticProducer: "revision-interpreter"; expectedSchemaVersion: "semantic-patch@1"}
  | {acceptanceRouteId: "creative-review"; artifactKind: "creative-review"; semanticProducer: "creative-reviewer"; expectedSchemaVersion: "creative-review@1"}
  | {acceptanceRouteId: "motion-review"; artifactKind: "motion-review"; semanticProducer: "motion-reviewer"; expectedSchemaVersion: "motion-review@1"}
  | {acceptanceRouteId: "audio-brief"; artifactKind: "audio-brief"; semanticProducer: "sound-designer"; expectedSchemaVersion: "audio-brief@1"}
  | {acceptanceRouteId: "initial-capability-receipt"; artifactKind: "capability-implementation-receipt"; semanticProducer: "project-local-capability-implementation-and-registration"; expectedSchemaVersion: "capability-implementation-receipt@1"}
  | {acceptanceRouteId: "rebuild-capability-receipt"; artifactKind: "capability-implementation-receipt"; semanticProducer: "project-local-capability-implementation-and-registration"; expectedSchemaVersion: "capability-implementation-receipt@1"}
  | {acceptanceRouteId: "project-policy"; artifactKind: "project-policy"; semanticProducer: "user"; expectedSchemaVersion: "project-policy@1"};

type ArtifactRouteId = ArtifactRouteRule["acceptanceRouteId"];
type ArtifactRouteRuleFor<R extends ArtifactRouteId> = Extract<ArtifactRouteRule, {acceptanceRouteId: R}>;

type ArtifactCandidateForRoute<R extends ArtifactRouteId> =
  ArtifactCandidateBase &
  Extract<ArtifactParentSet, {artifactKind: ArtifactRouteRuleFor<R>["artifactKind"]}> & {
    semanticProducer: ArtifactRouteRuleFor<R>["semanticProducer"];
    expectedSchemaVersion: ArtifactRouteRuleFor<R>["expectedSchemaVersion"];
    acceptanceContext: Extract<AcceptanceContext, {acceptanceRouteId: R}>;
  };

type ArtifactCandidate = {
  [R in ArtifactRouteId]: ArtifactCandidateForRoute<R>
}[ArtifactRouteId];

type ArtifactAcceptanceBase = {
  schemaVersion: "artifact-acceptance@1";
  artifactPath: string;
  projectId: string;
  revisionId: string | null;
  candidateByteHash: string;
  contentHash: string;
  byteLength: number;
  producerDecisionHash: string | null;
  producerPromptPath: string | null;
  producerPromptHash: string | null;
  contractVersion: "artifact-acceptance@1";
};

type ArtifactAcceptanceForRoute<R extends ArtifactRouteId> =
  ArtifactAcceptanceBase & {
    artifactKind: ArtifactRouteRuleFor<R>["artifactKind"];
    semanticProducer: ArtifactRouteRuleFor<R>["semanticProducer"];
    expectedSchemaVersion: ArtifactRouteRuleFor<R>["expectedSchemaVersion"];
    acceptanceContext: Extract<AcceptanceContext, {acceptanceRouteId: R}>;
    observedParentBindings: Extract<ArtifactParentSet, {artifactKind: ArtifactRouteRuleFor<R>["artifactKind"]}>["expectedParentBindings"];
  };

type ArtifactAcceptance = {
  [R in ArtifactRouteId]: ArtifactAcceptanceForRoute<R>
}[ArtifactRouteId];
```

The route-mapped discriminated unions make route, `artifactKind`, semantic producer, schema, context, and ordered parent tuple one inseparable type-level choice. They distribute by `acceptanceRouteId` itself—not merely by the nested artifact kind—so initial/update/rebuild variants remain constructible and cannot cross. `ArtifactAcceptance.contentHash === candidateByteHash`, and its length equals the Ledger capture. For role/reviewer output, acceptance obtains `producerPromptPath` and `producerPromptHash` from the exact recorded delegation decision made **before the role ran**, verifies the current registered prompt still matches or preserves the historical exact bytes, and binds `producerDecisionHash`. It never computes provenance from an unrelated later prompt version. Deterministic/user producers have null prompt fields and their exact closed producer ID.

The successful acceptance result itself performs the one `acceptanceContext.successState` continuation in `workflow-decision.md`. There is no producer-free acceptance advance and no alternate interface call from `ARTIFACT_ACCEPTANCE`.

## Closed owner, schema, path, and route matrix

| Route ID | Kind / schema | Sole semantic producer | Unique immutable path form | Success state |
|---|---|---|---|---|
| `initial-local-assets` | local manifest / `local-asset-manifest@1` | local source ingress | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/assets.manifest.json` | `FACT_CHECK` |
| `source-update-local-assets` | same | local source ingress | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/assets.manifest.json` | `REVISION_SOURCE_UPDATE` |
| `initial-research` | research / `research-findings@1` | Researcher | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/research.findings.json` | `FACT_CHECK` |
| `source-update-research` | same | Researcher | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/research.findings.json` | `REVISION_SOURCE_UPDATE` |
| `initial-brief` | brief / `brief@1` | Brief Planner | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/brief.spec.json` | `TREATMENT` |
| `initial-treatment` | treatment / `treatment@1` | Creative Direction | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/treatment.json` | `MOTION_SPEC` |
| `initial-motion-spec` | motion / `motion-spec@1` | Motion Planner | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/motion.spec.json` | `VALIDATE` |
| `initial-capability-gap` | gap / `capability-gap@1` | Motion Planner | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/capability-gap.json` | `CAPABILITY_GAP` |
| `rebuild-capability-gap` | gap / `capability-gap@1` | Motion Planner | `projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/capability-gap.json` | `CAPABILITY_GAP` |
| `bounded-patch` | patch / `semantic-patch@1` | Revision Interpreter | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/revision.patch.json` | `APPLY_SEMANTIC_REVISION` |
| `rebuild-patch` | patch / same | Revision Interpreter | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/revision.patch.json` | `REBUILD_AUTHORING` |
| `rebuild-brief` | brief / `brief@1` | Brief Planner | `projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/brief.spec.json` | `REBUILD_AUTHORING` |
| `rebuild-treatment` | treatment / `treatment@1` | Creative Direction | `projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/treatment.json` | `REBUILD_AUTHORING` |
| `rebuild-motion-spec` | motion / `motion-spec@1` | Motion Planner | `projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/motion.spec.json` | `VALIDATE` |
| `creative-review` | review / `creative-review@1` | Creative Reviewer | `out/<project-id>/<revision-id>/<render-plan-hash>/reviews/creative/<review-attempt-id>/review.json` | review aggregation |
| `motion-review` | review / `motion-review@1` | Motion Reviewer | `out/<project-id>/<revision-id>/<render-plan-hash>/reviews/motion/<review-attempt-id>/review.json` | review aggregation |
| `audio-brief` | audio brief / `audio-brief@1` | Sound Designer | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/audio-brief.json` | `AUDIO_PROMPT` |
| `initial-capability-receipt` | receipt / `capability-implementation-receipt@1` | future local implementation interface | `projects/<project-id>/capabilities/<capability-id>/<capability-version>/receipts/<implementation-authorization-hash>/implementation-receipt.json` | `MOTION_SPEC` |
| `rebuild-capability-receipt` | receipt / same | future local implementation interface | same authorization-addressed immutable receipt path | `REBUILD_AUTHORING` |
| `project-policy` | policy / `project-policy@1` | User through mechanical project-policy ingress | `projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/project.policy.json` | `PREVIEW_GATE` |

The table is exhaustive. A route, producer, schema, path, parent tuple, or success-state mismatch is refused.

For a CapabilityGap, canonical payload `originPlanningContext.kind` must equal its route prefix: `initial-capability-gap` accepts only `initial`, and `rebuild-capability-gap` accepts only `rebuild` with the exact active `revisionAttemptId`. The same rule applies to implementation receipts: only the matching initial/rebuild receipt route is constructible, and its success state is fixed by that context. Acceptance never rewrites or defaults the context.

## Project policy ingress

At an exact `PREVIEW_GATE` pause, a human may submit `ProjectPolicyIngressRequest`. The future deterministic `project-policy-ingress` interface verifies the attributed request, exact project/pause, current `previousProjectPolicyHash`, canonical host-ID ordering and uniqueness, and then projects only the closed `ProjectPolicy` fields to a new immutable request/attempt candidate. It cannot infer opt-in or add a host. The candidate's `semanticProducer` is `"user"`, its context is exactly `project-policy`, and its sole parent is the checkpoint's current accepted policy hash or `null`.

The user-owned `_template` example and any mutable convenience copy are never canonical policy. Only acceptance of the immutable candidate updates the Ledger's current policy identity and returns to the same Preview Gate. A changed request creates a new candidate attempt; neither candidate nor prior accepted policy bytes are overwritten.

## Safe local source ingress and use rights

`local-source-ingress` accepts only exact top-level file locators directly supplied in the current invocation/answer. Locator path values are ephemeral and never persisted. The recorded operator request contains declarations keyed by recorder-allocated safe IDs plus a hash of the ephemeral locator set. The interface refuses a missing, reordered, added, or changed locator instead of weakening that binding. It resolves no URL and performs no directory recursion, glob, environment/tilde expansion, command substitution, discovered-link follow, or network fetch. It performs `lstat`, refuses every symlink and non-regular file, opens the selected file with `O_NOFOLLOW` (or an equivalent no-follow primitive), verifies regular-file identity on the opened handle, and copies plus hashes bytes from that same opened file handle.

The destination is exactly `projects/<project-id>/sources/<source-id>/<content-hash>/source.<verified-format-extension>`; no original basename byte is reused. The extension comes only from successful same-handle magic-byte/decoder validation against the closed format map below, never from the locator or declared MIME type. The interface follows the anchored destination-write protocol below and writes one immutable full-manifest candidate. An update binds the prior accepted manifest identity and never overwrites a staged path or candidate.

```ts
type AssetUse =
  | "research-reference"
  | "brand-reference"
  | "render-image"
  | "render-font"
  | "render-data";

type LocalAssetKind = "image" | "audio" | "font" | "data" | "brand" | "reference" | "other";
type VisualGenerationDeclaration = "declared-non-ai" | "declared-ai-generated" | "unknown" | "not-applicable";
type SafeLocatorId = string & {readonly __safeLocatorId: unique symbol};
type SafeSourceId = string & {readonly __safeSourceId: unique symbol};
type SafeAssetId = string & {readonly __safeAssetId: unique symbol};
type VerifiedFormatExtension =
  | "png" | "jpg" | "webp" | "avif"
  | "woff2" | "otf" | "ttf"
  | "json" | "csv" | "tsv" | "txt" | "md" | "pdf"
  | "wav" | "mp3" | "m4a" | "ogg" | "flac"
  | "mp4" | "mov" | "webm";

type LocalIngressBudget = {
  maxFilesPerRequest: 32;
  maxTotalEncodedBytes: 536870912;
  maxSingleEncodedBytes: 268435456;
  maxCumulativeDecodedBytes: 2147483648;
  maxRasterEncodedBytes: 33554432;
  maxRasterDecodedBytes: 134217728;
  maxRasterDimension: 8192;
  maxRasterPixels: 33554432;
  maxRasterFrames: 1;
  maxFontEncodedBytes: 33554432;
  maxFontDecodedTableBytes: 134217728;
  maxFontTables: 256;
  maxFontGlyphs: 65535;
  maxStructuredTextBytes: 16777216;
  maxStructuredDepth: 64;
  maxStructuredRecords: 1000000;
  maxDocumentPages: 1000;
  maxDocumentObjects: 1000000;
  maxDocumentEmbeddedFiles: 0;
  maxDocumentScriptsOrActions: 0;
  maxReferenceDurationSeconds: 300;
  maxReferenceAudioChannels: 8;
  maxReferenceSampleRateHz: 192000;
  maxReferenceVideoDimension: 4096;
  maxReferenceVideoFps: 60;
  maxReferenceVideoFrames: 18000;
};

type RightsEvidence =
  | {kind: "user-declaration"; sourceEventHash: string; tokenizedStatement: DurableInstructionText}
  | {kind: "staged-license-file"; assetId: SafeAssetId; contentHash: string};

type DeclaredRightsEvidence =
  | {kind: "user-declaration"; tokenizedStatement: DurableInstructionText}
  | {kind: "declared-license-asset"; licenseAssetId: SafeAssetId}
  | null;

type LocalSourceDeclaration = {
  locatorId: SafeLocatorId;
  sourceId: SafeSourceId;
  assetId: SafeAssetId;
  kind: LocalAssetKind;
  visualGeneration: VisualGenerationDeclaration;
  requestedUses: [AssetUse, ...AssetUse[]];
  rights: {
    status: "owned" | "licensed" | "permission-confirmed" | "unclear" | "prohibited";
    holder: DurableLocatorSafeText | null;
    evidence: DeclaredRightsEvidence;
    allowedUses: AssetUse[];
    attribution: DurableLocatorSafeText | null;
    useLimits: DurableLocatorSafeText[];
  };
};

type EphemeralLocalSourceLocatorSet = {
  locatorSetHash: string;
  locators: [{locatorId: SafeLocatorId; localLocator: string}, ...Array<{locatorId: SafeLocatorId; localLocator: string}>];
};

type LocalAssetEntry = {
  assetId: SafeAssetId;
  sourceId: SafeSourceId;
  stagedPath: RepositoryArtifactPath;
  contentHash: string;
  verifiedFormatExtension: VerifiedFormatExtension;
  kind: LocalAssetKind;
  visualGeneration: VisualGenerationDeclaration;
  rightsStatus: "owned" | "licensed" | "permission-confirmed" | "unclear" | "prohibited";
  rightsHolder: DurableLocatorSafeText | null;
  rightsEvidence: RightsEvidence | null;
  allowedUses: AssetUse[];
  requestedUses: AssetUse[];
  attribution: DurableLocatorSafeText | null;
  useLimits: DurableLocatorSafeText[];
  useStatus: "eligible" | "excluded";
};

type LocalAssetManifest = {
  schemaVersion: "local-asset-manifest@1";
  projectId: string;
  assets: LocalAssetEntry[];
};
```

`SafeLocatorId`, `SafeSourceId`, and `SafeAssetId` share one exact segment grammar: 1–64 lowercase ASCII alphanumeric, dot, underscore, or hyphen characters, beginning and ending alphanumeric. Slash, backslash, colon, whitespace, controls, percent encoding, and dot/dot-dot segments are impossible. The adapter/recorder allocates `locator-0001`, `source-0001`, and `asset-0001` ordinals from the verified project Ledger in canonical locator order; caller/model-provided IDs never select a destination component. IDs are globally unique within their project type and never reused. `locators` and declarations are in ascending `locatorId` order with no duplicates. `locatorSetHash` is SHA-256 of the RFC 8785/JCS bytes of the exact projection `{locators}` in that order; the hash field itself is omitted from the hash preimage. Reordering, replacing, adding, omitting, or duplicating either an ID or locator changes or invalidates the binding. The declaration list has the same ID set and canonical order.

The adapter records `LocalSourceIngressRequest` first. Its declaration order and the ephemeral locator-set hash are part of the interface input binding, but each `localLocator` value is never persisted in a candidate, manifest, Ledger event, diagnostic, or receipt. The exact `operator-input-recorded` event supplies manifest `sourceEventHash` and preserves the identical non-empty `tokenizedStatement: DurableInstructionText` after the locator-tokenization rule in `workflow-ledger.md`: on success, a `user-declaration` becomes `RightsEvidence.kind="user-declaration"` with those values. A raw rights statement or surviving locator byte is invalid. A `declared-license-asset` resolves to one staged asset from the same request and becomes `staged-license-file` with that asset's accepted ID and staged-byte hash. Null evidence is legal only for an excluded `unclear` or `prohibited` entry.

IDs/paths are unique. `requestedUses` and `allowedUses` are unique canonical-order arrays. Every requested use must occur in allowed uses for an eligible entry. `eligible` additionally requires adequate rights evidence; `unclear`/`prohibited` are always excluded. `visualGeneration` is copied unchanged from the attributed human declaration: image/brand sources use `declared-non-ai`, `declared-ai-generated`, or `unknown`; non-visual kinds use `not-applicable`. The system never infers provenance from pixels or filenames. A `render-image` entry is eligible only with `declared-non-ai`; `declared-ai-generated` and `unknown` may remain research references but cannot become visual substrate.

Format selection is closed. The interface applies the literal `LocalIngressBudget` above to the complete request and to decoder-reported content before any destination directory or file is created. It refuses the complete request if its count or encoded total exceeds the request ceiling, and refuses an individual source when it exceeds any applicable encoded, decoded, dimension, pixel, table, glyph, record, page, object, duration, rate, channel, FPS, or frame ceiling. Decoder work is charged against `maxCumulativeDecodedBytes`; partial decoding, streaming, metadata understatement, compression ratio, and early abort never exempt a byte. Integer overflow, unknown decoded size, ambiguous format, animation where a static raster is required, or a decoder that cannot enforce a ceiling is refusal. Failed bytes are not staged.

Credential screening also occurs on the opened source handle after format recognition but before any destination creation. The interface refuses executable environment configuration (`.env`-class key/value material), private-key PEM or equivalent key containers, cloud/service credential documents, password/token dumps, keystores, browser credential exports, and any recognized configuration whose purpose is to supply credentials. Raw bytes and safely decoded text/container metadata are checked; PDF embedded files, scripts, actions, launch instructions, and external references are already forbidden by the zero limits above. A refusal emits only a locator-safe diagnostic code and a safe diagnostic summary; it never copies, stages, excerpts, hashes into a user-visible record, or passes the suspected secret bytes to a role. There is no opaque `bin` fallback and no human opt-in route for credential classes in Part 1.

`render-image` permits only successfully decoded static `png`, `jpg`, `webp`, or `avif`; SVG/XML, animated image payloads, HTML, PDF, scripts, CSS, `data:` content, nested resources, and decoder-reported external references are never render substrate. `render-font` permits only validated `woff2`, `otf`, or `ttf`. `render-data` permits UTF-8 `json`, `csv`, or `tsv` within the exact structured-data ceilings. UTF-8 `txt`/`md`, inert `pdf`, audio, and `mp4`/`mov`/`webm` video are research/reference-only and cannot become visual render substrate. Browser/renderer network access remains disabled. Vector motion geometry comes only from the closed numeric MotionSpec path registry, not user SVG.

Kind/use compatibility is closed:

- `render-image`: `image` or `brand`
- `render-font`: `font`
- `render-data`: `data`
- `brand-reference`: `brand`, `image`, `font`, `data`, or `reference`
- `research-reference`: any declared kind

`reference` and `other` can never be render substrate. An `audio` kind has only `research-reference` compatibility in this visual-source contract; it cannot appear in MotionSpec node assets or become visual render substrate. A ResearchSource requires eligible `research-reference`. A MotionSpec asset reference requires the matching eligible visual `render-*` use; research/reference eligibility alone never permits rendering. Post-lock music enters only through the separate `ManualAudioIngressRequest` / `ManualAudioReturn@1` workflow outside MotionSpec and outside this visual node-asset path. Pure-code 2D scope still forbids footage/AI-generated video substrate regardless of a rights declaration.

## Anchored destination writes and later reads

Every future interface that creates a repository file, plus the trusted host candidate writer above, uses one destination protocol. It opens the already verified repository/project root as an anchored directory handle; walks each normalized relative component with directory-relative no-follow operations; rejects symlinks, hard-linked non-directory targets, mount/path escapes, case-fold aliases, or directory identity changes; and creates each new directory/file through that anchored handle. A new file uses the platform equivalent of `openat` with `O_CREAT | O_EXCL | O_NOFOLLOW`, is written and hashed through that one returned handle, has regular-file identity and link count one, and becomes visible only at its exact final name. A pre-existing content-addressed file is reusable only when opened no-follow through the same anchored chain, is regular with link count one, and hashes byte-for-byte to the expected identity; different bytes refuse. A path-string preflight followed by an unanchored open is invalid.

Every later consumer follows the symmetric read rule: reopen the accepted normalized repository-relative path through an anchored root handle, no-follow every component, require a regular single-link file, hash the exact opened handle against the accepted content hash, and parse/render only those same verified bytes. A swapped symlink, hard link, inode, or hash refuses before parsing. This applies to Researcher, validators, renderers, review evidence, manual-audio alignment, delivery, and capability evidence—not only initial ingress.

## Review identity and retry

Creative/Motion Review JSON does not contain its own top-level content hash or reviewer-supplied prompt hash. Acceptance supplies both externally. Each delegation uses a Ledger-allocated `review-attempt-000n` and writes:

`out/<project-id>/<revision-id>/<render-plan-hash>/reviews/<review-kind>/<review-attempt-id>/review.json`

An incomplete or refused review is never overwritten. After missing evidence is repaired, the reviewer writes a **new immutable attempt**. The Ledger selects the one current accepted attempt for each review kind; Preview Approval binds those exact accepted hashes.

## Capability implementation authorization and receipt

Capability Builder is advisory-only. A `future-project-local-proposal` route decision authorizes no writes. A human must separately submit the exact `CapabilityImplementationAuthorization` in `workflow-ledger.md`, binding gap, route, recovery-stable advisory result receipt, a finite path/purpose manifest, actor, and reason. The external authorization hash is recorded before any implementation action.

```ts
type AuthorizedEvidenceFile = {
  projectId: string;
  capabilityId: string;
  capabilityVersion: string;
  relativePath: string;
  path: string;
  purpose: "source" | "intent-schema" | "resolved-schema" | "fixture" | "test" | "performance-check" | "registration-record" | "registry-snapshot";
  contentHash: string;
};

type NonRegistryEvidencePurpose = Exclude<AuthorizedEvidenceFile["purpose"], "registry-snapshot">;
type CapabilityImplementationBindingManifestEntry =
  | (AuthorizedEvidenceFile & {purpose: NonRegistryEvidencePurpose})
  | (Omit<AuthorizedEvidenceFile, "contentHash" | "purpose"> & {purpose: "registry-snapshot"; contentHash: null});

type CapabilityImplementationBindingProjection = {
  schemaVersion: "capability-implementation-binding@1";
  projectId: string;
  capabilityId: string;
  capabilityVersion: string;
  originPlanningContext: OriginPlanningContext;
  gapContentHash: string;
  routeDecisionHash: string;
  advisoryResultReceiptHash: string;
  implementationAuthorizationHash: string;
  intentSchemaId: string;
  resolvedSchemaId: string;
  evidenceManifest: [CapabilityImplementationBindingManifestEntry, ...CapabilityImplementationBindingManifestEntry[]];
};

type CapabilityImplementationReceipt = {
  schemaVersion: "capability-implementation-receipt@1";
  projectId: string;
  capabilityId: string;
  capabilityVersion: string;
  originPlanningContext: OriginPlanningContext;
  intentSchemaId: string;
  resolvedSchemaId: string;
  implementationBindingHash: string;
  receiptPath: string;
  gapPath: string;
  gapContentHash: string;
  routeDecisionHash: string;
  advisoryResultReceiptHash: string;
  implementationAuthorizationHash: string;
  exactFileManifest: [AuthorizedEvidenceFile, ...AuthorizedEvidenceFile[]];
  intentSchemaEvidence: {path: string; contentHash: string};
  resolvedSchemaEvidence: {path: string; contentHash: string};
  fixtureManifestEvidence: {path: string; contentHash: string};
  testReportEvidence: {path: string; contentHash: string};
  performanceReportEvidence: {path: string; contentHash: string};
  registrationReceiptEvidence: {path: string; contentHash: string};
  registrySnapshotEvidence: {path: string; contentHash: string};
  producer: {
    interfaceId: "project-local-capability-implementation-and-registration";
    interfaceVersion: "1.0.0";
  };
};
```

The accepted human authorization and receipt form one exact tuple. Receipt `projectId`, `capabilityId`, `capabilityVersion`, and `originPlanningContext` must exactly match the accepted gap, route decision, advisory, waiting pause, active Ledger gap, and authorization; every receipt manifest member repeats the same project/capability/version identity. Initial context is accepted only through `initial-capability-receipt`; rebuild context only through `rebuild-capability-receipt`. `intentSchemaId` and `resolvedSchemaId` are safe stable IDs, are distinct, match the advisory proposal, are named by the corresponding accepted schema evidence, and appear unchanged on that exact capability/version entry in `registrySnapshotEvidence`. They are identifiers, never paths or schema locators. After stripping only `contentHash` from each `AuthorizedEvidenceFile`, the receipt's complete ordered `exactFileManifest` must be byte-for-byte exactly equal to the authorization's complete ordered `exactFileManifest`: no omitted, added, reordered, repurposed, redirected, or substituted member is accepted. Every listed byte is reloaded and hashed, and each named evidence field must select the unique member with its required purpose. The source purpose has at least one member; every other required purpose has exactly one, as required by `workflow-ledger.md`.

`implementationBindingHash` breaks the registry-snapshot/receipt cycle. It is SHA-256 over the RFC 8785/JCS bytes of the exact `CapabilityImplementationBindingProjection`. That projection binds gap, route, advisory, authorization, project/capability/version, planning context, both schema IDs, and the complete ordered evidence manifest; every non-registry member carries its actual content hash, while the unique `registry-snapshot` member carries literal `contentHash:null`. The project registry snapshot contains this implementation binding hash, never the final receipt hash. The implementation interface then hashes the completed registry snapshot, writes that real hash into the receipt's ordinary `exactFileManifest` and `registrySnapshotEvidence`, and only afterward canonicalizes the final receipt. Acceptance reconstructs the null-registry projection from the receipt and authorization, recomputes exact equality with `implementationBindingHash`, verifies the snapshot contains that binding hash, and separately verifies the final snapshot and receipt hashes. No projection contains its own hash and neither artifact depends on the other's final content hash.

The common canonical implementation root is `projects/<project-id>/capabilities/<capability-id>/<capability-version>/`. Acceptance repeats all authorization checks: safe project-local ID/version, exact root plus relative path, purpose/extension mapping, exact forbidden components/basenames including the case-insensitive Windows reserved-device-basename rule from `workflow-decision.md`, static import-graph closure, uniqueness/order, and no glob, absolute path, traversal, case-fold collision, symlink, hard link, package resolution, or executable escape. Every implementation/evidence target must have been absent before the implementation action; no pre-existing target or overwrite is accepted. Every destination uses the anchored exclusive-create protocol above, not a preflight/path-open pair. The interface emits a receipt only after every authorized new file has been written, reloaded, and verified. An interrupted partial attempt has no receipt and cannot be silently overwritten or presented as success.

Submitting that authorization additionally permits exactly one protocol-derived audit-envelope path and no other inferred file:

`projects/<project-id>/capabilities/<capability-id>/<capability-version>/receipts/<implementation-authorization-hash>/implementation-receipt.json`

`receiptPath` must equal that exact path after substituting the receipt's `projectId`, `capabilityId`, `capabilityVersion`, and lowercase external `implementationAuthorizationHash`; the candidate `artifactPath` must equal `receiptPath`. The receipt path must not appear in `exactFileManifest`, because the authorization hash is computed before the receipt and the envelope cannot authorize or hash itself. The protocol-derived path still uses the same anchored directory-handle, no-follow, regular-file, link-count-one, and exclusive-create checks. Identical pre-existing bytes may be re-observed idempotently only through the anchored safe-read protocol; different bytes at the same derived path refuse. A different implementation authorization has a different hash and therefore a different receipt path.

The interface verifies schemas, fixtures, test/performance evidence, registration receipt, project-local namespace, and resulting registry snapshot. The exact accepted receipt hash and registry snapshot become MotionSpec capability bindings. A conversational claim, advisory, route decision, or unlisted implementation file cannot substitute.

## Refusal and immutability

Refuse on wrong owner, route, schema, path, candidate bytes, prompt binding, parent tuple, prior manifest, source use/right, asset ID, Ledger head, review evidence, rebuild order, implementation authorization/evidence, self-hash, unexpected key, or non-canonical serialization. Refusal grants no downstream authority and preserves the pending candidate for a safe retry or replacement attempt according to the Ledger. Once accepted, modifying bytes at that path makes the acceptance stale; a new semantic attempt uses a new immutable path.
