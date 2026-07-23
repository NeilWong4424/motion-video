# Role result documentation contract

`RoleResult@1` is an ephemeral, non-authoritative handoff from one delegated role. It is not a source artifact, acceptance, Ledger event, gate result, approval, or interface receipt. A role returns exactly one closed variant: `written`, `blocked`, or Capability Builder's `advisory`.

```ts
type SafeAuditLabel = string & {readonly __safeAuditLabel: unique symbol};

type ObservedBinding = {
  name: SafeAuditLabel;
  contentHash: string | null;
};

type RoleResultBaseFor<R extends RoleDelegationRoute> = {
  schemaVersion: "role-result@1";
  role: R["delegatedRole"];
  roleRouteId: R["roleRouteId"];
  resultRouteId: R["resultRouteId"];
  inputTrustFindings: InputTrustFinding[];
};

type CapabilityGapRouteDecisionFor<
  D extends CapabilityGapRouteDecision["decision"],
  C extends OriginPlanningContext,
> = Omit<CapabilityGapRouteDecision, "decision" | "originPlanningContext"> & {
  decision: D;
  originPlanningContext: C;
};

type ProjectLocalCapabilityProposal<C extends OriginPlanningContext> = {
  schemaVersion: "project-local-capability-proposal@1";
  gapId: string;
  gapContentHash: string;
  routeDecision: CapabilityGapRouteDecisionFor<"future-project-local-proposal", C>;
  originPlanningContext: C;
  projectId: string;
  capabilityId: string;
  proposedVersion: string;
  intentSchemaId: string;
  resolvedSchemaId: string;
  futureExactFileManifest: [CapabilityAuthorizedFile, ...CapabilityAuthorizedFile[]];
  futureFixtureCases: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  futureTestCases: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
  performanceBudget: {metric: DurableLocatorSafeText; limit: DurableLocatorSafeText};
  continuityIdentity: {stableRoot: SafeAuditLabel; stableSubnodes: [SafeAuditLabel, ...SafeAuditLabel[]]};
  boundaryChecks: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
};

type ArtifactOwningRoleRoute = RoleDelegationRoute extends infer R
  ? R extends RoleDelegationRoute
    ? AllowedAcceptanceRouteIdForRoleRoute<R> extends never ? never : R
    : never
  : never;

type WrittenRoleResultFor<R extends ArtifactOwningRoleRoute> =
  RoleResultBaseFor<R> & {
    status: "written";
    artifactCandidate: AllowedArtifactCandidateForRoleRoute<R>;
  };

type WrittenRoleResult = ArtifactOwningRoleRoute extends infer R
  ? R extends ArtifactOwningRoleRoute ? WrittenRoleResultFor<R> : never
  : never;

type BlockedRoleResult = RoleDelegationRoute extends infer R
  ? R extends RoleDelegationRoute ? RoleResultBaseFor<R> & {
      status: "blocked";
      blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
      requiredInputs: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
      observedBindings: ObservedBinding[];
    } : never
  : never;

type CapabilityAdvisoryRoleRoute = Extract<RoleDelegationRoute, {delegatedRole: "capability-builder"}>;
type AdvisoryRoleResult = CapabilityAdvisoryRoleRoute extends infer R
  ? R extends CapabilityAdvisoryRoleRoute ? RoleResultBaseFor<R> & {
      status: "advisory";
      advisoryType: "project-local-capability-proposal";
      nonCanonicalPayload: ProjectLocalCapabilityProposal<Extract<OriginPlanningContext, {kind: R["originPlanningKind"]}>>;
      observedBindings: ObservedBinding[];
      limitations: [DurableLocatorSafeText, ...DurableLocatorSafeText[]];
      nextAuthority: DurableLocatorSafeText;
    } : never
  : never;

type RoleResult =
  | WrittenRoleResult
  | BlockedRoleResult
  | AdvisoryRoleResult;
```

`WorkflowRoleId`, `RoleDelegationRoute`, `ArtifactCandidate`, and `InputTrustFinding` are the exact central types. Every result repeats the pending action's literal `roleRouteId` and `resultRouteId`. `WrittenRoleResult` distributes over the complete role route and accepts only `AllowedArtifactCandidateForRoleRoute<R>`, so state, active initial/rebuild planning context, owner, and acceptance route cannot form a cross-product. `capability-builder` has an empty allowed route tuple and therefore cannot construct `written`; it has only its context-matched blocked/advisory outcomes. Every variant carries trust findings; `[]` is valid only when that delegated turn observed none. Safe summaries never copy hostile commands, links, or traversal text.

