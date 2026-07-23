# Workflow decision documentation contract

`WorkflowDecision@1` is the orchestrator's closed routing protocol for one local project. It is documentation only: Part 1 implements no allocator, Ledger runtime, validator, renderer, Remotion engine, CLI, or API. A decision grants no semantic, review, approval, or tool-result authority.

## Project identity and quick defaults

`WorkflowInvocation` is the closed ephemeral caller input `{userRequest, requestedProjectId?, suppliedLocalPaths[]}`. It contains no host identity. The invoking adapter supplies a separate out-of-band `TrustedHostContext`; a Prompt, model result, caller-authored JSON field, or operator input cannot create or override that context. `suppliedLocalPaths` contains direct host-native locators only in the ephemeral invocation and is never copied into the Ledger. The adapter applies the exact locator-and-secret projection to the raw user request and raw requested project ID before any `ProjectId` validation, derivation, collision lookup, directory creation, hash, Ledger append, path composition, or delegation.

- `ProjectId` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`, is at most 64 characters, and is invalid when its case-insensitive basename is one of the closed `ReservedDeviceBasename` values below.
- An explicit `requestedProjectId` is first scanned as raw untrusted text. If the projection detects or changes any secret or locator token, reject it before persistence and request a safe replacement; never treat the redacted token or original bytes as a closed ID. Otherwise the projected candidate must already conform.
- Without an explicit ID, extract the title only from sanitized `DurableInstructionText`, remove redaction-token placeholders from the title candidate, lowercase the remaining sanitized bytes, retain ASCII alphanumerics, replace every other run with `-`, trim hyphens, and use `motion-video` when empty. Slug derivation never reads raw request bytes.
- Check project directories case-insensitively. Try `base`, `base-2`, `base-3`, and so on. For suffix `s`, truncate the base to `64 - s.length`, trim its trailing hyphen, append `s`, and revalidate. If no non-empty legal candidate can form, pause for a conforming explicit ID.
- Allocation uses no time, randomness, remote lookup, or model-selected suffix.
- A one-sentence request that omits production settings uses explicit, user-overridable assumptions: `1920×1080`, 30 fps, 20 seconds. User-supplied platform, dimensions, ratio, fps, duration, and structured fields override the corresponding default. Defaults are never product facts.

## Closed states, actors, and interfaces

```ts
type ProjectId = string & {readonly __projectId: unique symbol};
type ReservedDeviceBasename =
  | "con" | "prn" | "aux" | "nul"
  | "com1" | "com2" | "com3" | "com4" | "com5" | "com6" | "com7" | "com8" | "com9"
  | "lpt1" | "lpt2" | "lpt3" | "lpt4" | "lpt5" | "lpt6" | "lpt7" | "lpt8" | "lpt9";
type Sha256 = string & {readonly __sha256: unique symbol};
type RequestId = string & {readonly __requestId: unique symbol};
type ActionId = string & {readonly __actionId: unique symbol};
type PauseId = string & {readonly __pauseId: unique symbol};
type HostId = "codex" | "claude-code";
type TrustedHostContext = {
  provenance: "out-of-band-host-adapter";
  hostId: HostId;
  invocationEnvelopeHash: Sha256;
};
type WorkflowInvocation = {
  userRequest: string;
  requestedProjectId?: string;
  suppliedLocalPaths: string[];
};
type DurableWorkflowInvocationProjection = {
  sourceUserInstruction: DurableInstructionText;
  requestedProjectId: ProjectId | null;
  suppliedLocalPathCount: number;
  suppliedLocatorSetHash: Sha256 | null;
};

type WorkflowRoleId =
  | "brief-planner"
  | "researcher"
  | "creative-direction"
  | "motion-planner"
  | "capability-builder"
  | "revision-interpreter"
  | "sound-designer"
  | "creative-reviewer"
  | "motion-reviewer";

type WorkflowState =
  | "INTAKE" | "FACT_CHECK" | "BRIEF" | "TREATMENT" | "MOTION_SPEC"
  | "ARTIFACT_ACCEPTANCE"
  | "CAPABILITY_GAP" | "CAPABILITY_ADVISORY" | "WAITING_FOR_CAPABILITY_IMPLEMENTATION"
  | "VALIDATE" | "SNAPSHOT" | "RESOLVE" | "PREVIEW" | "TECHNICAL_QC"
  | "CREATIVE_AND_MOTION_REVIEW" | "REVISION_SOURCE_UPDATE"
  | "REVISION_INTERPRET" | "REBUILD_AUTHORING" | "APPLY_SEMANTIC_REVISION"
  | "PREVIEW_GATE" | "RECORD_PREVIEW_APPROVAL" | "APPROVED" | "SILENT_FINAL"
  | "AUDIO_BRIEF" | "AUDIO_PROMPT" | "WAITING_FOR_MANUAL_MUSIC"
  | "OPTIONAL_LOCAL_MUX" | "DELIVERY" | "COMPLETE" | "STOP";

type ResumableState = Exclude<WorkflowState, "COMPLETE" | "STOP">;

type WorkflowInterfaceId =
  | "action-result-reconciliation"
  | "local-source-ingress"
  | "project-policy-ingress"
  | "artifact-validation-and-hashing"
  | "catalog-registry-snapshot"
  | "canonical-source-hashing-and-validation"
  | "initial-snapshot"
  | "semantic-revision-apply"
  | "project-local-capability-implementation-and-registration"
  | "resolver-compiler"
  | "preview-evidence-renderer"
  | "technical-qc"
  | "approval-recorder"
  | "silent-final-renderer"
  | "audio-prompt-generator"
  | "manual-audio-ingress"
  | "local-alignment-mux"
  | "delivery-packager";

type OutOfScopeCode =
  | "MULTI_USER_PLATFORM"
  | "WEB_OR_DASHBOARD"
  | "QUEUE_OR_DATABASE"
  | "CREDENTIAL_OR_API_KEY_ARCHITECTURE"
  | "REMOTE_MODEL_OR_MEDIA_API"
  | "AI_GENERATED_IMAGE_OR_VIDEO"
  | "UNSUPPORTED_MEDIUM_OR_DIMENSIONALITY";

type SafeAuditEvidenceId =
  | {kind: "ledger-event"; eventHash: Sha256}
  | {kind: "accepted-artifact"; artifactKind: AcceptedArtifactKind; contentHash: Sha256; acceptanceHash: Sha256}
  | {kind: "role-result"; resultReceiptHash: Sha256}
  | {kind: "interface-result"; resultReceiptHash: Sha256}
  | {kind: "candidate-capture"; candidateByteHash: Sha256; producerResultReceiptHash: Sha256}
  | {kind: "operator-input"; eventHash: Sha256}
  | {kind: "current-revision"; revisionManifestHash: Sha256; lockSetHash: Sha256}
  | {kind: "derived-lineage"; lineageKind: "render-plan" | "preview" | "technical-qc" | "preview-approval" | "render-manifest" | "audio-brief" | "prompt-attempt" | "manual-audio-return" | "mux" | "delivery"; contentHash: Sha256};
