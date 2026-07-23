# Capability gap documentation contract

This file is the sole closed Part 1 contract for a durable `CapabilityGap@1` payload and its separate attributed route decision. It defines data and sequencing only. It does not implement canonical hashing, capability code, registration, tests, or a runtime registry.

`DurableSemanticText` is the exact locator-safe semantic-prose alias in `input-trust.md`; it is referenced here without widening.

## Durable gap payload

```ts
type AttemptedCapabilityVersion = {
  id: string;
  version: string;
};

type ProhibitedEngineChangeCode =
  | "dynamic-source-injection"
  | "global-shared-registry-mutation"
  | "remote-or-generated-media"
  | "scope-expansion";

type OriginPlanningContext =
  | {
      kind: "initial";
      revisionAttemptId: null;
      resumeState: "MOTION_SPEC";
      motionSpecAcceptanceRouteId: "initial-motion-spec";
      gapAcceptanceRouteId: "initial-capability-gap";
      receiptAcceptanceRouteId: "initial-capability-receipt";
    }
  | {
      kind: "rebuild";
      revisionAttemptId: string;
      resumeState: "REBUILD_AUTHORING";
      motionSpecAcceptanceRouteId: "rebuild-motion-spec";
      gapAcceptanceRouteId: "rebuild-capability-gap";
      receiptAcceptanceRouteId: "rebuild-capability-receipt";
    };

type CapabilityGap = {
  schemaVersion: "capability-gap@1";
  projectId: string;
  briefHash: string;
  treatmentHash: string;
  assetManifestHash: string | null;
  capabilityRegistrySnapshotHash: string;
  capabilityReceiptSetHash: string;
  originPlanningContext: OriginPlanningContext;
  gapId: string;
  requiredIntent: DurableSemanticText;
  whyExistingCompositionFails: DurableSemanticText;
  attemptedCapabilities: [AttemptedCapabilityVersion, ...AttemptedCapabilityVersion[]];
  affectedBeatIds: [string, ...string[]];
  honestApproximation: DurableSemanticText | null;
  proposedProjectLocalScope: DurableSemanticText | null;
  prohibitedEngineChanges: [ProhibitedEngineChangeCode, ...ProhibitedEngineChangeCode[]];
};
```

IDs are non-empty. `attemptedCapabilities` contains unique `(id, version)` pairs, each of which occurs exactly in the bound capability-registry snapshot; ID and version are separate fields and must never be concatenated into a synthetic ID. `affectedBeatIds` and the other ID arrays are unique. Existing declared capability versions and honest compositions must be attempted before a gap is valid. At least one of `honestApproximation` or `proposedProjectLocalScope` is non-null. The project-local scope, when present, starts with `project.<project-id>.`. `prohibitedEngineChanges` contains each of the four closed `ProhibitedEngineChangeCode` members exactly once in the declared union order; no free-form engine-change text is accepted.

The payload must not contain `contentHash`, `gapContentHash`, `routeRequest`, an actor, a decision, authorization, source code, paths to alleged generated files, or registration claims. Its external `gapContentHash` is the lowercase SHA-256 of the exact canonical UTF-8 JSON bytes, as documented in `artifact-contracts.md`.

## Attributed route decision

The route is separate coordination evidence, never a field inside the hashed gap payload:

```ts
type CapabilityGapRouteDecision = {
  schemaVersion: "capability-gap-route@1";
  pauseId: string;
  gapPath: string;
  gapContentHash: string;
  originPlanningContext: OriginPlanningContext;
  decision: "honest-approximation" | "future-project-local-proposal" | "decline";
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};
```

The orchestrator reloads the exact repository-relative gap path, recomputes its external acceptance identity, checks project/Brief/Treatment/assets and exact registry/receipt-set bindings, and requires a non-empty attributed human decision and reason. `pauseId` must select the current exact `capability-gap-route` pause. `originPlanningContext` must be byte-for-byte equal to the accepted gap field, pause, and current Ledger context; it cannot be supplied or changed independently. The Workflow Ledger recorder computes and records a deterministic `routeDecisionHash` over the decision's RFC 8785 bytes. Motion Planner may describe available routes but cannot produce this decision. Capability Builder may consume only `decision: "future-project-local-proposal"`; it cannot create or amend the route.

## Part 1 sequencing

```text
CAPABILITY_GAP (retains exact initial/rebuild originPlanningContext)
├─ honest-approximation → Motion Planner may produce a new honest MotionSpec attempt
│  ├─ initial context → MOTION_SPEC → acceptance(initial-motion-spec)
│  └─ rebuild context → REBUILD_AUTHORING → acceptance(rebuild-motion-spec)
├─ future-project-local-proposal → CAPABILITY_ADVISORY
│  ├─ Capability Builder advisory recorded with advisoryResultReceiptHash → WAITING_FOR_CAPABILITY_IMPLEMENTATION
│  └─ blocked advisory request → needs-user pause or terminal refusal, according to recoverability
├─ stale / mismatch → remain in CAPABILITY_GAP with the exact recoverable pause and request a current attributed route decision
└─ explicit human decline → STOP
```

The advisory occurs before the resumable waiting state only on the explicitly selected project-local-proposal branch. It is ephemeral guidance, not implementation, registration, package, gate artifact, or permission to write code. Route selection authorizes only an advisory. The gap, route decision, advisory, waiting pause, authorization, receipt, accepted receipt route, and active Ledger gap all carry the same exact `OriginPlanningContext`. The human must separately accept a finite exact-file `CapabilityImplementationAuthorization`; the future local implementation interface then returns `CapabilityImplementationReceipt@1` binding its authorization hash, exact named evidence files, resulting registry snapshot, and origin context. Generic artifact acceptance uses `initial-capability-receipt → MOTION_SPEC` or `rebuild-capability-receipt → REBUILD_AUTHORING`; the resumed Motion Planner then writes the matching initial/rebuild MotionSpec route and binds both receipt and registry snapshot identities. Part 1 implements none of that code.

A stale or mismatched decision must remain in `CAPABILITY_GAP` through a same-state recoverable pause while the orchestrator requests current attributed route evidence. Staleness alone is never terminal authority. Only an explicit human decline, abandonment, or a genuinely unsupported fixed scope may end the current request.
