# Deterministic engine interface boundary

## Status

Every interface here is a **required interface — not implemented** in Part 1. This file defines preconditions, success evidence, refusal, and state ownership only. It provides no runtime, stub, CLI, dependency, fake receipt, render, or Remotion code. A missing interface is never treated as success.

Every interface that consumes untrusted media normatively inherits the exact central `MediaDecodeSandbox` in `agent/contracts/artifact-acceptance.md`; preview/evidence and silent-final rendering additionally inherit its `MotionRenderSandbox`. The interface cannot weaken either sandbox or substitute ambient process isolation.

## Exhaustive interface inventory

| Future deterministic interface | Required input | Success evidence / only success state | Refusal |
|---|---|---|---|
| Workflow ledger recorder | Exact Ledger path/head plus one closed event or matching action result | Immutable canonical action-result sidecar when applicable, then compare-and-append one hash-chained event; reconciliation results use the explicit direct-append exception; deterministic reducer verifies checkpoint | Stale head, wrong sequence/request, broken chain, sidecar collision, open payload, orphan/duplicate result, or invalid transition |
| Action result reconciliation | Exact running original/reconciliation action ID, input-binding hash, route, and any durable result/candidate | Applies the one matching recovered original result, proves retry-safe absence and restores that same original action for retry, or safely re-executes the identical reconciliation action after its own pre-append crash | Ambiguous side effect, changed action/input, duplicate result, unsafe replay, recursive reconciliation action, or unrelated output |
| Trusted candidate writer | Exact pending role/reviewer action, Ledger-derived allocation, prompt/route binding, and canonical candidate bytes through the opaque sink | Exclusive durable creation plus matching `CandidateWriteReceipt`; no workflow-state transition | Caller/model path, ambient role write capability, collision, unsafe ancestor/link, short write, receipt mismatch, or unenforceable least privilege |
| Local source ingress | Recorded `LocalSourceIngressRequest`, matching ephemeral locator set, rights/use/visual-generation declarations, project ID, and prior manifest-or-null | Exact content-addressed staged bytes plus immutable `LocalAssetManifest@1` candidate with origin-selected context; remains in initial/source-update producer state until acceptance | URL/network/directory/glob/variable/tilde/command/embedded expansion, locator/request mismatch, unreadable bytes, collision, unauthorized symlink, or rights/use/provenance failure |
| Project policy ingress | Exact recorded human `ProjectPolicyIngressRequest`, Preview Gate pause, and current policy identity-or-null | Immutable user-semantic `ProjectPolicy@1` candidate; remains at `PREVIEW_GATE` until acceptance | Wrong project/pause/prior policy, duplicate/unsorted host IDs, non-human actor, changed request, mutable target, or inferred opt-in |
| Artifact validation and hashing | Exact Ledger-captured `ArtifactCandidate` bytes/hash, AcceptanceContext, recorded producer decision/prompt binding, current parents | `ArtifactAcceptance@1`; reducer uses its one context-selected success state | Changed/non-JCS bytes, wrong route/owner/path/schema/prompt/parent, stale head, self-hash, use/right failure, rebuild order, review or receipt mismatch |
| Catalog/registry snapshot | Exact checked-in `catalog/core-registry.json` and the closed catalog-registry contract | Validated local core registry path plus external `registrySnapshotHash`; stays in the same Treatment/MotionSpec stage | Missing/changed/invalid resource, duplicate or unsorted IDs, remote/dynamic/executable entry, implementation claim, or unknown schema |
| Canonical source hashing and validation | Already accepted initial/current source set, or complete accepted rebuild candidates, locks, registry/receipts | Diagnostics plus exactly one disposition: initial → `SNAPSHOT`; rebuild candidates → `APPLY_SEMANTIC_REVISION`; committed current → `RESOLVE` | Missing acceptance, bad cross-parent, source/lock/scope/registry mismatch, remote path, invalid use/right, or continuity violation |
| Initial snapshot | Passing accepted initial source set with `currentRevisionId:null` | Immutable `rev-0001` manifest/locks and external identities → `VALIDATE` | Existing revision, invalid/unaccepted source, or second snapshot |
| Semantic revision apply | Current revision/locks and accepted bounded patch; or accepted rebuild directive, complete ordered owner acceptances, and passing staged validation | Atomic new revision manifest/locks, actual impact, preserved locks, invalidation set → `VALIDATE` | Stale source/lock, missing/out-of-order owner candidate, parent mismatch, direct-index target, lock evasion, undeclared/out-of-scope impact, invalid cause/repair binding |
| Project-local capability implementation and registration | Accepted gap/route/advisory plus separate attributed human authorization over a finite path/purpose manifest | Exact authorized project-local files, named schema/fixture/test/performance/registration evidence, registry snapshot, receipt candidate | Missing/mismatched authorization, undeclared/shared path, engine mutation, failed tests/budget, remote/generated media, or unregistered output |
| Resolver/compiler | Passing current committed revision, exact registry/receipt bindings, and safely hashable renderer closure | Content-addressed `RendererBuildManifest`, `ResolvedMotionIR`, and canonical RenderPlan with exact `rendererBuildHash`/`renderProfileHash` → `PREVIEW` | Null/stale revision, unknown capability, advisory-only capability, incomplete/unhashable build closure, fallback layout, nondeterminism, or invalid source |
| Preview/evidence renderer | Current RenderPlan, exact renderer-build/profile identities, and both closed evidence/QC profiles | Preview bytes/hash plus required sampled frames/scans, rendered-frame probe, and content-hashed evidence manifest → `TECHNICAL_QC` | Stale build/plan, incomplete profile/evidence, nondeterministic input, or collision |
| Technical QC | Exact `PreviewEvidenceTuple@1` | Complete hash-bound pass report → `CREATIVE_AND_MOTION_REVIEW` | Missing/mismatched preview/evidence, incomplete scan set, or blocking result |
| Approval recorder | Exact attributed decision/reason, policy binding, source/plan/preview/evidence, passing QC, and both accepted completed `ship` reviews | No-self-hash `PreviewApproval@1` plus external `previewApprovalHash` → `APPROVED` | Stale/incomplete/non-ship tuple, empty reason, unauthorized actor/host, policy mismatch, or replaced bytes |
| Silent final renderer | Current RenderPlan and exact Preview Approval tuple | Silent master bytes/hash plus Render Manifest bound to approval/build/profile and exact approved-preview RGBA sequence → `AUDIO_BRIEF` | Stale/missing approval dependency, changed evidence/policy/review/QC/build, frame-sequence mismatch, or output mismatch |
| Audio-prompt generator | Accepted current AudioBrief, locked-picture tuple, exact compiler/template identities | Immutable `MusicPromptAttempt@1` and complete provider-neutral instrumental `MUSIC_PROMPT.md` → `WAITING_FOR_MANUAL_MUSIC` | Stale picture, invalid cue/payoff, nondeterministic/over-limit bytes, missing binding, or collision |
| Manual-audio ingress | Exact attributed durable `ManualAudioIngressRequest`, separately supplied matching ephemeral locator envelope, rights, payoff/gain, and selected attempt | Staged local track bytes/hash and canonical `ManualAudioReturn@1` → `OPTIONAL_LOCAL_MUX` | Locator ID/envelope-hash mismatch, URL/directory/glob/embedded path, unreadable/unsupported bytes, rights gap, stale/cross-attempt binding, collision, invalid payoff/gain |
| Local alignment/mux | Matching silent master/manifest, prompt/AudioBrief, and exact-attempt ManualAudioReturn | Time-shifted local mix, alignment evidence, mux manifest, unchanged picture → `DELIVERY` | Attempt/prompt/source/payoff/gain mismatch, insufficient coverage, picture retime, stale input, or cross-attempt selection |
| Delivery packager | Current locked picture, actual AudioBrief/prompt attempt, and explicit no-track or current mux selection | Content-addressed DeliveryManifest/package → `COMPLETE` | Missing/stale prompt/AudioBrief, cross-lineage selection, unresolved blocker, or changed post-lock bytes |