```

Before `ProjectId` exists and before `invocationEnvelopeHash` exists, the trusted adapter and recorder apply the exact locator/secret projection in `workflow-ledger.md` to both raw textual fields, validate or derive the project ID only from the sanitized result, and then derive the same `DurableWorkflowInvocationProjection`. Its `requestedProjectId` is either the unchanged, fully validated safe explicit ID or `null`; a secret/locator-bearing explicit candidate cannot reach this shape. `invocationEnvelopeHash` is SHA-256 over only that projection's RFC 8785/JCS bytes, never the raw `WorkflowInvocation`; no hash of a raw request, raw requested ID, or credential-bearing envelope is persisted. The adapter delivers `TrustedHostContext` on a channel unavailable to Prompt-authored data. It binds context to one sanitized invocation but is not itself a credential. The recorder rejects a missing context, an unrecognized adapter provenance, any caller/model `host` field, or a projection/context hash mismatch.

`WAITING_FOR_MANUAL_MUSIC` and `WAITING_FOR_CAPABILITY_IMPLEMENTATION` are resumable states, not terminal stops. `STOP` is reserved for a non-resumable outcome of the current request. A later genuinely new request may begin from a stopped or completed project through a new `invocation-received` event; it does not pretend to resume the failed request.

## Acceptance context: one result, one continuation

Every `ArtifactCandidate` contains exactly one of these Ledger-selected contexts. A semantic producer cannot choose or rewrite it. The successful `artifact-validation-and-hashing` result reducer moves atomically from `ARTIFACT_ACCEPTANCE` to the context's literal `successState`; there is no separate acceptance advance decision.

```ts
type AcceptanceContext =
  | {acceptanceRouteId: "initial-local-assets"; artifactKind: "local-asset-manifest"; successState: "FACT_CHECK"}
  | {acceptanceRouteId: "initial-research"; artifactKind: "research-findings"; successState: "FACT_CHECK"}
  | {acceptanceRouteId: "initial-brief"; artifactKind: "brief"; successState: "TREATMENT"}
  | {acceptanceRouteId: "initial-treatment"; artifactKind: "treatment"; successState: "MOTION_SPEC"}
  | {acceptanceRouteId: "initial-motion-spec"; artifactKind: "motion-spec"; successState: "VALIDATE"}
  | {acceptanceRouteId: "source-update-local-assets"; artifactKind: "local-asset-manifest"; successState: "REVISION_SOURCE_UPDATE"}
  | {acceptanceRouteId: "source-update-research"; artifactKind: "research-findings"; successState: "REVISION_SOURCE_UPDATE"}
  | {acceptanceRouteId: "initial-capability-gap"; artifactKind: "capability-gap"; successState: "CAPABILITY_GAP"}
  | {acceptanceRouteId: "rebuild-capability-gap"; artifactKind: "capability-gap"; successState: "CAPABILITY_GAP"}
  | {acceptanceRouteId: "bounded-patch"; artifactKind: "semantic-patch"; successState: "APPLY_SEMANTIC_REVISION"}
  | {acceptanceRouteId: "rebuild-patch"; artifactKind: "semantic-patch"; successState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "rebuild-brief"; artifactKind: "brief"; successState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "rebuild-treatment"; artifactKind: "treatment"; successState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "rebuild-motion-spec"; artifactKind: "motion-spec"; successState: "VALIDATE"}
  | {acceptanceRouteId: "creative-review"; artifactKind: "creative-review"; successState: "CREATIVE_AND_MOTION_REVIEW"}
  | {acceptanceRouteId: "motion-review"; artifactKind: "motion-review"; successState: "CREATIVE_AND_MOTION_REVIEW"}
  | {acceptanceRouteId: "audio-brief"; artifactKind: "audio-brief"; successState: "AUDIO_PROMPT"}
  | {acceptanceRouteId: "project-policy"; artifactKind: "project-policy"; successState: "PREVIEW_GATE"}
  | {acceptanceRouteId: "initial-capability-receipt"; artifactKind: "capability-implementation-receipt"; successState: "MOTION_SPEC"}
  | {acceptanceRouteId: "rebuild-capability-receipt"; artifactKind: "capability-implementation-receipt"; successState: "REBUILD_AUTHORING"};
```

This context distinguishes initial, source-update, and rebuild artifacts of the same kind. Acceptance therefore cannot send a rebuilt Brief down the initial route, or run a revision/audio/source interface merely because the checkpoint says `ARTIFACT_ACCEPTANCE`.

## Stage semantics and role routes

A role executes **inside** its owning stage. A successful role result leaves a candidate ready in that same stage; the next decision invokes acceptance. Downstream state starts only after acceptance succeeds.

```ts
type RoleDelegationRule =
  | {roleRouteId: "initial-research"; resultRouteId: "role.initial-research.result"; fromState: "FACT_CHECK"; toState: "FACT_CHECK"; delegatedRole: "researcher"; originPlanningKind: null; allowedAcceptanceRouteIds: ["initial-research"]}
  | {roleRouteId: "initial-brief"; resultRouteId: "role.initial-brief.result"; fromState: "BRIEF"; toState: "BRIEF"; delegatedRole: "brief-planner"; originPlanningKind: null; allowedAcceptanceRouteIds: ["initial-brief"]}
  | {roleRouteId: "initial-treatment"; resultRouteId: "role.initial-treatment.result"; fromState: "TREATMENT"; toState: "TREATMENT"; delegatedRole: "creative-direction"; originPlanningKind: null; allowedAcceptanceRouteIds: ["initial-treatment"]}
  | {roleRouteId: "initial-motion-planning"; resultRouteId: "role.initial-motion-planning.result"; fromState: "MOTION_SPEC"; toState: "MOTION_SPEC"; delegatedRole: "motion-planner"; originPlanningKind: "initial"; allowedAcceptanceRouteIds: ["initial-motion-spec", "initial-capability-gap"]}
  | {roleRouteId: "initial-gap-honest-approximation"; resultRouteId: "role.initial-gap-honest-approximation.result"; fromState: "CAPABILITY_GAP"; toState: "MOTION_SPEC"; delegatedRole: "motion-planner"; originPlanningKind: "initial"; allowedAcceptanceRouteIds: ["initial-motion-spec"]}
  | {roleRouteId: "rebuild-gap-honest-approximation"; resultRouteId: "role.rebuild-gap-honest-approximation.result"; fromState: "CAPABILITY_GAP"; toState: "REBUILD_AUTHORING"; delegatedRole: "motion-planner"; originPlanningKind: "rebuild"; allowedAcceptanceRouteIds: ["rebuild-motion-spec"]}
  | {roleRouteId: "initial-capability-advisory"; resultRouteId: "role.initial-capability-advisory.result"; fromState: "CAPABILITY_GAP"; toState: "CAPABILITY_ADVISORY"; delegatedRole: "capability-builder"; originPlanningKind: "initial"; allowedAcceptanceRouteIds: []}
  | {roleRouteId: "rebuild-capability-advisory"; resultRouteId: "role.rebuild-capability-advisory.result"; fromState: "CAPABILITY_GAP"; toState: "CAPABILITY_ADVISORY"; delegatedRole: "capability-builder"; originPlanningKind: "rebuild"; allowedAcceptanceRouteIds: []}
  | {roleRouteId: "source-update-research"; resultRouteId: "role.source-update-research.result"; fromState: "REVISION_SOURCE_UPDATE"; toState: "REVISION_SOURCE_UPDATE"; delegatedRole: "researcher"; originPlanningKind: null; allowedAcceptanceRouteIds: ["source-update-research"]}
  | {roleRouteId: "revision-interpret"; resultRouteId: "role.revision-interpret.result"; fromState: "REVISION_INTERPRET"; toState: "REVISION_INTERPRET"; delegatedRole: "revision-interpreter"; originPlanningKind: null; allowedAcceptanceRouteIds: ["bounded-patch", "rebuild-patch"]}
  | {roleRouteId: "rebuild-brief"; resultRouteId: "role.rebuild-brief.result"; fromState: "REBUILD_AUTHORING"; toState: "REBUILD_AUTHORING"; delegatedRole: "brief-planner"; originPlanningKind: "rebuild"; allowedAcceptanceRouteIds: ["rebuild-brief"]}
  | {roleRouteId: "rebuild-treatment"; resultRouteId: "role.rebuild-treatment.result"; fromState: "REBUILD_AUTHORING"; toState: "REBUILD_AUTHORING"; delegatedRole: "creative-direction"; originPlanningKind: "rebuild"; allowedAcceptanceRouteIds: ["rebuild-treatment"]}
  | {roleRouteId: "rebuild-motion-planning"; resultRouteId: "role.rebuild-motion-planning.result"; fromState: "REBUILD_AUTHORING"; toState: "REBUILD_AUTHORING"; delegatedRole: "motion-planner"; originPlanningKind: "rebuild"; allowedAcceptanceRouteIds: ["rebuild-motion-spec", "rebuild-capability-gap"]}
  | {roleRouteId: "creative-review"; resultRouteId: "role.creative-review.result"; fromState: "CREATIVE_AND_MOTION_REVIEW"; toState: "CREATIVE_AND_MOTION_REVIEW"; delegatedRole: "creative-reviewer"; originPlanningKind: null; allowedAcceptanceRouteIds: ["creative-review"]}
  | {roleRouteId: "motion-review"; resultRouteId: "role.motion-review.result"; fromState: "CREATIVE_AND_MOTION_REVIEW"; toState: "CREATIVE_AND_MOTION_REVIEW"; delegatedRole: "motion-reviewer"; originPlanningKind: null; allowedAcceptanceRouteIds: ["motion-review"]}
  | {roleRouteId: "audio-brief"; resultRouteId: "role.audio-brief.result"; fromState: "AUDIO_BRIEF"; toState: "AUDIO_BRIEF"; delegatedRole: "sound-designer"; originPlanningKind: null; allowedAcceptanceRouteIds: ["audio-brief"]};

