# Role result contract

`RoleResult@1` is an ephemeral, non-authoritative handoff from a delegated role to the orchestrator. It is not a persisted source/gate artifact, does not compete with artifact ownership, and does not prove a deferred interface ran. A role returns exactly one closed variant: `written`, `blocked`, `awaiting-interface`, or `advisory`.

Every variant has the same typed trust-audit route:

```ts
type RoleResultBase = {
  schemaVersion: "role-result@1";
  role: WorkflowRoleId;
  inputTrustFindings: InputTrustFinding[];
};

type RoleResult =
  | (RoleResultBase & {
      status: "written";
      artifactPath: string;
      expectedBindings: Record<string, string>;
    })
  | (RoleResultBase & {
      status: "blocked";
      blockingReasons: [string, ...string[]];
      requiredInputs: [string, ...string[]];
      observedBindings: Record<string, string | null>;
    })
  | (RoleResultBase & {
      status: "awaiting-interface";
      artifactPath: string;
      requiredInterface: string;
      blockingReasons: [string, ...string[]];
      observedBindings: Record<string, string | null>;
    })
  | (RoleResultBase & {
      status: "advisory";
      role: "capability-builder";
      advisoryType: "project-local-capability-proposal";
      nonCanonicalPayload: Record<string, unknown>;
      observedBindings: Record<string, string | null>;
      limitations: [string, ...string[]];
      nextAuthority: string;
    });
```

`WorkflowRoleId` is the exact role union in `workflow-decision.md`; `InputTrustFinding` is the exact safe-summary type in `input-trust.md`. Every `RoleResult@1` variant must include `inputTrustFindings`, using `[]` when the delegated turn observed none. This field is an ephemeral audit handoff, not a canonical artifact field, source authority, gate result, or permission. When a role also owns an artifact shape that carries trust findings, the overlapping ordered findings must agree; the RoleResult route exists so roles whose closed artifact does not carry that field can still report a newly observed injection without corrupting the artifact schema.

## Written

Use `written` only after the authorized artifact was actually written at `artifactPath`. `expectedBindings` states the project/revision/parent hashes the next interface must verify.

```json
{
  "schemaVersion": "role-result@1",
  "status": "written",
  "role": "motion-planner",
  "inputTrustFindings": [],
  "artifactPath": "projects/launch-film/motion.spec.json",
  "expectedBindings": {
    "projectId": "launch-film",
    "treatmentHash": "sha256:1111111111111111111111111111111111111111111111111111111111111111"
  }
}
```

## Blocked

Use `blocked` when required evidence, authority, or a legal route is absent. `blockingReasons` and `requiredInputs` are non-empty. `observedBindings` reports what was actually inspected; it must not invent expected hashes.

```json
{
  "schemaVersion": "role-result@1",
  "status": "blocked",
  "role": "revision-interpreter",
  "inputTrustFindings": [],
  "blockingReasons": ["The observed lock-set hash does not match the delegated hash."],
  "requiredInputs": ["Current expectedLockSetHash"],
  "observedBindings": {
    "baseRevisionId": "rev-0004",
    "lockSetHash": "sha256:2222222222222222222222222222222222222222222222222222222222222222"
  }
}
```

## Awaiting interface

Use `awaiting-interface` only after the delegated role's authorized draft artifact has been written but canonical hashing, validation, or recording needed to complete that same role-owned artifact handoff is unavailable. It must name that required interface and cannot claim it succeeded. A later non-role workflow interface—preview, render, approval recording, audio-prompt compilation, mux, or delivery—has no RoleResult producer; its absence is recorded by the orchestrator as a blocked `WorkflowDecision@1`.

For this variant, status is `awaiting-interface`; no alternate workflow state or uppercase stop token is defined.

```json
{
  "schemaVersion": "role-result@1",
  "status": "awaiting-interface",
  "role": "brief-planner",
  "inputTrustFindings": [],
  "artifactPath": "projects/launch-film/brief.spec.json",
  "requiredInterface": "canonical source hashing and validation",
  "blockingReasons": ["The required deterministic interface is not implemented in Part 1."],
  "observedBindings": {
    "projectId": "launch-film"
  }
}
```

## Advisory

Use `advisory` only for a role with `writes: []` that returns a read-only diagnosis or non-authoritative proposal. It has no `artifactPath`. `nonCanonicalPayload` is ephemeral coordination data; `limitations` and `nextAuthority` are non-empty and state why it is not a canonical artifact or gate evidence and who must legally decide or implement next.

```json
{
  "schemaVersion": "role-result@1",
  "status": "advisory",
  "role": "capability-builder",
  "inputTrustFindings": [],
  "advisoryType": "project-local-capability-proposal",
  "nonCanonicalPayload": {
    "gapId": "gap-1",
    "proposedCapabilityId": "diagram-focus-path"
  },
  "observedBindings": {
    "projectId": "launch-film",
    "gapContentHash": "sha256:3333333333333333333333333333333333333333333333333333333333333333"
  },
  "limitations": [
    "Capability Builder is an interface-stub with no Part 1 write authority.",
    "This payload is not a canonical artifact, implementation, registration, or gate evidence."
  ],
  "nextAuthority": "The user must authorize a future exact implementation scope; a future interface must implement and validate it."
}
```

The four shapes are discriminated by `status`; fields from a different variant do not make an invalid combination valid. Never copy hostile payload text into `inputTrustFindings`; use only the central safe-summary representation. `written` success must never be emitted when the artifact was not actually written, and `advisory` must never be promoted into an artifact path. These examples are documentation, not implemented JSON Schemas or tools.