This inventory and `agent/prompt-manifest.json.interfaces` are exhaustive and use identical IDs. The Ledger recorder and trusted candidate writer are orchestration infrastructure rather than `WorkflowDecision@1` targets: the recorder avoids recursive self-routing, while the writer is an opaque byte sink inside an already recorded role action and never changes state. Every other execution is preceded by one recorded decision and followed by one recorded result.

## Closed local-source resource envelope

```ts
type LocalSourceIngressResourceBudget = {
  maxLocatorCount: 64;
  maxEncodedBytesPerAsset: 268435456;
  maxEncodedBytesTotal: 1073741824;
  maxDecodedBytesPerAsset: 536870912;
  maxExpansionRatio: 100;
  maxRasterWidth: 16384;
  maxRasterHeight: 16384;
  maxRasterPixels: 134217728;
  maxArchiveEntries: 0;
};
```

`local-source-ingress` applies this exact budget before staging. It opens each separately supplied locator from its trusted ingress handle with no-follow semantics and requires a regular file with link count one. Reads are streaming and stop at the encoded per-asset and aggregate byte limits; a declared size is never trusted. Header parsing precedes decode, dimensions and pixel products use checked integer arithmetic, and decoding is terminated at the decoded-byte or 100:1 expansion limit. Archive/compressed-container expansion is forbidden because `maxArchiveEntries` is zero. Truncation, polyglot/recursive containers, decoder over-read, decompression bomb, dimension overflow, or a file changing device/inode/size during the read is refusal before any candidate or staged identity exists.