type RoleDelegationRoute = RoleDelegationRule;
type RoleDelegationTarget = RoleDelegationRoute;
type AllowedAcceptanceRouteIdForRoleRoute<R extends RoleDelegationRoute> = R["allowedAcceptanceRouteIds"][number];
type AllowedArtifactCandidateForRoleRoute<R extends RoleDelegationRoute> =
  AllowedAcceptanceRouteIdForRoleRoute<R> extends infer A extends ArtifactRouteId ? ArtifactCandidateForRoute<A> : never;
```

At `REBUILD_AUTHORING`, `ActiveRevisionAttempt.stage` mechanically selects the one legal route: `brief` → `rebuild-brief`, `treatment` → `rebuild-treatment`, `motion-spec` → `rebuild-motion-planning`. The action records its exact `allowedAcceptanceRouteIds`; a written result outside that finite set is refused before candidate capture, so an initial role cannot smuggle a rebuild context or vice versa. Motion planning has the only intentional multi-outcome rules: the current planning context may produce its matching MotionSpec or matching initial/rebuild CapabilityGap. Honest approximation and accepted receipt return to that same origin planning context.

Every delegate decision records `promptBinding: {promptPath: string; promptHash: string}` from the exact prompt bytes **before** the role runs. The resulting action and artifact acceptance must echo that decision binding; acceptance never substitutes whatever prompt happens to be on disk later.

## Interface routes

For an ordinary interface route, `toState` is its only legal success state. For artifact acceptance, `toState:"ARTIFACT_ACCEPTANCE"` names the execution state only; the candidate's exact `AcceptanceContext.successState` is the only success continuation. Refusal takes neither success edge. An unavailable interface creates the matching same-state pause.

```ts
type ArtifactProducerStateRule =
  | {acceptanceRouteId: "initial-local-assets"; producerState: "INTAKE"}
  | {acceptanceRouteId: "initial-research"; producerState: "FACT_CHECK"}
  | {acceptanceRouteId: "initial-brief"; producerState: "BRIEF"}
  | {acceptanceRouteId: "initial-treatment"; producerState: "TREATMENT"}
  | {acceptanceRouteId: "initial-motion-spec"; producerState: "MOTION_SPEC"}
  | {acceptanceRouteId: "source-update-local-assets"; producerState: "REVISION_SOURCE_UPDATE"}
  | {acceptanceRouteId: "source-update-research"; producerState: "REVISION_SOURCE_UPDATE"}
  | {acceptanceRouteId: "initial-capability-gap"; producerState: "MOTION_SPEC"}
  | {acceptanceRouteId: "rebuild-capability-gap"; producerState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "bounded-patch"; producerState: "REVISION_INTERPRET"}
  | {acceptanceRouteId: "rebuild-patch"; producerState: "REVISION_INTERPRET"}
  | {acceptanceRouteId: "rebuild-brief"; producerState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "rebuild-treatment"; producerState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "rebuild-motion-spec"; producerState: "REBUILD_AUTHORING"}
  | {acceptanceRouteId: "creative-review"; producerState: "CREATIVE_AND_MOTION_REVIEW"}
  | {acceptanceRouteId: "motion-review"; producerState: "CREATIVE_AND_MOTION_REVIEW"}
  | {acceptanceRouteId: "audio-brief"; producerState: "AUDIO_BRIEF"}
  | {acceptanceRouteId: "project-policy"; producerState: "PREVIEW_GATE"}
  | {acceptanceRouteId: "initial-capability-receipt"; producerState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"}
  | {acceptanceRouteId: "rebuild-capability-receipt"; producerState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"};

type AcceptanceProducerStateFor<R extends ArtifactRouteId> =
  Extract<ArtifactProducerStateRule, {acceptanceRouteId: R}>["producerState"];

type InitialArtifactAcceptanceInvocationRoute = {
  [R in ArtifactRouteId]: {
    fromState: AcceptanceProducerStateFor<R>;
    toState: "ARTIFACT_ACCEPTANCE";
    interfaceId: "artifact-validation-and-hashing";
    acceptanceRouteId: R;
    invocationKind: "candidate-ready";
  }
}[ArtifactRouteId];

type ArtifactAcceptanceInvocationRoute = InitialArtifactAcceptanceInvocationRoute;

type NonAcceptanceInterfaceInvocationRoute =
  | {fromState: "INTAKE"; toState: "INTAKE"; interfaceId: "local-source-ingress"}
  | {fromState: "REVISION_SOURCE_UPDATE"; toState: "REVISION_SOURCE_UPDATE"; interfaceId: "local-source-ingress"}
  | {fromState: "PREVIEW_GATE"; toState: "PREVIEW_GATE"; interfaceId: "project-policy-ingress"}
  | {fromState: "TREATMENT"; toState: "TREATMENT"; interfaceId: "catalog-registry-snapshot"}
  | {fromState: "MOTION_SPEC"; toState: "MOTION_SPEC"; interfaceId: "catalog-registry-snapshot"}
  | {fromState: "VALIDATE"; toState: "SNAPSHOT"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "initial-source-set"}
  | {fromState: "VALIDATE"; toState: "APPLY_SEMANTIC_REVISION"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "accepted-rebuild-candidates"}
  | {fromState: "VALIDATE"; toState: "RESOLVE"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "committed-current-revision"}
  | {fromState: "SNAPSHOT"; toState: "VALIDATE"; interfaceId: "initial-snapshot"}
  | {fromState: "APPLY_SEMANTIC_REVISION"; toState: "VALIDATE"; interfaceId: "semantic-revision-apply"}
  | {fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>}
  | {fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>}
  | {fromState: "RESOLVE"; toState: "PREVIEW"; interfaceId: "resolver-compiler"}
  | {fromState: "PREVIEW"; toState: "TECHNICAL_QC"; interfaceId: "preview-evidence-renderer"}
  | {fromState: "TECHNICAL_QC"; toState: "CREATIVE_AND_MOTION_REVIEW"; interfaceId: "technical-qc"}
  | {fromState: "RECORD_PREVIEW_APPROVAL"; toState: "APPROVED"; interfaceId: "approval-recorder"}
  | {fromState: "SILENT_FINAL"; toState: "AUDIO_BRIEF"; interfaceId: "silent-final-renderer"}
  | {fromState: "AUDIO_PROMPT"; toState: "WAITING_FOR_MANUAL_MUSIC"; interfaceId: "audio-prompt-generator"}
  | {fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "OPTIONAL_LOCAL_MUX"; interfaceId: "manual-audio-ingress"}
  | {fromState: "OPTIONAL_LOCAL_MUX"; toState: "DELIVERY"; interfaceId: "local-alignment-mux"}
  | {fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "COMPLETE"; interfaceId: "delivery-packager"}
  | {fromState: "DELIVERY"; toState: "COMPLETE"; interfaceId: "delivery-packager"};

type NormalInterfaceInvocationRoute = ArtifactAcceptanceInvocationRoute | NonAcceptanceInterfaceInvocationRoute;
type NormalActionRoute = RoleDelegationRoute | NormalInterfaceInvocationRoute;

type NormalInterfaceExecutionState = NormalInterfaceInvocationRoute extends infer R
  ? R extends ArtifactAcceptanceInvocationRoute ? "ARTIFACT_ACCEPTANCE"
    : R extends NonAcceptanceInterfaceInvocationRoute ? R["fromState"] : never
  : never;

type NormalActionExecutionState = RoleDelegationRoute["toState"] | NormalInterfaceExecutionState;

type ReconciliationInvocationRoute = {
  [S in NormalActionExecutionState]: {fromState: S; toState: S; interfaceId: "action-result-reconciliation"}
}[NormalActionExecutionState];

type InterfaceInvocationRoute = NormalInterfaceInvocationRoute | ReconciliationInvocationRoute;

type InterfaceExecutionStateFor<R extends InterfaceInvocationRoute> =
  R extends ArtifactAcceptanceInvocationRoute ? "ARTIFACT_ACCEPTANCE" : R["fromState"];

type ResultRouteIdFor<R extends NormalActionRoute> =
  R extends RoleDelegationRoute ? R["resultRouteId"] :
  R extends ArtifactAcceptanceInvocationRoute
    ? `interface.artifact-acceptance.candidate-ready.${R["acceptanceRouteId"]}.result`
    : R extends {interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: infer D extends string}
      ? `interface.canonical-source-hashing-and-validation.${D}.result`
      : R extends {interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: {kind: infer K extends "initial" | "rebuild"}}
        ? `interface.project-local-capability-implementation-and-registration.${K}.result`
      : R extends NonAcceptanceInterfaceInvocationRoute
        ? `interface.${R["interfaceId"]}.${R["fromState"]}.result`
        : never;

type OperatorInputEventBindingFor<R extends NormalInterfaceInvocationRoute> =
  R extends {interfaceId: "local-source-ingress"}
    ? {inputKind: "local-source-ingress-request"; eventHash: Sha256}
    : R extends {interfaceId: "project-policy-ingress"}
      ? {inputKind: "project-policy-ingress-request"; eventHash: Sha256}
      : R extends {interfaceId: "project-local-capability-implementation-and-registration"}
        ? {inputKind: "capability-implementation-authorization"; eventHash: Sha256}
        : R extends {interfaceId: "approval-recorder"}
          ? {inputKind: "preview-gate-decision"; eventHash: Sha256}
          : R extends {interfaceId: "manual-audio-ingress"}
            ? {inputKind: "manual-audio-ingress-request"; eventHash: Sha256}
            : R extends {interfaceId: "delivery-packager"; fromState: "WAITING_FOR_MANUAL_MUSIC"}
              ? {inputKind: "no-track-selection"; eventHash: Sha256}
              : R extends ArtifactAcceptanceInvocationRoute
                ? {inputKind: "artifact-acceptance-retry"; eventHash: Sha256} | null
                : null;

type RoleActionInvocationInputFor<R extends RoleDelegationRoute> = {
  schemaVersion: "action-invocation-input@1";
  kind: "role";
  projectId: ProjectId;
  requestId: string;
  roleRouteId: R["roleRouteId"];
  role: R["delegatedRole"];
  originState: R["fromState"];
  executionState: R["toState"];
  originPlanningKind: R["originPlanningKind"];
  allowedAcceptanceRouteIds: R["allowedAcceptanceRouteIds"];
  promptHash: Sha256;
  acceptedInputs: SafeAuditEvidenceId[];
} & CapabilityGapRouteFieldForRole<R>;

type InterfaceActionInvocationInputFor<R extends NormalInterfaceInvocationRoute> = {
  schemaVersion: "action-invocation-input@1";
  kind: "interface";
  projectId: ProjectId;
  requestId: string;
  interfaceId: R["interfaceId"];
  originState: R["fromState"];
  executionState: InterfaceExecutionStateFor<R>;
  declaredInvocationToState: R["toState"];
  routeCorrelation:
    R extends {acceptanceRouteId: infer A extends ArtifactRouteId; invocationKind: infer K}
      ? {acceptanceRouteId: A; invocationKind: K}
      : R extends {validationDisposition: infer D}
        ? {validationDisposition: D}
        : R extends {originPlanningContext: infer C extends OriginPlanningContext}
          ? {originPlanningContext: C}
          : null;
  operatorInput: OperatorInputEventBindingFor<R>;
  acceptedInputs: SafeAuditEvidenceId[];
} & CapabilityGapRouteFieldForInterface<R>;

type ActionInvocationInputFor<R extends NormalActionRoute> =
  R extends RoleDelegationRoute ? RoleActionInvocationInputFor<R> :
  R extends NormalInterfaceInvocationRoute ? InterfaceActionInvocationInputFor<R> : never;

type NormalActionIdentityFor<R extends NormalActionRoute> = {
  actionId: ActionId;
  invocationInput: ActionInvocationInputFor<R>;
  inputBindingHash: Sha256;
  resultRouteId: ResultRouteIdFor<R>;
};
```

`inputBindingHash` is SHA-256 over the RFC 8785/JCS bytes of the complete route-mapped `ActionInvocationInputFor<R>`. The recorder derives it; the caller cannot supply a different preimage. For gap-dependent Motion Planner/Capability Builder actions, that preimage contains the complete mapped `capabilityGapRoute` with route-decision hash, gap hash, literal decision, and exact initial/rebuild `originPlanningContext`; ordinary roles contain literal `capabilityGapRoute:null`. For project-local capability implementation, the preimage contains both `routeCorrelation.originPlanningContext` and the same complete mapped proposal route, so initial and rebuild inputs cannot collide or cross. `PendingRoleAction` and `PendingNormalInterfaceAction` retain that complete invocation input for reconciliation. `resultRouteId` is the finite literal selected by the same route. `acceptedInputs` contains only `SafeAuditEvidenceId` objects. A repository path, host-native path/locator, URL, prose note, model summary, or arbitrary string is never an `ActionInvocationInput` execution authority. Locator values stay in their separately typed ephemeral ingress envelopes; repository paths remain inside their already accepted artifacts or deterministic interface resources and are addressed here only by safe external identity.

## Refusal recovery routes

A successful route and a refusal-recovery route are different types. A refusal never takes the advertised success edge. Every rejected immutable candidate has one owner-specific correction edge; it is invalidated and replaced by a new attempt rather than edited or retried under new bytes.

```ts
type CandidateRejectionContinuation =
  | {acceptanceRouteId: "initial-local-assets"; recoveryState: "INTAKE"; recoveryOwner: "local-source-ingress"}
  | {acceptanceRouteId: "initial-research"; recoveryState: "FACT_CHECK"; recoveryOwner: "researcher"}
  | {acceptanceRouteId: "initial-brief"; recoveryState: "BRIEF"; recoveryOwner: "brief-planner"}
  | {acceptanceRouteId: "initial-treatment"; recoveryState: "TREATMENT"; recoveryOwner: "creative-direction"}
  | {acceptanceRouteId: "initial-motion-spec"; producerRoleRouteId: "initial-motion-planning"; recoveryState: "MOTION_SPEC"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "initial-motion-spec"; producerRoleRouteId: "initial-gap-honest-approximation"; recoveryState: "CAPABILITY_GAP"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "source-update-local-assets"; recoveryState: "REVISION_SOURCE_UPDATE"; recoveryOwner: "local-source-ingress"}
  | {acceptanceRouteId: "source-update-research"; recoveryState: "REVISION_SOURCE_UPDATE"; recoveryOwner: "researcher"}
  | {acceptanceRouteId: "initial-capability-gap"; recoveryState: "MOTION_SPEC"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "rebuild-capability-gap"; recoveryState: "REBUILD_AUTHORING"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "bounded-patch"; recoveryState: "REVISION_INTERPRET"; recoveryOwner: "revision-interpreter"}
  | {acceptanceRouteId: "rebuild-patch"; recoveryState: "REVISION_INTERPRET"; recoveryOwner: "revision-interpreter"}
  | {acceptanceRouteId: "rebuild-brief"; recoveryState: "REBUILD_AUTHORING"; recoveryOwner: "brief-planner"}
  | {acceptanceRouteId: "rebuild-treatment"; recoveryState: "REBUILD_AUTHORING"; recoveryOwner: "creative-direction"}
  | {acceptanceRouteId: "rebuild-motion-spec"; producerRoleRouteId: "rebuild-motion-planning"; recoveryState: "REBUILD_AUTHORING"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "rebuild-motion-spec"; producerRoleRouteId: "rebuild-gap-honest-approximation"; recoveryState: "CAPABILITY_GAP"; recoveryOwner: "motion-planner"}
  | {acceptanceRouteId: "creative-review"; recoveryState: "CREATIVE_AND_MOTION_REVIEW"; recoveryOwner: "creative-reviewer"}
  | {acceptanceRouteId: "motion-review"; recoveryState: "CREATIVE_AND_MOTION_REVIEW"; recoveryOwner: "motion-reviewer"}
  | {acceptanceRouteId: "audio-brief"; recoveryState: "AUDIO_BRIEF"; recoveryOwner: "sound-designer"}
  | {acceptanceRouteId: "project-policy"; recoveryState: "PREVIEW_GATE"; recoveryOwner: "project-policy-ingress"}
  | {acceptanceRouteId: "initial-capability-receipt"; recoveryState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; recoveryOwner: "project-local-capability-implementation-and-registration"}
  | {acceptanceRouteId: "rebuild-capability-receipt"; recoveryState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; recoveryOwner: "project-local-capability-implementation-and-registration"};

type CandidateRejectionRecoveryRoute =
  CandidateRejectionContinuation extends infer C
    ? C extends CandidateRejectionContinuation
      ? {
    diagnosticRouteId: "candidate-owner-rewrite";
    fromState: "ARTIFACT_ACCEPTANCE";
    toState: C["recoveryState"];
    interfaceId: "artifact-validation-and-hashing";
    acceptanceRouteId: C["acceptanceRouteId"];
    rejectedCandidateByteHash: string;
    recoveryOwner: C["recoveryOwner"];
    producerCorrelation:
      C extends {producerRoleRouteId: infer P extends RoleDelegationRoute["roleRouteId"]}
        ? Extract<CandidateProducerCorrelationFor<C["acceptanceRouteId"]>, {producerKind: "role"; roleRouteId: P}>
        : CandidateProducerCorrelationFor<C["acceptanceRouteId"]>;
  }
      : never
    : never;

type InitialSourceOwnerRepairRoute =
  | {diagnosticRouteId: "initial-source-owner-repair"; fromState: "VALIDATE"; toState: "BRIEF"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "initial-source-set"; recoveryOwner: "brief-planner"}
  | {diagnosticRouteId: "initial-source-owner-repair"; fromState: "VALIDATE"; toState: "TREATMENT"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "initial-source-set"; recoveryOwner: "creative-direction"}
  | {diagnosticRouteId: "initial-source-owner-repair"; fromState: "VALIDATE"; toState: "MOTION_SPEC"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "initial-source-set"; recoveryOwner: "motion-planner"};

type RepairInterfaceRefusalRoute =
  | CandidateRejectionRecoveryRoute
  | InitialSourceOwnerRepairRoute
  | {diagnosticRouteId: "motion-owner-repair"; fromState: "VALIDATE"; toState: "MOTION_SPEC"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "initial-source-set"; recoveryOwner: "motion-planner"}
  | {diagnosticRouteId: "rebuild-owner-repair"; fromState: "VALIDATE"; toState: "REBUILD_AUTHORING"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "accepted-rebuild-candidates"; recoveryOwner: "ledger-selected-rebuild-owner"}
  | {diagnosticRouteId: "rebuild-owner-repair"; fromState: "APPLY_SEMANTIC_REVISION"; toState: "REBUILD_AUTHORING"; interfaceId: "semantic-revision-apply"; recoveryOwner: "ledger-selected-rebuild-owner"}
  | {diagnosticRouteId: "revision-interpreter-repair"; fromState: "VALIDATE"; toState: "REVISION_INTERPRET"; interfaceId: "canonical-source-hashing-and-validation"; validationDisposition: "committed-current-revision"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "revision-interpreter-repair"; fromState: "APPLY_SEMANTIC_REVISION"; toState: "REVISION_INTERPRET"; interfaceId: "semantic-revision-apply"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "revision-interpreter-repair"; fromState: "RESOLVE"; toState: "REVISION_INTERPRET"; interfaceId: "resolver-compiler"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "revision-interpreter-repair"; fromState: "PREVIEW"; toState: "REVISION_INTERPRET"; interfaceId: "preview-evidence-renderer"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "revision-interpreter-repair"; fromState: "TECHNICAL_QC"; toState: "REVISION_INTERPRET"; interfaceId: "technical-qc"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "preview-evidence-repair"; fromState: "TECHNICAL_QC"; toState: "PREVIEW"; interfaceId: "technical-qc"; recoveryOwner: "preview-evidence-renderer"}
  | {diagnosticRouteId: "preview-evidence-repair"; fromState: "RECORD_PREVIEW_APPROVAL"; toState: "PREVIEW"; interfaceId: "approval-recorder"; recoveryOwner: "preview-evidence-renderer"}
  | {diagnosticRouteId: "preview-evidence-repair"; fromState: "SILENT_FINAL"; toState: "PREVIEW"; interfaceId: "silent-final-renderer"; recoveryOwner: "preview-evidence-renderer"}
  | {diagnosticRouteId: "preview-gate-recheck"; fromState: "RECORD_PREVIEW_APPROVAL"; toState: "PREVIEW_GATE"; interfaceId: "approval-recorder"; recoveryOwner: "orchestrator"}
  | {diagnosticRouteId: "preview-gate-recheck"; fromState: "SILENT_FINAL"; toState: "PREVIEW_GATE"; interfaceId: "silent-final-renderer"; recoveryOwner: "orchestrator"}
  | {diagnosticRouteId: "audio-brief-repair"; fromState: "AUDIO_PROMPT"; toState: "AUDIO_BRIEF"; interfaceId: "audio-prompt-generator"; recoveryOwner: "sound-designer"}
  | {diagnosticRouteId: "audio-brief-repair"; fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "AUDIO_BRIEF"; interfaceId: "manual-audio-ingress"; recoveryOwner: "sound-designer"}
  | {diagnosticRouteId: "audio-brief-repair"; fromState: "OPTIONAL_LOCAL_MUX"; toState: "AUDIO_BRIEF"; interfaceId: "local-alignment-mux"; recoveryOwner: "sound-designer"}
  | {diagnosticRouteId: "audio-brief-repair"; fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "AUDIO_BRIEF"; interfaceId: "delivery-packager"; recoveryOwner: "sound-designer"}
  | {diagnosticRouteId: "audio-brief-repair"; fromState: "DELIVERY"; toState: "AUDIO_BRIEF"; interfaceId: "delivery-packager"; recoveryOwner: "sound-designer"}
  | {diagnosticRouteId: "manual-audio-reselect"; fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "WAITING_FOR_MANUAL_MUSIC"; interfaceId: "manual-audio-ingress"; recoveryOwner: "human"}
  | {diagnosticRouteId: "manual-audio-reselect"; fromState: "OPTIONAL_LOCAL_MUX"; toState: "WAITING_FOR_MANUAL_MUSIC"; interfaceId: "local-alignment-mux"; recoveryOwner: "human"}
  | {diagnosticRouteId: "manual-audio-reselect"; fromState: "DELIVERY"; toState: "WAITING_FOR_MANUAL_MUSIC"; interfaceId: "delivery-packager"; recoveryOwner: "human"}
  | {diagnosticRouteId: "catalog-registry-repair"; fromState: "TREATMENT"; toState: "TREATMENT"; interfaceId: "catalog-registry-snapshot"; recoveryOwner: "repository-maintainer"}
  | {diagnosticRouteId: "catalog-registry-repair"; fromState: "MOTION_SPEC"; toState: "MOTION_SPEC"; interfaceId: "catalog-registry-snapshot"; recoveryOwner: "repository-maintainer"}
  | {diagnosticRouteId: "project-policy-request-repair"; fromState: "PREVIEW_GATE"; toState: "PREVIEW_GATE"; interfaceId: "project-policy-ingress"; recoveryOwner: "human"}
  | {diagnosticRouteId: "resolver-capability-repair"; fromState: "RESOLVE"; toState: "REVISION_INTERPRET"; interfaceId: "resolver-compiler"; recoveryOwner: "revision-interpreter"}
  | {diagnosticRouteId: "capability-authorization-repair"; fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>; recoveryOwner: "human"}
  | {diagnosticRouteId: "capability-authorization-repair"; fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>; recoveryOwner: "human"};

type InvocationRecoveryCorrelationFor<R extends InterfaceInvocationRoute> =
  R extends {acceptanceRouteId: infer A extends ArtifactRouteId} ? {acceptanceRouteId: A} :
  R extends {validationDisposition: infer V} ? {validationDisposition: V} :
  R extends {originPlanningContext: infer C extends OriginPlanningContext} ? {originPlanningContext: C} :
  {};

type SameInputRetryRouteFor<R extends InterfaceInvocationRoute> = R extends InterfaceInvocationRoute ? {
  diagnosticRouteId: "retry-same-action";
  fromState: InterfaceExecutionStateFor<R>;
  toState: InterfaceExecutionStateFor<R>;
  interfaceId: R["interfaceId"];
  declaredInvocationToState: R["toState"];
} & InvocationRecoveryCorrelationFor<R> : never;

type SameInputRetryRoute = SameInputRetryRouteFor<InterfaceInvocationRoute>;

type RequestUserInputRefusalRoute =
  | {diagnosticRouteId: "request-user-input"; fromState: "INTAKE"; toState: "INTAKE"; interfaceId: "local-source-ingress"}
  | {diagnosticRouteId: "request-user-input"; fromState: "REVISION_SOURCE_UPDATE"; toState: "REVISION_SOURCE_UPDATE"; interfaceId: "local-source-ingress"}
  | {diagnosticRouteId: "request-user-input"; fromState: "PREVIEW_GATE"; toState: "PREVIEW_GATE"; interfaceId: "project-policy-ingress"}
  | {diagnosticRouteId: "request-user-input"; fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>}
  | {diagnosticRouteId: "request-user-input"; fromState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>}
  | {diagnosticRouteId: "request-user-input"; fromState: "WAITING_FOR_MANUAL_MUSIC"; toState: "WAITING_FOR_MANUAL_MUSIC"; interfaceId: "manual-audio-ingress"};

type TerminalRefusalRouteFor<R extends InterfaceInvocationRoute> = R extends InterfaceInvocationRoute ? {
  diagnosticRouteId: "terminal-refusal";
  fromState: InterfaceExecutionStateFor<R>;
  toState: "STOP";
  interfaceId: R["interfaceId"];
  declaredInvocationToState: R["toState"];
} & InvocationRecoveryCorrelationFor<R> : never;

type InterfaceRefusalRecoveryRoute =
  | RepairInterfaceRefusalRoute
  | SameInputRetryRoute
  | RequestUserInputRefusalRoute
  | TerminalRefusalRouteFor<InterfaceInvocationRoute>;

type NormalInterfaceRouteForRecovery<R extends InterfaceRefusalRecoveryRoute> =
  NormalInterfaceInvocationRoute extends infer I
    ? I extends NormalInterfaceInvocationRoute
      ? I["interfaceId"] extends R["interfaceId"]
        ? InterfaceExecutionStateFor<I> extends R["fromState"]
          ? R extends {acceptanceRouteId: infer A}
            ? I extends {acceptanceRouteId: A} ? I : never
            : R extends {validationDisposition: infer V}
              ? I extends {validationDisposition: V} ? I : never
              : R extends {originPlanningContext: infer C}
                ? I extends {originPlanningContext: C} ? I : never
                : I
          : never
        : never
      : never
    : never;

type ResultRouteIdForRecovery<R extends InterfaceRefusalRecoveryRoute> =
  R["interfaceId"] extends "action-result-reconciliation"
    ? "interface.action-result-reconciliation.result"
    : ResultRouteIdFor<NormalInterfaceRouteForRecovery<R>>;
```

The rejection reducer selects a distributed `CandidateRejectionRecoveryRoute` by exact equality with the rejected `PendingArtifact.producerCorrelation`; the acceptance route alone is insufficient. An ordinary initial/rebuild Motion Planner attempt returns to its owner stage. A rejected honest-approximation MotionSpec returns to `CAPABILITY_GAP` with the same active gap, human route decision, route-decision hash, and initial/rebuild planning context intact, and may re-delegate only the matching honest-approximation role route. No rejection path may silently erase or reinterpret that human-selected route.

`retry-same-action` is legal only when the refusal proves that no side effect or candidate-byte change occurred. Content/schema/parent/path/prompt failures always select `candidate-owner-rewrite`, invalidate the rejected attempt, and allocate a new immutable attempt. `request-user-input` becomes an exact same-state `NeedsUserDecision`; `terminal-refusal` becomes the terminal `blocked` variant. Every other route is consumed by `recover-interface-refusal` below. The Ledger rejects a recovery whose interface, origin, action, result receipt, candidate hash, validation disposition, or route ID differs from the pending refusal.

Important consequences:

- `ARTIFACT_ACCEPTANCE` may invoke only `artifact-validation-and-hashing`; it cannot invoke source validation, revision application, or audio prompt generation.
- `local-source-ingress` consumes one previously recorded `LocalSourceIngressRequest`; its origin state fixes `initial-local-assets` versus `source-update-local-assets`. `project-policy-ingress` consumes one matching recorded `ProjectPolicyIngressRequest` at the exact Preview Gate. Both interfaces return immutable candidates in their same producer state, never accepted artifacts.
- A MotionSpec candidate becomes `VALIDATE` only through its context-bound acceptance result. A CapabilityGap becomes `CAPABILITY_GAP` only through its own accepted context; there is no direct `MOTION_SPEC → CAPABILITY_GAP` advance.
- `VALIDATE` can reach `RESOLVE` only through a successful source-set validator result with the exact committed-current disposition.
- An accepted SemanticPatch enters `APPLY_SEMANTIC_REVISION` only in bounded mode. A rebuild patch enters `REBUILD_AUTHORING`; after all owner candidates are accepted and validated, `VALIDATE` selects the apply/commit route.
- An accepted AudioBrief enters `AUDIO_PROMPT`, where the deterministic generator must actually succeed before the manual-music wait exists.

## Producer-free advances

```ts
type OrchestrationAdvanceRoute =
  | {fromState: "INTAKE"; toState: "FACT_CHECK"; reasonCode: "no-local-sources"}
  | {fromState: "FACT_CHECK"; toState: "BRIEF"; reasonCode: "facts-closed"}
  | {fromState: "REVISION_SOURCE_UPDATE"; toState: "REVISION_INTERPRET"; reasonCode: "source-update-ready"}
  | {fromState: "CAPABILITY_ADVISORY"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; reasonCode: "advisory-recorded"; originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>}
  | {fromState: "CAPABILITY_ADVISORY"; toState: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; reasonCode: "advisory-recorded"; originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>}
  | {fromState: "CREATIVE_AND_MOTION_REVIEW"; toState: "PREVIEW_GATE"; reasonCode: "both-accepted-reviews-ship"}
  | {fromState: "CREATIVE_AND_MOTION_REVIEW"; toState: "REVISION_INTERPRET"; reasonCode: "accepted-review-repair"}
  | {fromState: "PREVIEW_GATE"; toState: "REVISION_INTERPRET"; reasonCode: "operator-requested-changes"}
  | {fromState: "PREVIEW_GATE"; toState: "RECORD_PREVIEW_APPROVAL"; reasonCode: "operator-approved-current-tuple"}
  | {fromState: "APPROVED"; toState: "SILENT_FINAL"; reasonCode: "approval-recorded"};
```

An advance consumes recorded evidence and invokes no producer. It must not stand in for acceptance, validation, application, rendering, prompt generation, mux, or delivery.

## Re-entry request routes

An `invocation-received` event creates a new `requestId` and preserves the old immutable lineage. The first head-bound decision may use one of these routes only when its evidence predicate is true.

```ts
type RequestClass = "new-project" | "visual-revision" | "review-retry" | "audio-request" | "delivery-retry";
type ReentrySourceState = "PREVIEW_GATE" | "WAITING_FOR_MANUAL_MUSIC" | "COMPLETE" | "STOP";
type AudioReentrySourceState = "COMPLETE" | "STOP";

type BeginRequestRoute =
  | {requestClass: "visual-revision"; fromState: ReentrySourceState; toState: "REVISION_SOURCE_UPDATE"; hasNewLocalLocators: true}
  | {requestClass: "visual-revision"; fromState: ReentrySourceState; toState: "REVISION_INTERPRET"; hasNewLocalLocators: false}
  | {requestClass: "review-retry"; fromState: ReentrySourceState; toState: "RESOLVE" | "PREVIEW" | "TECHNICAL_QC" | "CREATIVE_AND_MOTION_REVIEW"; hasNewLocalLocators: false}
  | {requestClass: "audio-request"; fromState: AudioReentrySourceState; toState: "AUDIO_BRIEF"; hasNewLocalLocators: false; requiredLockedPictureTupleHash: string}
  | {requestClass: "delivery-retry"; fromState: "WAITING_FOR_MANUAL_MUSIC" | "COMPLETE" | "STOP"; toState: "WAITING_FOR_MANUAL_MUSIC" | "OPTIONAL_LOCAL_MUX" | "DELIVERY"; hasNewLocalLocators: false};
```

The review/delivery target is the deterministic earliest unmet gate derived from current evidence. It is not a caller-selected shortcut. Audio re-entry is legal only when the current lineage already contains an externally accepted approved locked silent picture and `requiredLockedPictureTupleHash` matches it; `PREVIEW_GATE` alone is never sufficient. A new request from `STOP` abandons the prior terminal request; it does not consume an old pause.

## Decision shapes

```ts
type CapabilityGapRouteBindingFor<
  C extends OriginPlanningContext,
  D extends CapabilityGapRouteDecision["decision"],
> = {
  routeDecisionHash: Sha256;
  gapContentHash: Sha256;
  originPlanningContext: C;
  decision: D;
};

type NoCapabilityGapRoute = {capabilityGapRoute: null};

type CapabilityGapRouteFieldForRole<R extends RoleDelegationRoute> =
  R["roleRouteId"] extends "initial-gap-honest-approximation"
    ? {capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "initial"}>, "honest-approximation">}
    : R["roleRouteId"] extends "rebuild-gap-honest-approximation"
      ? {capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "rebuild"}>, "honest-approximation">}
      : R["roleRouteId"] extends "initial-capability-advisory"
        ? {capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "initial"}>, "future-project-local-proposal">}
        : R["roleRouteId"] extends "rebuild-capability-advisory"
          ? {capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "rebuild"}>, "future-project-local-proposal">}
          : NoCapabilityGapRoute;