`SafeAuditLabel` uses 1–64 lowercase ASCII alphanumeric, dot, underscore, or hyphen characters, begins and ends alphanumeric, and cannot contain locator separators. Every free-form RoleResult field uses `DurableLocatorSafeText`; the Ledger recorder rejects the entire role result if its recursive output scan finds an ephemeral locator or unprojected locator-shaped token. The immutable result sidecar therefore cannot become a path-leak channel.

## Written

Use `written` only after the role has submitted complete canonical bytes to the trusted candidate writer and received a matching `CandidateWriteReceipt` proving those exact bytes durably exist at `artifactCandidate.artifactPath`. A role/reviewer never directly opens, creates, replaces, renames, or appends its candidate path. The complete candidate carries the closed artifact kind, schema, immutable path, semantic producer, exact nullable **ordered parent tuple**, revision binding, and Ledger-selected AcceptanceContext. The role may populate semantic content and echo already supplied parent identities; it cannot choose the path or acceptance route, fabricate a parent hash, or add fields. The receipt is recorder evidence and is not added to the closed `RoleResult@1`.

`written` proves only that the trusted candidate writer persisted the supplied bytes and returned a matching receipt. The Ledger recorder reloads/captures those bytes, and `artifact-validation-and-hashing` must externally accept the exact candidate before any downstream owner consumes it.

```json
{
  "schemaVersion": "role-result@1",
  "status": "written",
  "role": "brief-planner",
  "roleRouteId": "initial-brief",
  "resultRouteId": "role.initial-brief.result",
  "inputTrustFindings": [],
  "artifactCandidate": {
    "schemaVersion": "artifact-candidate@1",
    "artifactKind": "brief",
    "artifactPath": "projects/launch-film/.workflow/candidates/request-0001/candidate-0001/brief.spec.json",
    "projectId": "launch-film",
    "revisionId": null,
    "semanticProducer": "brief-planner",
    "expectedSchemaVersion": "brief@1",
    "acceptanceContext": {
      "acceptanceRouteId": "initial-brief",
      "artifactKind": "brief",
      "successState": "TREATMENT"
    },
    "expectedParentBindings": [
      {"name": "researchFindingsHash", "contentHash": null},
      {"name": "localAssetManifestHash", "contentHash": null}
    ]
  }
}
```

## Blocked

Use `blocked` only when the role cannot legally author a candidate because evidence, authority, or an unambiguous semantic target is absent. Reasons and required inputs are non-empty. `observedBindings` is an ordered diagnostic list and cannot substitute for `ArtifactParentSet`.

```json
{
  "schemaVersion": "role-result@1",
  "status": "blocked",
  "role": "revision-interpreter",
  "roleRouteId": "revision-interpret",
  "resultRouteId": "role.revision-interpret.result",
  "inputTrustFindings": [],
  "blockingReasons": ["The observed lock-set hash does not match the delegated hash."],
  "requiredInputs": ["The current accepted lock-set identity"],
  "observedBindings": [
    {"name": "lockSetHash", "contentHash": "2222222222222222222222222222222222222222222222222222222222222222"}
  ]
}
```

A role-level `blocked` result does not decide terminal state. The orchestrator uses `needs-user` and a same-state pause when a valid answer can resolve it; only a genuinely non-recoverable current request becomes a terminal refusal.

## Advisory

Only Capability Builder may return `advisory`. It has no artifact path or acceptance context. Its generic `ProjectLocalCapabilityProposal<C>` payload is closed but ephemeral coordination data, never route authorization, an implemented manifest, source code, registration, acceptance, or gate evidence. Its nested route decision is statically restricted to `future-project-local-proposal` and the exact same initial/rebuild context `C` as the delegated advisory route. Before recording a result, the recorder also requires byte equality among the proposal's route decision and the already recorded decision, and exact equality of pause ID, gap path/hash, project, and planning context with the pending action and `activeCapabilityGap`; a cross-context, decline, or honest-approximation payload is invalid. Every proposed path/purpose must use the exact `CapabilityAuthorizedFile` vocabulary from `workflow-ledger.md`; the later human authorization may accept that exact finite list but is still a separate event. All proposal paths live under the canonical `projects/<project-id>/capabilities/<capability-id>/<capability-version>/` root, repeat the bound project/capability/version tuple, use the required purpose directories, and cover every required purpose. The advisory receipt is never in that manifest.