Magic/header parsing, decode, rasterization, font shaping, document/PDF extraction, demux, and media probe operations run only in the central `MediaDecodeSandbox`, against the already-open and same-handle-rehashed input. Its numeric limits and this source envelope are intersected by taking the stricter bound in every dimension; neither may be widened. Preview/evidence rendering and silent-final rendering run in `MotionRenderSandbox`, expose only exact accepted read handles/read-only engine plus pre-opened derived-output handles, and keep all internal asset parsers inside `MediaDecodeSandbox`. Evidence/QC/reviewer playback, final-equivalence, manual-audio, alignment/mux, and delivery probes inherit the same decode boundary. Inability to enforce isolation, metering, or an applicable ceiling is refusal.

## Closed interface result

```ts
type OutputBinding<N extends string> = {name: N; contentHash: string};

type InterfaceResultIdentityBase = {
  schemaVersion: "workflow-interface-result@1";
  actionId: ActionId;
  inputBindingHash: Sha256;
  resultReceiptHash: Sha256;
};

type InterfaceSuccessBase = InterfaceResultIdentityBase & {status: "succeeded"};

type AcceptanceRouteId = AcceptanceContext["acceptanceRouteId"];

type ArtifactAcceptanceSuccess = {
  [R in AcceptanceRouteId]: {
    interfaceId: "artifact-validation-and-hashing";
    acceptanceContext: Extract<AcceptanceContext, {acceptanceRouteId: R}>;
    acceptance: ArtifactAcceptanceForRoute<R>;
    outputBindings: [OutputBinding<"artifactAcceptanceHash">];
    continuationState: Extract<AcceptanceContext, {acceptanceRouteId: R}>["successState"];
  }
}[AcceptanceRouteId];

type LocalSourceIngressState = "INTAKE" | "REVISION_SOURCE_UPDATE";
type LocalSourceAcceptanceContextByState = {
  INTAKE: Extract<AcceptanceContext, {acceptanceRouteId: "initial-local-assets"}>;
  REVISION_SOURCE_UPDATE: Extract<AcceptanceContext, {acceptanceRouteId: "source-update-local-assets"}>;
};

type LocalSourceIngressSuccess = {
  [S in LocalSourceIngressState]: {
    interfaceId: "local-source-ingress";
    originState: S;
    artifactCandidate: Extract<ArtifactCandidate, {artifactKind: "local-asset-manifest"}> & {acceptanceContext: LocalSourceAcceptanceContextByState[S]};
    outputBindings: [OutputBinding<"localAssetManifestCandidateByteHash">];
    continuationState: S;
  }
}[LocalSourceIngressState];

type ProjectPolicyIngressSuccess = {
  interfaceId: "project-policy-ingress";
  artifactCandidate: Extract<ArtifactCandidate, {artifactKind: "project-policy"}> & {acceptanceContext: Extract<AcceptanceContext, {acceptanceRouteId: "project-policy"}>};
  outputBindings: [OutputBinding<"projectPolicyCandidateByteHash">];
  continuationState: "PREVIEW_GATE";
};

type CatalogRegistryState = "TREATMENT" | "MOTION_SPEC";
type CatalogRegistrySuccess = {
  [S in CatalogRegistryState]: {
    interfaceId: "catalog-registry-snapshot";
    originState: S;
    resourcePath: "catalog/core-registry.json";
    outputBindings: [OutputBinding<"registrySnapshotHash">];
    continuationState: S;
  }
}[CatalogRegistryState];

type ValidationDisposition = "initial-source-set" | "accepted-rebuild-candidates" | "committed-current-revision";

type ValidationInputParentTupleFor<D extends ValidationDisposition> =
  D extends "initial-source-set" ? [
    {name: "briefAcceptanceHash"; contentHash: Sha256},
    {name: "treatmentAcceptanceHash"; contentHash: Sha256},
    {name: "motionSpecAcceptanceHash"; contentHash: Sha256},
    {name: "localAssetManifestHash"; contentHash: Sha256 | null},
    {name: "researchFindingsHash"; contentHash: Sha256 | null},
    {name: "registrySnapshotHash"; contentHash: Sha256},
    {name: "capabilityReceiptSetHash"; contentHash: Sha256}
  ] : D extends "accepted-rebuild-candidates" ? [
    {name: "currentRevisionManifestHash"; contentHash: Sha256},
    {name: "currentLockSetHash"; contentHash: Sha256},
    {name: "semanticPatchAcceptanceHash"; contentHash: Sha256},
    {name: "orderedOwnerAcceptanceSetHash"; contentHash: Sha256},
    {name: "stagedLocalAssetManifestHash"; contentHash: Sha256 | null},
    {name: "stagedResearchFindingsHash"; contentHash: Sha256 | null}
  ] : [
    {name: "revisionManifestHash"; contentHash: Sha256},
    {name: "lockSetHash"; contentHash: Sha256},
    {name: "briefHash"; contentHash: Sha256},
    {name: "treatmentHash"; contentHash: Sha256},
    {name: "motionSpecHash"; contentHash: Sha256},
    {name: "registrySnapshotHash"; contentHash: Sha256},
    {name: "capabilityReceiptSetHash"; contentHash: Sha256}
  ];

type ValidatedSourceIdentity = {
  artifactKind: "local-asset-manifest" | "research-findings" | "brief" | "treatment" | "motion-spec" | "semantic-patch" | "revision-manifest" | "lock-set" | "capability-registry" | "capability-receipt-set";
  contentHash: Sha256;
  acceptanceHash: Sha256 | null;
};

type ValidationReceiptFor<D extends ValidationDisposition> = {
  schemaVersion: "validation-receipt@1";
  projectId: string;
  revisionId: D extends "initial-source-set" ? null : string;
  disposition: D;
  inputParentBindings: ValidationInputParentTupleFor<D>;
  validatedSourceIdentities: [ValidatedSourceIdentity, ...ValidatedSourceIdentity[]];
  decision: "pass";
  diagnostics: [];
};

type ValidationContinuationFor<D extends ValidationDisposition> =
  D extends "initial-source-set" ? "SNAPSHOT" :
  D extends "accepted-rebuild-candidates" ? "APPLY_SEMANTIC_REVISION" : "RESOLVE";

type ValidationSuccess = {
  [D in ValidationDisposition]: {
    interfaceId: "canonical-source-hashing-and-validation";
    validationDisposition: D;
    validationReceipt: ValidationReceiptFor<D>;
    outputBindings: [OutputBinding<"validationReceiptHash">];
    continuationState: ValidationContinuationFor<D>;
  }
}[ValidationDisposition];

type CapabilityImplementationSuccess =
  | {
      interfaceId: "project-local-capability-implementation-and-registration";
      originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>;
      artifactCandidate: ArtifactCandidateForRoute<"initial-capability-receipt">;
      implementationBindingHash: Sha256;
      outputBindings: [OutputBinding<"capabilityReceiptCandidateByteHash">, OutputBinding<"registrySnapshotHash">];
      continuationState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION";
    }
  | {
      interfaceId: "project-local-capability-implementation-and-registration";
      originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>;
      artifactCandidate: ArtifactCandidateForRoute<"rebuild-capability-receipt">;
      implementationBindingHash: Sha256;
      outputBindings: [OutputBinding<"capabilityReceiptCandidateByteHash">, OutputBinding<"registrySnapshotHash">];
      continuationState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION";
    };

type RecoveredResultBindingForAction<A extends PendingNormalAction> = {
  originalAction: A;
  resultKind: A["kind"] extends "role" ? "role-result" : "interface-result";
  resultReceiptHash: Sha256;
  resultEnvelopePath: string;
  resultEnvelopeHash: Sha256;
};

type RecoveredResultBindingFor<S extends NormalActionExecutionState> =
  PendingNormalActionForExecutionState<S> extends infer A
    ? A extends PendingNormalAction
      ? RecoveredResultBindingForAction<A>
      : never
    : never;

type MatchingResultReconciliationSuccess = {
  [S in NormalActionExecutionState]: {
    interfaceId: "action-result-reconciliation";
    originState: S;
    reconciledActionId: ActionId;
    reconciliation: {kind: "matching-result-found"; recoveredResult: RecoveredResultBindingFor<S>; retryAuthorization: null};
    outputBindings: [OutputBinding<"reconciliationReceiptHash">];
    continuationDisposition: "apply-recovered-original-result";
    continuationState?: never;
    artifactCandidate?: never;
  }
}[NormalActionExecutionState];

type RetrySafeAbsenceReconciliationSuccess = {
  [S in NormalActionExecutionState]: {
    interfaceId: "action-result-reconciliation";
    originState: S;
    reconciledActionId: ActionId;
    reconciliation: {
      kind: "retry-safe-absence";
      recoveredResult: null;
      retryAuthorization: {
        originalAction: PendingNormalActionForExecutionState<S>;
        absenceProofHash: Sha256;
      };
    };
    outputBindings: [OutputBinding<"reconciliationReceiptHash">];
    continuationDisposition: "restore-original-running-action";
    continuationState: S;
    artifactCandidate: null;
  }
}[NormalActionExecutionState];

type ReconciliationSuccess =
  | MatchingResultReconciliationSuccess
  | RetrySafeAbsenceReconciliationSuccess;

type NonCandidateInterfaceSuccessRoute =
  | ArtifactAcceptanceSuccess
  | CatalogRegistrySuccess
  | ValidationSuccess
  | {interfaceId: "initial-snapshot"; outputBindings: [OutputBinding<"revisionManifestHash">, OutputBinding<"lockSetHash">]; continuationState: "VALIDATE"}
  | {interfaceId: "semantic-revision-apply"; outputBindings: [OutputBinding<"revisionManifestHash">, OutputBinding<"lockSetHash">]; continuationState: "VALIDATE"}
  | {interfaceId: "resolver-compiler"; outputBindings: [OutputBinding<"resolvedMotionIrHash">, OutputBinding<"renderPlanHash">]; continuationState: "PREVIEW"}
  | {interfaceId: "preview-evidence-renderer"; outputBindings: [OutputBinding<"previewHash">, OutputBinding<"sampledEvidenceManifestHash">]; continuationState: "TECHNICAL_QC"}
  | {interfaceId: "technical-qc"; outputBindings: [OutputBinding<"technicalQcHash">]; continuationState: "CREATIVE_AND_MOTION_REVIEW"}
  | {interfaceId: "approval-recorder"; outputBindings: [OutputBinding<"previewApprovalHash">]; continuationState: "APPROVED"}
  | {interfaceId: "silent-final-renderer"; outputBindings: [OutputBinding<"silentMasterHash">, OutputBinding<"renderManifestHash">]; continuationState: "AUDIO_BRIEF"}
  | {interfaceId: "audio-prompt-generator"; outputBindings: [OutputBinding<"promptAttemptHash">, OutputBinding<"promptContentHash">]; continuationState: "WAITING_FOR_MANUAL_MUSIC"}
  | {interfaceId: "manual-audio-ingress"; outputBindings: [OutputBinding<"manualAudioReturnHash">, OutputBinding<"trackContentHash">]; continuationState: "OPTIONAL_LOCAL_MUX"}
  | {interfaceId: "local-alignment-mux"; outputBindings: [OutputBinding<"alignmentManifestHash">, OutputBinding<"muxManifestHash">, OutputBinding<"mixedMasterHash">]; continuationState: "DELIVERY"}
  | {interfaceId: "delivery-packager"; outputBindings: [OutputBinding<"deliveryManifestHash">]; continuationState: "COMPLETE"; terminalOutcome: {kind: "completed"; deliveryManifestHash: string}};

type InterfaceSuccessRoute =
  | LocalSourceIngressSuccess
  | ProjectPolicyIngressSuccess
  | CapabilityImplementationSuccess
  | ReconciliationSuccess
  | (NonCandidateInterfaceSuccessRoute & {artifactCandidate: null});

type RefusalDiagnosticFor<R extends InterfaceRefusalRecoveryRoute, A extends string> = Diagnostic & {
  severity: "blocking";
  actionId: A;
  interfaceId: R["interfaceId"];
  legalNextRouteId: R["diagnosticRouteId"];
};

type InterfaceRefusalFor<R extends InterfaceRefusalRecoveryRoute, A extends string = string> = InterfaceResultIdentityBase & {
  status: "refused";
  actionId: A;
  interfaceId: R["interfaceId"];
  originState: R["fromState"];
  resultRouteId: ResultRouteIdForRecovery<R>;
  recovery: R;
  diagnostics: [RefusalDiagnosticFor<R, A>, ...Array<RefusalDiagnosticFor<R, A>>];
  outputBindings?: never;
  continuationState?: never;
};

type InterfaceRefusal = InterfaceRefusalRecoveryRoute extends infer R
  ? R extends InterfaceRefusalRecoveryRoute ? InterfaceRefusalFor<R> : never
  : never;

type WorkflowInterfaceResult =
  | (InterfaceSuccessBase & InterfaceSuccessRoute)
  | InterfaceRefusal;
```