type CapabilityGapRouteFieldForInterface<R extends NormalInterfaceInvocationRoute> =
  R extends {interfaceId: "project-local-capability-implementation-and-registration"; originPlanningContext: infer C extends OriginPlanningContext}
    ? {capabilityGapRoute: CapabilityGapRouteBindingFor<C, "future-project-local-proposal">}
    : NoCapabilityGapRoute;

type RoleCandidateProducerCorrelationFor<R extends ArtifactRouteId> =
  RoleDelegationRoute extends infer D
    ? D extends RoleDelegationRoute
      ? R extends D["allowedAcceptanceRouteIds"][number]
        ? {
            producerKind: "role";
            roleRouteId: D["roleRouteId"];
            capabilityGapRoute: CapabilityGapRouteFieldForRole<D>["capabilityGapRoute"];
          }
        : never
      : never
    : never;

type InterfaceCandidateProducerCorrelationFor<R extends ArtifactRouteId> =
  R extends "initial-local-assets"
    ? {producerKind: "interface"; interfaceId: "local-source-ingress"; originState: "INTAKE"; capabilityGapRoute: null}
    : R extends "source-update-local-assets"
      ? {producerKind: "interface"; interfaceId: "local-source-ingress"; originState: "REVISION_SOURCE_UPDATE"; capabilityGapRoute: null}
      : R extends "project-policy"
        ? {producerKind: "interface"; interfaceId: "project-policy-ingress"; originState: "PREVIEW_GATE"; capabilityGapRoute: null}
        : R extends "initial-capability-receipt"
          ? {
              producerKind: "interface";
              interfaceId: "project-local-capability-implementation-and-registration";
              originPlanningContext: Extract<OriginPlanningContext, {kind: "initial"}>;
              capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "initial"}>, "future-project-local-proposal">;
            }
          : R extends "rebuild-capability-receipt"
            ? {
                producerKind: "interface";
                interfaceId: "project-local-capability-implementation-and-registration";
                originPlanningContext: Extract<OriginPlanningContext, {kind: "rebuild"}>;
                capabilityGapRoute: CapabilityGapRouteBindingFor<Extract<OriginPlanningContext, {kind: "rebuild"}>, "future-project-local-proposal">;
              }
            : never;

