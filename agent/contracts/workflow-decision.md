# Workflow decision documentation contract

`WorkflowDecision@1` is the orchestrator's ephemeral, non-authoritative routing result. It is not a source artifact, review, approval, hash proof, or deferred-interface result. Part 1 documents this closed union only; it implements no allocator, validator, state store, or CLI.

## Project identity before delegation

`WorkflowInvocation.requestedProjectId` is optional, but every role-owned project path requires a resolved ID before delegation.

- `ProjectId` has one invariant on every path: the final candidate matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` and is at most 64 characters. A supplied ID is accepted only when it satisfies that invariant. An invalid explicit ID produces `needs-user`; it is not silently rewritten.
- Without one, derive `normalizedBase` from the explicit user-supplied product/project/title text: normalize to lowercase, replace each run of non-ASCII-alphanumeric characters with `-`, trim hyphens, and use `motion-video` if nothing remains.
- Check project directories case-insensitively. For candidate ordinal `n`, use `suffix = ""` when `n === 1`, otherwise `suffix = "-" + n`. Compute `prefixBudget = 64 - suffix.length`; truncate the normalized base to that budget, then trim any trailing hyphen from that truncated prefix before appending the suffix. Allocate the first available candidate in the exact sequence represented by `base`, `base-2`, `base-3`, and so on. Thus a 64-character base collision is shortened before `-2` is added, and a multi-digit suffix receives its own exact budget.
- Revalidate every final candidate against the same `ProjectId` invariant after truncation and suffixing. If `suffix.length >= 64`, a legal non-empty candidate cannot form, so return `needs-user` for a valid explicit ID. Do not use time, randomness, a model-generated suffix, or a remote lookup.
- Allocation creates only coordination identity. It does not create a directory, revision, hash, or project artifact. If the host cannot perform the exact collision check, return `needs-user` for a valid explicit ID.

For a quick one-sentence Brief, absent production parameters use explicit, user-overridable assumptions: `1920×1080`, 30 fps, and 20 seconds. An explicit platform, aspect ratio, resolution, fps, duration, or structured Brief overrides the matching default. These defaults are production settings, never product facts. If applying one would contradict a stated destination requirement or make supplied copy unreadable, ask only the conflicting question.

## Common fields and closed union

```ts
type ProjectId = string & { readonly __projectId: unique symbol };

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
  | "CAPABILITY_GAP" | "CAPABILITY_ADVISORY" | "STOP_AWAITING_SEPARATE_IMPLEMENTATION"
  | "VALIDATE" | "SNAPSHOT" | "RESOLVE" | "PREVIEW" | "TECHNICAL_QC"
  | "CREATIVE_AND_MOTION_REVIEW" | "BOUNDED_FIX" | "REVISION_INTERPRET"
  | "APPLY_SEMANTIC_REVISION" | "PREVIEW_GATE" | "RECORD_PREVIEW_APPROVAL"
  | "APPROVED" | "SILENT_FINAL" | "AUDIO_BRIEF" | "AUDIO_PROMPT"
  | "STOP_MANUAL_MUSIC_GENERATION" | "OPTIONAL_LOCAL_MUX" | "DELIVERY"
  | "COMPLETE" | "STOP";

type WorkflowInterfaceId =
  | "canonical-source-hashing-and-validation"
  | "initial-snapshot"
  | "semantic-revision-apply"
  | "resolver-compiler"
  | "preview-evidence-renderer"
  | "technical-qc"
  | "approval-recorder"
  | "silent-final-renderer"
  | "audio-prompt-generator"
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

type WorkflowDecisionBase = {
  schemaVersion: "workflow-decision@1";
  projectId: ProjectId | null;
  evidenceRefs: string[];
  inputTrustFindings: InputTrustFinding[];
  nextAction: string;
  invalidatedArtifacts: string[];
  repairCycleId: string | null;
  structuralRepairCount: number;
  visualRepairCount: number;
  capabilityGapRoute: CapabilityGapRouteDecision | null;
};