The success union binds every `interfaceId` to one exact ordered output tuple and legal continuation; the validator's three dispositions and every acceptance context are separately discriminated. Acceptance success embeds the exact `ArtifactAcceptance` object whose canonical-byte hash is the sole `artifactAcceptanceHash` output, so no later orphan acceptance event is needed. Each validator success likewise embeds its complete no-self-hash `ValidationReceiptFor<D>`. `validationReceiptHash` is exactly SHA-256 over the RFC 8785/JCS bytes of that embedded receipt; no file write is required, and the recorder recomputes its disposition-specific ordered input parents and validated source identities before accepting the output binding. Delivery success requires `terminalOutcome.deliveryManifestHash === outputBindings[0].contentHash` and the current reloaded manifest identity. The caller cannot choose another state, terminal outcome, or output name.

For both success and refusal, `resultReceiptHash` is raw lowercase SHA-256 over the RFC 8785/JCS bytes of the complete `WorkflowInterfaceResult` projection with only `resultReceiptHash` omitted. It is not trusted from the producer and cannot hash itself. The recorder recomputes it before append. A refusal carries the pending action's exact `ResultRouteIdForRecovery<R>`, is correlated to one legal origin/interface/recovery route, carries diagnostics selecting that same route, and has no success bindings or continuation.