type CandidateProducerCorrelationFor<R extends ArtifactRouteId> =
  | RoleCandidateProducerCorrelationFor<R>
  | InterfaceCandidateProducerCorrelationFor<R>;

type CapabilityGapRouteFieldForAdvance<R extends OrchestrationAdvanceRoute> =
  R extends {reasonCode: "advisory-recorded"; originPlanningContext: infer C extends OriginPlanningContext}
    ? {capabilityGapRoute: CapabilityGapRouteBindingFor<C, "future-project-local-proposal">}
    : NoCapabilityGapRoute;

type WorkflowDecisionBase = {
  schemaVersion: "workflow-decision@1";
  projectId: ProjectId | null;
  requestId: string;
  expectedLedgerHeadHash: Sha256 | null;
  evidenceRefs: SafeAuditEvidenceId[];
  inputTrustFindings: InputTrustFinding[];
  nextAction: DurableLocatorSafeText;
  invalidatedArtifacts: Sha256[];
  repairCycleId: string | null;
  structuralRepairCount: number;
  visualRepairCount: number;
};

type NonUserWorkflowPause = Exclude<WorkflowPause, {kind: "required-user-input"}>;
type RequiredUserInputPause = Extract<WorkflowPause, {kind: "required-user-input"}>;

type PauseInterfaceFor<P extends NonUserWorkflowPause> =
  P extends {kind: "deferred-interface"; interfaceId: infer I} ? I :
  P extends {kind: "artifact-acceptance"} ? "artifact-validation-and-hashing" :
  P extends {kind: "action-recovery"} ? "action-result-reconciliation" : null;