```json
{
  "schemaVersion": "role-result@1",
  "status": "advisory",
  "role": "capability-builder",
  "roleRouteId": "initial-capability-advisory",
  "resultRouteId": "role.initial-capability-advisory.result",
  "inputTrustFindings": [],
  "advisoryType": "project-local-capability-proposal",
  "nonCanonicalPayload": {
    "schemaVersion": "project-local-capability-proposal@1",
    "gapId": "gap-0001",
    "gapContentHash": "3333333333333333333333333333333333333333333333333333333333333333",
    "originPlanningContext": {"kind": "initial", "revisionAttemptId": null, "resumeState": "MOTION_SPEC", "motionSpecAcceptanceRouteId": "initial-motion-spec", "gapAcceptanceRouteId": "initial-capability-gap", "receiptAcceptanceRouteId": "initial-capability-receipt"},
    "routeDecision": {
      "schemaVersion": "capability-gap-route@1",
      "pauseId": "pause-0001",
      "gapPath": "projects/launch-film/.workflow/candidates/request-0001/candidate-0002/capability-gap.json",
      "gapContentHash": "3333333333333333333333333333333333333333333333333333333333333333",
      "originPlanningContext": {"kind": "initial", "revisionAttemptId": null, "resumeState": "MOTION_SPEC", "motionSpecAcceptanceRouteId": "initial-motion-spec", "gapAcceptanceRouteId": "initial-capability-gap", "receiptAcceptanceRouteId": "initial-capability-receipt"},
      "decision": "future-project-local-proposal",
      "actor": {"type": "human", "id": "operator"},
      "reason": "The exact requested effect has no honest registered composition."
    },
    "projectId": "launch-film",
    "capabilityId": "project.launch-film.diagram-focus-path",
    "proposedVersion": "1.0.0",
    "intentSchemaId": "project.schema.launch-film.diagram-focus-path.intent@1",
    "resolvedSchemaId": "project.schema.launch-film.diagram-focus-path.resolved@1",
    "futureExactFileManifest": [
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "evidence/performance-report.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/evidence/performance-report.json", "purpose": "performance-check"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "fixtures/fixture-manifest.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/fixtures/fixture-manifest.json", "purpose": "fixture"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "registration/registration-record.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/registration/registration-record.json", "purpose": "registration-record"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "registry/registry-snapshot.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/registry/registry-snapshot.json", "purpose": "registry-snapshot"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "schemas/intent.schema.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/schemas/intent.schema.json", "purpose": "intent-schema"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "schemas/resolved.schema.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/schemas/resolved.schema.json", "purpose": "resolved-schema"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "src/index.ts", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/src/index.ts", "purpose": "source"},
      {"projectId": "launch-film", "capabilityId": "project.launch-film.diagram-focus-path", "capabilityVersion": "1.0.0", "relativePath": "tests/test-report.json", "path": "projects/launch-film/capabilities/project.launch-film.diagram-focus-path/1.0.0/tests/test-report.json", "purpose": "test"}
    ],
    "futureFixtureCases": ["minimum", "boundary"],
    "futureTestCases": ["determinism", "schema-boundary", "performance"],
    "performanceBudget": {"metric": "future-measured-render-cost", "limit": "declared-before-implementation"},
    "continuityIdentity": {"stableRoot": "capability-root", "stableSubnodes": ["target-node"]},
    "boundaryChecks": ["pure-code-2d", "project-only", "closed-import-graph"]
  },
  "observedBindings": [
    {"name": "gapContentHash", "contentHash": "3333333333333333333333333333333333333333333333333333333333333333"}
  ],
  "limitations": [
    "No implementation or write occurred.",
    "A separate human authorization and future local implementation receipt are required."
  ],
  "nextAuthority": "The human may authorize an exact finite file manifest; only the future implementation interface may write it."
}
```

## Interface absence

No current role returns an interface-wait result. Acceptance, source validation, snapshot, revision application, rendering, QC, approval recording, audio prompt generation, manual-audio ingress, mux, and delivery are non-role workflow interfaces. If one is unavailable, the orchestrator records a same-state `WorkflowDecision@1` pause and exact `WorkflowPause`; it does not ask the previous role to impersonate the interface or treat a temporary absence as terminal.

The three shapes are discriminated by `status`. Fields from another variant are forbidden. `written` is invalid unless the file exists; `advisory` can never be promoted into a candidate; and no RoleResult may claim validation, hash acceptance, approval, render, registration, or completion.