Reconciliation binds exactly one closed outcome. `matching-result-found` names the exact immutable local envelope `projects/<project-id>/.workflow/action-results/<original-action-id>/<result-receipt-hash>.json`; its `resultEnvelopePath` must equal that projection and it deliberately has no claimed `continuationState` or outer candidate. The binding distributes over the complete `PendingNormalActionForExecutionState<S>` and derives `resultKind` from `originalAction.kind`: a role action can carry only `role-result`, and an interface action only `interface-result`. The recorder reloads the envelope, recomputes its envelope and inner receipt hashes, verifies every byte of that stored action/decision/input/route identity, and atomically reduces the recovered **original** result—candidate-ready, refusal-ready, ordinary continuation, advisory route, or role-origin return exactly as that result requires. `retry-safe-absence` contains a proof plus that same complete original action and restores only its byte-identical running value in the original execution state. It does not reconstruct an action from selected IDs and does not invent a new one. A missing, conflicting, kind-crossed, nested reconciliation action, multi-receipt, or partially durable original outcome is refusal, never success.

`reconciliationReceiptHash` is not a file or self-hash. Its output-binding value is raw SHA-256 of the RFC 8785 projection `{reconciledActionId, originState, reconciliation}` from the successful result. The recorder recomputes it, so the embedded matching-envelope identity or absence proof is durably bound even though reconciliation itself uses the direct-append sidecar exception.