type PauseDecisionFor<P extends NonUserWorkflowPause> = WorkflowDecisionBase & NoCapabilityGapRoute & {
  decisionKind: "pause";
  status: "paused";
  fromState: P["state"];
  toState: P["state"];
  delegatedRole: null;
  interfaceId: PauseInterfaceFor<P>;
  artifactCandidate: null;
  promptBinding: null;
  pause: P;
  blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  requiredUserInputs: [];
  outOfScopeCodes: [];
};

type PauseDecision = NonUserWorkflowPause extends infer P
  ? P extends NonUserWorkflowPause ? PauseDecisionFor<P> : never
  : never;

type NeedsUserDecisionFor<P extends RequiredUserInputPause> = WorkflowDecisionBase & NoCapabilityGapRoute & {
  decisionKind: "needs-user";
  status: "needs-user";
  fromState: P["state"];
  toState: P["state"];
  delegatedRole: null;
  interfaceId: null;
  artifactCandidate: null;
  promptBinding: null;
  pause: P;
  blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  requiredUserInputs: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  outOfScopeCodes: [];
};

type NeedsUserDecision = NeedsUserDecisionFor<RequiredUserInputPause>;

type InterfaceInvocationDecisionBase = {
  decisionKind: "invoke-interface";
  status: "continue";
  projectId: ProjectId;
  delegatedRole: null;
  promptBinding: null;
  pause: null;
  blockingReasons: [];
  requiredUserInputs: [];
  outOfScopeCodes: [];
};