type RoleDelegationTarget =
  | {fromState: "INTAKE"; toState: "FACT_CHECK"; delegatedRole: "brief-planner" | "researcher"}
  | {fromState: "FACT_CHECK"; toState: "FACT_CHECK"; delegatedRole: "researcher"}
  | {fromState: "FACT_CHECK"; toState: "BRIEF"; delegatedRole: "brief-planner"}
  | {fromState: "BRIEF"; toState: "TREATMENT"; delegatedRole: "creative-direction"}
  | {fromState: "TREATMENT"; toState: "MOTION_SPEC"; delegatedRole: "motion-planner"}
  | {fromState: "CAPABILITY_GAP"; toState: "MOTION_SPEC"; delegatedRole: "motion-planner"}
  | {fromState: "CAPABILITY_GAP"; toState: "CAPABILITY_ADVISORY"; delegatedRole: "capability-builder"}
  | {fromState: "INTAKE" | "PREVIEW_GATE" | "BOUNDED_FIX"; toState: "REVISION_INTERPRET"; delegatedRole: "revision-interpreter"}
  | {fromState: "BOUNDED_FIX"; toState: "BRIEF"; delegatedRole: "brief-planner"}
  | {fromState: "BOUNDED_FIX"; toState: "TREATMENT"; delegatedRole: "creative-direction"}
  | {fromState: "BOUNDED_FIX"; toState: "MOTION_SPEC"; delegatedRole: "motion-planner"}
  | {
      fromState: "TECHNICAL_QC" | "INTAKE" | "CREATIVE_AND_MOTION_REVIEW";
      toState: "CREATIVE_AND_MOTION_REVIEW";
      delegatedRole: "creative-reviewer" | "motion-reviewer";
    }
  | {fromState: "SILENT_FINAL" | "INTAKE"; toState: "AUDIO_BRIEF"; delegatedRole: "sound-designer"};

type InterfaceInvocationRoute =
  | {
      fromState: "MOTION_SPEC" | "APPLY_SEMANTIC_REVISION";
      toState: "VALIDATE";
      interfaceId: "canonical-source-hashing-and-validation";
    }
  | {fromState: "VALIDATE"; toState: "SNAPSHOT"; interfaceId: "initial-snapshot"}
  | {
      fromState: "REVISION_INTERPRET";
      toState: "APPLY_SEMANTIC_REVISION";
      interfaceId: "semantic-revision-apply";
    }
  | {fromState: "VALIDATE" | "SNAPSHOT" | "INTAKE"; toState: "RESOLVE"; interfaceId: "resolver-compiler"}
  | {fromState: "RESOLVE" | "INTAKE"; toState: "PREVIEW"; interfaceId: "preview-evidence-renderer"}
  | {fromState: "PREVIEW" | "INTAKE"; toState: "TECHNICAL_QC"; interfaceId: "technical-qc"}
  | {fromState: "PREVIEW_GATE"; toState: "RECORD_PREVIEW_APPROVAL"; interfaceId: "approval-recorder"}
  | {fromState: "APPROVED"; toState: "SILENT_FINAL"; interfaceId: "silent-final-renderer"}
  | {fromState: "AUDIO_BRIEF" | "INTAKE"; toState: "AUDIO_PROMPT"; interfaceId: "audio-prompt-generator"}
  | {
      fromState: "STOP_MANUAL_MUSIC_GENERATION" | "INTAKE";
      toState: "OPTIONAL_LOCAL_MUX";
      interfaceId: "local-alignment-mux";
    }
  | {
      fromState: "STOP_MANUAL_MUSIC_GENERATION" | "OPTIONAL_LOCAL_MUX" | "INTAKE";
      toState: "DELIVERY";
      interfaceId: "delivery-packager";
    };

type OrchestrationAdvanceRoute =
  | {fromState: "MOTION_SPEC" | "INTAKE"; toState: "CAPABILITY_GAP"}
  | {fromState: "CAPABILITY_ADVISORY"; toState: "STOP_AWAITING_SEPARATE_IMPLEMENTATION"}
  | {fromState: "VALIDATE" | "CREATIVE_AND_MOTION_REVIEW"; toState: "BOUNDED_FIX"}
  | {fromState: "CREATIVE_AND_MOTION_REVIEW"; toState: "PREVIEW_GATE"}
  | {fromState: "RECORD_PREVIEW_APPROVAL"; toState: "APPROVED"}
  | {fromState: "AUDIO_PROMPT"; toState: "STOP_MANUAL_MUSIC_GENERATION"};