Every refusal diagnostic is blocking, has the same non-null `actionId` and exact `interfaceId` as its enclosing result, and selects the one enclosing recovery route. The recorder verifies value equality in addition to the closed type; an informational/warning diagnostic or an unrelated/null action/interface cannot drive refusal control.

## Acceptance, source validation, and revision sequencing

Artifact validation/hashing is the only ordinary finalizer for a semantic candidate. Trusted-writer persistence after role authorship is not acceptance. Its acceptance result consumes `AcceptanceContext` and performs the unique continuation; while in `ARTIFACT_ACCEPTANCE`, no source validator, revision applier, or audio generator can run.

Candidate-producing ingress is also two-step. `local-source-ingress` and `project-policy-ingress` may only return an immutable `ArtifactCandidate` plus its captured byte hash in their same producer state. The Ledger then records that candidate and invokes artifact acceptance. Local-source origin selects exactly one initial/update context; policy ingress can select only `project-policy`. Neither ingress may emit an `ArtifactAcceptance`, update current policy/source identity, or take the acceptance continuation itself.

The source validator is a later cross-artifact check, not the first identity producer. It has three mutually exclusive dispositions:

- `initial-source-set`: accepted Brief/Treatment/Motion with no current revision → `SNAPSHOT`.
- `accepted-rebuild-candidates`: complete owner-authored staged chain, current revision unchanged → `APPLY_SEMANTIC_REVISION`.
- `committed-current-revision`: exact source/manifest/locks agree after snapshot/commit → `RESOLVE`.