type ArtifactAcceptanceInvocationDecisionFor<R extends ArtifactAcceptanceInvocationRoute> =
  WorkflowDecisionBase & NoCapabilityGapRoute & R & InterfaceInvocationDecisionBase & NormalActionIdentityFor<R> & {
    artifactCandidate: ArtifactCandidateForRoute<R["acceptanceRouteId"]>;
  };

type ArtifactAcceptanceInvocationDecision = ArtifactAcceptanceInvocationRoute extends infer R
  ? R extends ArtifactAcceptanceInvocationRoute ? ArtifactAcceptanceInvocationDecisionFor<R> : never
  : never;

type NonAcceptanceInterfaceInvocationDecisionFor<R extends NonAcceptanceInterfaceInvocationRoute> =
  WorkflowDecisionBase & CapabilityGapRouteFieldForInterface<R> & R & InterfaceInvocationDecisionBase & NormalActionIdentityFor<R> & {artifactCandidate: null};

type NonAcceptanceInterfaceInvocationDecision = NonAcceptanceInterfaceInvocationRoute extends infer R
  ? R extends NonAcceptanceInterfaceInvocationRoute ? NonAcceptanceInterfaceInvocationDecisionFor<R> : never
  : never;

type ReconciliationActionInvocationInputFor<R extends ReconciliationInvocationRoute> = {
  schemaVersion: "action-invocation-input@1";
  kind: "action-result-reconciliation";
  projectId: ProjectId;
  requestId: string;
  originState: R["fromState"];
  executionState: R["fromState"];
  originalAction: PendingNormalActionForExecutionState<R["fromState"]>;
};

