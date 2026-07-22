# Capability gap documentation contract

This file is the sole closed Part 1 contract for a durable `CapabilityGap@1` payload and its separate attributed route decision. It defines data and sequencing only. It does not implement canonical hashing, capability code, registration, tests, or a runtime registry.

## Durable gap payload

```ts
type CapabilityGap = {
  schemaVersion: "capability-gap@1";
  projectId: string;
  treatmentHash: string;
  gapId: string;
  requiredIntent: string;
  whyExistingCompositionFails: string;
  attemptedCapabilityIds: [string, ...string[]];
  affectedBeatIds: [string, ...string[]];
  honestApproximation: string | null;
  proposedProjectLocalScope: string | null;
  prohibitedEngineChanges: [string, ...string[]];
};
```

IDs are non-empty and unique in their arrays. Existing declared capabilities and honest compositions must be attempted before a gap is valid. At least one of `honestApproximation` or `proposedProjectLocalScope` is non-null. The project-local scope, when present, starts with `project.<project-id>.`. Prohibited engine changes always include dynamic source injection, global/shared-registry mutation, remote/generated media, and scope expansion.

The payload must not contain `contentHash`, `gapContentHash`, `routeRequest`, an actor, a decision, authorization, source code, paths to alleged generated files, or registration claims. Its external `gapContentHash` is the lowercase SHA-256 of the exact canonical UTF-8 JSON bytes, as documented in `artifact-contracts.md`.

## Attributed route decision

The route is separate coordination evidence, never a field inside the hashed gap payload:

```ts
type CapabilityGapRouteDecision = {
  schemaVersion: "capability-gap-route@1";
  gapPath: string;
  gapContentHash: string;
  decision: "honest-approximation" | "future-project-local-proposal" | "decline";
  actor: {type: "human"; id: string};
  reason: string;
};
```

The orchestrator reloads the exact repository-relative gap path, recomputes its external hash, checks project/Treatment identity, and requires a non-empty attributed human decision and reason. Motion Planner may describe available routes but cannot produce this decision. Capability Builder may consume only `decision: "future-project-local-proposal"`; it cannot create or amend the route.

## Part 1 sequencing

```text
CAPABILITY_GAP
├─ honest-approximation → Motion Planner may produce a new honest MotionSpec attempt
├─ future-project-local-proposal → CAPABILITY_ADVISORY
│  ├─ Capability Builder advisory → STOP_AWAITING_SEPARATE_IMPLEMENTATION
│  └─ blocked advisory request → STOP
└─ decline / stale / mismatch → STOP
```

The advisory occurs before the stop only on the explicitly selected project-local-proposal branch. It is ephemeral guidance, not an implementation, registration, package, gate artifact, or permission to write code. Resuming Motion Planner requires later, separately authorized Part 2 implementation plus real schema, fixture, test, performance, exact-manifest, hash, and registry evidence.