The semantic revision interface applies bounded operations directly. For rebuild it re-reads the directive and ordered Brief/Treatment/Motion candidate acceptances, recomputes actual diff/scopes/locks, and commits atomically. It never asks Revision Interpreter to author those source payloads.

## Capability implementation boundary

An accepted `future-project-local-proposal` route permits Capability Builder advice only. Before any code write, the Ledger must record a separately trusted human `CapabilityImplementationAuthorization` over the exact finite new-file/purpose manifest beneath `projects/<project-id>/capabilities/<capability-id>/<capability-version>/`. Initial and rebuild invocation/success/refusal routes repeat their exact `originPlanningContext`; no generic capability action can cross those contexts. The implementation interface enforces the closed path/extension/static-import/global-ABI grammar in `workflow-ledger.md`, resolves every target from the trusted repository-root directory descriptor, and exclusively creates only those exact version-bound files with no-follow anchored operations. The one literal `CapabilityImplementationBudget` from `workflow-ledger.md` is preflighted before implementation creates a destination and remains hard-enforced through implementation generation, destination creation, validation, tests, performance checks, and render; unknown accounting, overflow, or any byte/AST/CPU/memory/wall-time/stdout/stderr/temporary/output/file-descriptor/process breach is refusal. Those phases run without capability-controlled network or child processes, with the repository read-only, no ambient credentials, and no writable path except the exact authorized targets during commit. It cannot overwrite, follow links, enter reserved roots, import packages/host APIs, execute dynamic code, or infer directory-wide authority.