type ReconciliationInvocationDecisionFor<R extends ReconciliationInvocationRoute> =
  WorkflowDecisionBase & NoCapabilityGapRoute & R & InterfaceInvocationDecisionBase & {
    actionId: ActionId;
    executionState: R["fromState"];
    invocationInput: ReconciliationActionInvocationInputFor<R>;
    inputBindingHash: Sha256;
    resultRouteId: "interface.action-result-reconciliation.result";
    artifactCandidate: null;
    reconciledAction: PendingNormalActionForExecutionState<R["fromState"]>;
  };

type ReconciliationInvocationDecision = ReconciliationInvocationRoute extends infer R
  ? R extends ReconciliationInvocationRoute ? ReconciliationInvocationDecisionFor<R> : never
  : never;

type InterfaceRefusalRecoveryDecisionFor<R extends RepairInterfaceRefusalRoute> = WorkflowDecisionBase & NoCapabilityGapRoute & R & {
  decisionKind: "recover-interface-refusal";
  status: "continue";
  projectId: ProjectId;
  delegatedRole: null;
  artifactCandidate: null;
  promptBinding: null;
  pause: null;
  refusedActionId: ActionId;
  refusedResultReceiptHash: Sha256;
  refusedResultRouteId: ResultRouteIdForRecovery<R>;
  blockingReasons: [];
  requiredUserInputs: [];
  outOfScopeCodes: [];
};

type InterfaceRefusalRecoveryDecision = RepairInterfaceRefusalRoute extends infer R
  ? R extends RepairInterfaceRefusalRoute ? InterfaceRefusalRecoveryDecisionFor<R> : never
  : never;

type RetryRefusedInterfaceDecisionFor<R extends SameInputRetryRoute> = WorkflowDecisionBase & NoCapabilityGapRoute & R & {
  decisionKind: "retry-refused-interface";
  status: "continue";
  projectId: ProjectId;
  delegatedRole: null;
  artifactCandidate: null;
  promptBinding: null;
  pause: null;
  refusedActionId: ActionId;
  refusedResultReceiptHash: Sha256;
  refusedInputBindingHash: Sha256;
  refusedResultRouteId: ResultRouteIdForRecovery<R>;
  blockingReasons: [];
  requiredUserInputs: [];
  outOfScopeCodes: [];
};

type RetryRefusedInterfaceDecision = SameInputRetryRoute extends infer R
  ? R extends SameInputRetryRoute ? RetryRefusedInterfaceDecisionFor<R> : never
  : never;

type RoleDelegationDecisionFor<R extends RoleDelegationRoute> =
  WorkflowDecisionBase & R & NormalActionIdentityFor<R> & CapabilityGapRouteFieldForRole<R> & {
    decisionKind: "delegate";
    status: "continue";
    projectId: ProjectId;
    interfaceId: null;
    artifactCandidate: null;
    promptBinding: {promptPath: string; promptHash: Sha256};
    pause: null;
    blockingReasons: [];
    requiredUserInputs: [];
    outOfScopeCodes: [];
  };

type RoleDelegationDecision = RoleDelegationRoute extends infer R
  ? R extends RoleDelegationRoute ? RoleDelegationDecisionFor<R> : never
  : never;

type OrchestrationAdvanceDecisionFor<R extends OrchestrationAdvanceRoute> =
  WorkflowDecisionBase & CapabilityGapRouteFieldForAdvance<R> & R & {
    decisionKind: "advance";
    status: "continue";
    projectId: ProjectId;
    delegatedRole: null;
    interfaceId: null;
    artifactCandidate: null;
    promptBinding: null;
    pause: null;
    blockingReasons: [];
    requiredUserInputs: [];
    outOfScopeCodes: [];
  };

type OrchestrationAdvanceDecision = OrchestrationAdvanceRoute extends infer R
  ? R extends OrchestrationAdvanceRoute ? OrchestrationAdvanceDecisionFor<R> : never
  : never;

type CapabilityGapDeclineDecision = WorkflowDecisionBase & {
  decisionKind: "capability-gap-decline";
  status: "blocked";
  decision: "decline";
  fromState: "CAPABILITY_GAP";
  toState: "STOP";
  projectId: ProjectId;
  delegatedRole: null;
  interfaceId: null;
  artifactCandidate: null;
  promptBinding: null;
  pause: null;
  capabilityGapRoute: CapabilityGapRouteBindingFor<OriginPlanningContext, "decline">;
  blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  requiredUserInputs: [];
  outOfScopeCodes: [];
};

type WorkflowDecision =
  | RoleDelegationDecision
  | ArtifactAcceptanceInvocationDecision
  | NonAcceptanceInterfaceInvocationDecision
  | ReconciliationInvocationDecision
  | InterfaceRefusalRecoveryDecision
  | RetryRefusedInterfaceDecision
  | OrchestrationAdvanceDecision
  | CapabilityGapDeclineDecision
  | (WorkflowDecisionBase & NoCapabilityGapRoute & BeginRequestRoute & {
      decisionKind: "begin-request";
      status: "continue";
      projectId: ProjectId;
      delegatedRole: null;
      interfaceId: null;
      artifactCandidate: null;
      promptBinding: null;
      pause: null;
      blockingReasons: [];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | PauseDecision
  | NeedsUserDecision
  | (WorkflowDecisionBase & NoCapabilityGapRoute & {
      decisionKind: "blocked";
      status: "blocked";
      fromState: WorkflowState;
      toState: "STOP";
      delegatedRole: null;
      interfaceId: WorkflowInterfaceId | null;
      artifactCandidate: null;
      promptBinding: null;
      pause: null;
      blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & NoCapabilityGapRoute & {
      decisionKind: "out-of-scope";
      status: "blocked";
      fromState: WorkflowState;
      toState: "STOP";
      delegatedRole: null;
      interfaceId: null;
      artifactCandidate: null;
      promptBinding: null;
      pause: null;
      blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
      requiredUserInputs: [];
      outOfScopeCodes: [OutOfScopeCode, ...OutOfScopeCode[]];
    });
```

For every normal role/interface action, route, `actionId`, typed `input`, derived `inputBindingHash`, and literal `resultRouteId` are one distributed decision. For acceptance invocation, `acceptanceRouteId`, producer state, and `artifactCandidate.acceptanceContext` are one mapped route, and the invocation must equal the exact Ledger `candidate-ready` value. An acceptance refusal does not create a second invocation route: `retry-refused-interface` restores the complete original running action. For every other interface the candidate is `null`. A reconciliation invocation copies the complete paused ordinary `PendingNormalAction` into both its invocation input and `reconciledAction`; its mapped `executionState` equals the decision's `fromState`/`toState`, and the recorder rejects any action/decision/input/route or kind mismatch. A `retry-refused-interface` decision is legal only on the matching `refusal-ready` head and restores that same action ID, decision event, typed input, input hash, exact result route, candidate, and execution state; it never allocates a new action. The distributed pause variants preserve each pause's literal state/interface correlation. A refusal-recovery decision consumes exactly one pending refusal and cannot be emitted from ordinary `ready`, `running`, `candidate-ready`, or `paused` control. Counts are non-negative integers. Every in-project decision has a non-null raw lowercase SHA-256 `expectedLedgerHeadHash`; only a pre-project refusal may use `projectId:null`, `requestId:"pre-project"`, and a null head.

## Pause and truth rules

- A recoverable wait uses `pause` or `needs-user` and preserves `fromState === toState`; it never writes `STOP`.
- `required-user-input` is limited to facts, rights, destination usability, source selection, request scope, or explicit lock decisions. Creative blanks use labeled assumptions.
- A deferred interface, acceptance retry, Preview Gate wait, manual music wait, and capability implementation wait each use the exact `WorkflowPause` and resume input in `workflow-ledger.md`.
- `blocked` is terminal for the current request: corrupt/unmigratable Ledger, exhausted repair budget, impossible lock conflict within the authorized request, or unrecoverable rights refusal. `blocked` never represents abandonment; only a recorded `AbandonRequest` may do that. An unavailable interface is **not** terminal and uses a pause.
- `out-of-scope` never becomes a CapabilityGap and never expands the fixed product boundary.
- No decision may fabricate a hash, prompt binding, candidate, acceptance, Ledger event, role/interface result, approval, render, review, implementation receipt, filesystem write, or completion.