type WorkflowDecision =
  | (WorkflowDecisionBase & RoleDelegationTarget & {
      decisionKind: "delegate";
      status: "continue";
      projectId: ProjectId;
      interfaceId: null;
      blockingReasons: [];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & InterfaceInvocationRoute & {
      decisionKind: "invoke-interface";
      status: "continue";
      projectId: ProjectId;
      delegatedRole: null;
      blockingReasons: [];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & OrchestrationAdvanceRoute & {
      decisionKind: "advance";
      status: "continue";
      projectId: ProjectId;
      delegatedRole: null;
      interfaceId: null;
      blockingReasons: [];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & {
      decisionKind: "needs-user";
      status: "needs-user";
      fromState: WorkflowState;
      toState: "STOP";
      delegatedRole: null;
      interfaceId: null;
      blockingReasons: [string, ...string[]];
      requiredUserInputs: [string, ...string[]];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & {
      decisionKind: "blocked";
      status: "blocked";
      fromState: WorkflowState;
      toState: "STOP";
      delegatedRole: null;
      interfaceId: WorkflowInterfaceId | null;
      blockingReasons: [string, ...string[]];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    })
  | (WorkflowDecisionBase & {
      decisionKind: "out-of-scope";
      status: "blocked";
      fromState: WorkflowState;
      toState: "STOP";
      delegatedRole: null;
      interfaceId: null;
      blockingReasons: [string, ...string[]];
      requiredUserInputs: [];
      outOfScopeCodes: [OutOfScopeCode, ...OutOfScopeCode[]];
    })
  | (WorkflowDecisionBase & {
      decisionKind: "complete";
      status: "complete";
      projectId: ProjectId;
      fromState: "DELIVERY";
      toState: "COMPLETE";
      delegatedRole: null;
      interfaceId: null;
      blockingReasons: [];
      requiredUserInputs: [];
      outOfScopeCodes: [];
    });
```

`ProjectId` is a documented branded string: the host may construct it only after the allocation/validation procedure above. `InputTrustFinding` is the exact type in `input-trust.md`; every decision carries the findings observed during that orchestration turn, or `[]`. `CapabilityGapRouteDecision` is the exact type in `capability-gap-contract.md`. Counts are non-negative integers. `RoleDelegationTarget` closes role/state ownership, including same-state delegation of the second cold reviewer. `InterfaceInvocationRoute` closes every deterministic non-role state with its unique interface and legal re-entry origins. `OrchestrationAdvanceRoute` contains only producer-free classification, gate, repair, and pause-marker transitions. A non-role decision never pretends that a role is active: `delegatedRole` is exactly `null`; any prior RoleResult is referenced through `evidenceRefs`. A pre-project refusal may use `projectId: null`. `decisionKind: "out-of-scope"` is the only representation for a prohibited platform, medium, remote-generation, queue/database, or other fixed-scope violation.

## Stop and truth rules

- `needs-user` asks the smallest set of questions whose answers affect truth, rights, destination usability, requested lock scope, or legal routing. Creative blanks use labeled assumptions and the quick defaults above.
- `blocked` names missing/stale evidence, a deferred deterministic interface, lock/impact conflict, exhausted budget, or another non-question blocker.
- `out-of-scope` neither delegates a role nor converts the request into a CapabilityGap.
- `delegate` uses exactly one `RoleDelegationTarget`; a role cannot be paired with another owner's state. `invoke-interface` uses exactly one `InterfaceInvocationRoute`, keeps `delegatedRole: null`, and does not claim that invocation succeeded. `advance` uses exactly one `OrchestrationAdvanceRoute`, with no role and no deterministic interface.
- `needs-user`, `blocked`, and `out-of-scope` always use `toState: "STOP"`; their shape cannot name a continuing state. `complete` is legal only from `DELIVERY` to `COMPLETE` and requires actual current delivery evidence; the state name or an interface description is not proof.
- No decision may contain a fabricated hash, role result, approval, render, review, or filesystem write.