`CapabilityImplementationReceipt@1` is accepted only after reloading gap, route, advisory, authorization, all named files, schemas, fixtures, test/performance evidence, registration receipt, and registry snapshot. The interface and receipt repeat the exact active `originPlanningContext` and non-cyclic `implementationBindingHash`. Initial receipt candidates use `initial-capability-receipt`; rebuild candidates use `rebuild-capability-receipt`. Acceptance returns Motion Planner to `MOTION_SPEC` or the active `REBUILD_AUTHORING` motion-spec stage respectively, and the resulting MotionSpec must bind the exact receipt and registry identities. Failure preserves `WAITING_FOR_CAPABILITY_IMPLEMENTATION`.

## Approval recorder and external identity

The Approval recorder is the sole writer of:

`out/<project-id>/<revision-id>/<render-plan-hash>/approval/preview-approval.json`

It reloads rather than trusts summaries of:

1. current revision and source identities plus RenderPlan;
2. exact preview bytes and sampled evidence manifest/member hashes;
3. complete passing Technical QC for that tuple;
4. both producer-correct immutable accepted review attempts, with decisions `ship`;
5. current `EffectivePolicyBinding`; and
6. attributed actor and non-empty reason.

Missing policy resolves only the deterministic `implicit-human-only` binding: human default, host opt-in false, empty allowed-host list. It never auto-approves. Host approval requires an externally accepted explicit policy with opt-in enabled and the exact closed `TrustedHostContext.hostId` in its allowlist. The approval recorder receives `trustedHostContext` out-of-band beside an actor-free `EphemeralHostPreviewApprovalEnvelope`; it verifies both invocation-envelope hashes against `activeRequest.invocationEnvelopeHash`, requires `trustedHostContext.hostId === activeRequest.trustedHostId`, and derives `actor` itself. It rejects any invocation/context mismatch, caller- or model-supplied host actor, stale tuple, missing context, or attempt by a Codex invocation to claim Claude Code (and vice versa).

The recorder writes a PreviewApproval file that contains no self identity. It then computes the external `previewApprovalHash` as SHA-256 of those canonical bytes. The interface result and Ledger store this external identity; downstream artifacts bind it. Thus `previewApprovalHash` is external, non-self-referential, and byte-addressed.

The recorder records authority; it does not create policy, review, source, render, or creative decisions.

## Exact staleness and same-plan binding

Tuple definitions are normative in `artifact-contracts.md`. At every gate, reload the complete applicable tuple:

- QC: revision/source, RenderPlan, preview bytes/hash, evidence manifest/member hashes.
- Reviews: QC tuple/report/pass plus review bundle/evidence and execution-time prompt binding.
- Approval: both exact accepted review hashes/ship decisions, actor/reason, effective policy.
- Silent final: whole approval tuple plus Preview Approval bytes/external hash; Render Manifest binds master/plan/build/profile.
- Audio/delivery: Preview Approval, Render Manifest, silent master, then actual AudioBrief, `promptContentHash`, `promptAttemptHash`, and applicable staged manual-return/alignment/mux identities.

Any bound byte/hash change is stale even with the same revision and RenderPlan. A newly encoded preview, replaced sample, rewritten QC/review/policy/approval/manifest, or changed post-lock audio invalidates every dependent result.

## Determinism and media constraints

The future compiler binds canonical sources, exact frame timing, capability versions/implementation hashes, registry snapshot, the content-addressed `RendererBuildManifest`/`rendererBuildHash`, and its exact render-profile member hash. Runtime evaluation uses only RenderPlan plus current frame and the safely reloaded manifest byte closure. Network, wall-clock time, unseeded randomness, filesystem discovery, remote URLs, arbitrary imports, bytes absent from the build manifest, hidden fallbacks, and new creative choices are forbidden.

The motion runtime mounts one Persistent World for the film: global camera over a World Layer plus persistent Screen Layer. Stable roots and continuity-owned subnodes do not remount at bridges. A true shared element changes one identity's geometry; a split handoff uses the actual target preroll. Camera travel belongs to the global camera track and boundary motion to the declared bridge.

The repository calls no music service. The user manually operates a third-party generator. Manual-audio ingress copies exact returned local bytes; alignment time-shifts audio without inferring a peak or changing picture timing.

Passing validation is not preview; render is not release readiness; two reviewer `ship` decisions are not approval. Approval recording must succeed before silent final, and the accepted locked silent cut must precede AudioBrief and prompt generation.
