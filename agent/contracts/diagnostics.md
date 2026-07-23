# Diagnostic contract

Diagnostics are evidence, not permission for silent repair. Future deterministic interfaces and role reviews must emit stable codes, severity (`info`, `warning`, `blocking`), exact artifact/hash binding, semantic target IDs, frame/range evidence where relevant, a human-readable explanation, and the legal next route. A blocking diagnostic prevents Preview Approval, silent final, mux, or delivery until new current evidence clears it.

## Closed diagnostic envelope and recovery vocabulary

```ts
type DiagnosticCode =
  | "BOUNDARY_BRIDGE_MISSING"
  | "SHARED_NODE_NOT_PERSISTENT"
  | "CONTINUITY_ANCHOR_MISSING"
  | "BRIDGE_REALIZATION_MISMATCH"
  | "ANCHOR_NOT_SALIENT"
  | "TARGET_NOT_PREROLLED"
  | "TRANSITION_ENDPOINT_MISMATCH"
  | "EYE_TRACE_JUMP"
  | "DEAD_FRAME_DETECTED"
  | "CONTENT_STATE_POP"
  | "CAPABILITY_ROOT_REMOUNTED"
  | "TRANSFORM_OWNERSHIP_CONFLICT"
  | "CAMERA_TELEPORT"
  | "CAMERA_JERK"
  | "CAMERA_ALWAYS_MOVING"
  | "UNJUSTIFIED_CHAPTER_CUT"
  | "CHAPTER_CUT_BUDGET_EXCEEDED"
  | "CHAPTER_CUT_V1_LIMIT_EXCEEDED"
  | "CONSECUTIVE_CHAPTER_CUTS"
  | "SLIDE_LIKE_CUT_PATTERN"
  | "TEXT_OVERFLOW"
  | "LOCAL_SOURCE_MISSING"
  | "SOURCE_RIGHTS_UNRESOLVED"
  | "UNTRUSTED_EMBEDDED_INSTRUCTION"
  | "UNTRUSTED_LINK_OR_PATH_EXPANSION"
  | "UNTRUSTED_AUTHORITY_OVERRIDE"
  | "UNTRUSTED_UNSUPPORTED_CLAIM"
  | "PARENT_HASH_MISMATCH"
  | "REVISION_STALE"
  | "LOCK_CONFLICT"
  | "IMPACT_SET_MISMATCH"
  | "GATE_EVIDENCE_MISSING"
  | "GATE_EVIDENCE_STALE"
  | "REPAIR_BUDGET_EXHAUSTED"
  | "AUDIO_RENDER_PLAN_STALE"
  | "MANUAL_AUDIO_DECLARATION_MISSING"
  | "AUDIO_PROMPT_ATTEMPT_MISMATCH"
  | "REGISTRY_SNAPSHOT_MISSING"
  | "CATALOG_REGISTRY_INVALID"
  | "PROJECT_POLICY_REQUEST_INVALID"
  | "RESOLVER_CAPABILITY_UNAVAILABLE"
  | "INTERFACE_TEMPORARILY_UNAVAILABLE"
  | "CANDIDATE_BYTES_CHANGED"
  | "CANDIDATE_SCHEMA_INVALID"
  | "CANDIDATE_BINDING_MISMATCH"
  | "ACTION_RESULT_AMBIGUOUS"
  | "LEDGER_CORRUPT"
  | "IRRECOVERABLE_RIGHTS_REFUSAL";

type DiagnosticRouteId =
  | "retry-same-action"
  | "candidate-owner-rewrite"
  | "request-user-input"
  | "initial-source-owner-repair"
  | "rebuild-owner-repair"
  | "motion-owner-repair"
  | "revision-interpreter-repair"
  | "preview-evidence-repair"
  | "preview-gate-recheck"
  | "audio-brief-repair"
  | "manual-audio-reselect"
  | "capability-authorization-repair"
  | "catalog-registry-repair"
  | "project-policy-request-repair"
  | "resolver-capability-repair"
  | "terminal-refusal";

type VisualRepairRoute =
  | "initial-source-owner-repair"
  | "rebuild-owner-repair"
  | "motion-owner-repair"
  | "revision-interpreter-repair";

type DiagnosticRouteMap = {
  BOUNDARY_BRIDGE_MISSING: VisualRepairRoute;
  SHARED_NODE_NOT_PERSISTENT: VisualRepairRoute | "capability-authorization-repair";
  CONTINUITY_ANCHOR_MISSING: VisualRepairRoute;
  BRIDGE_REALIZATION_MISMATCH: VisualRepairRoute | "capability-authorization-repair";
  ANCHOR_NOT_SALIENT: VisualRepairRoute;
  TARGET_NOT_PREROLLED: VisualRepairRoute | "capability-authorization-repair";
  TRANSITION_ENDPOINT_MISMATCH: VisualRepairRoute;
  EYE_TRACE_JUMP: VisualRepairRoute;
  DEAD_FRAME_DETECTED: VisualRepairRoute;
  CONTENT_STATE_POP: VisualRepairRoute;
  CAPABILITY_ROOT_REMOUNTED: VisualRepairRoute | "capability-authorization-repair";
  TRANSFORM_OWNERSHIP_CONFLICT: VisualRepairRoute;
  CAMERA_TELEPORT: VisualRepairRoute;
  CAMERA_JERK: VisualRepairRoute;
  CAMERA_ALWAYS_MOVING: VisualRepairRoute;
  UNJUSTIFIED_CHAPTER_CUT: VisualRepairRoute;
  CHAPTER_CUT_BUDGET_EXCEEDED: VisualRepairRoute;
  CHAPTER_CUT_V1_LIMIT_EXCEEDED: VisualRepairRoute;
  CONSECUTIVE_CHAPTER_CUTS: VisualRepairRoute;
  SLIDE_LIKE_CUT_PATTERN: "rebuild-owner-repair" | "terminal-refusal";
  TEXT_OVERFLOW: VisualRepairRoute;
  LOCAL_SOURCE_MISSING: "request-user-input";
  SOURCE_RIGHTS_UNRESOLVED: "request-user-input" | "terminal-refusal";
  UNTRUSTED_EMBEDDED_INSTRUCTION: "request-user-input" | "candidate-owner-rewrite";
  UNTRUSTED_LINK_OR_PATH_EXPANSION: "request-user-input" | "candidate-owner-rewrite";
  UNTRUSTED_AUTHORITY_OVERRIDE: "candidate-owner-rewrite" | "terminal-refusal";
  UNTRUSTED_UNSUPPORTED_CLAIM: "candidate-owner-rewrite" | "initial-source-owner-repair" | "rebuild-owner-repair";
  PARENT_HASH_MISMATCH: "candidate-owner-rewrite" | "revision-interpreter-repair" | "preview-gate-recheck" | "audio-brief-repair";
  REVISION_STALE: "revision-interpreter-repair";
  LOCK_CONFLICT: "revision-interpreter-repair" | "terminal-refusal";
  IMPACT_SET_MISMATCH: "revision-interpreter-repair" | "rebuild-owner-repair";
  GATE_EVIDENCE_MISSING: "preview-evidence-repair" | "preview-gate-recheck" | "audio-brief-repair";
  GATE_EVIDENCE_STALE: "preview-evidence-repair" | "preview-gate-recheck" | "audio-brief-repair";
  REPAIR_BUDGET_EXHAUSTED: "terminal-refusal";
  AUDIO_RENDER_PLAN_STALE: "audio-brief-repair";
  MANUAL_AUDIO_DECLARATION_MISSING: "manual-audio-reselect" | "request-user-input";
  AUDIO_PROMPT_ATTEMPT_MISMATCH: "manual-audio-reselect" | "audio-brief-repair";
  REGISTRY_SNAPSHOT_MISSING: "motion-owner-repair" | "capability-authorization-repair";
  CATALOG_REGISTRY_INVALID: "catalog-registry-repair";
  PROJECT_POLICY_REQUEST_INVALID: "project-policy-request-repair";
  RESOLVER_CAPABILITY_UNAVAILABLE: "resolver-capability-repair";
  INTERFACE_TEMPORARILY_UNAVAILABLE: "retry-same-action";
  CANDIDATE_BYTES_CHANGED: "candidate-owner-rewrite";
  CANDIDATE_SCHEMA_INVALID: "candidate-owner-rewrite";
  CANDIDATE_BINDING_MISMATCH: "candidate-owner-rewrite";
  ACTION_RESULT_AMBIGUOUS: "terminal-refusal";
  LEDGER_CORRUPT: "terminal-refusal";
  IRRECOVERABLE_RIGHTS_REFUSAL: "terminal-refusal";
};

type DiagnosticArtifactBinding = {
  artifactKind: AcceptedArtifactKind | "workflow-ledger" | "render-evidence" | "audio-return";
  path: RepositoryArtifactPath;
  expectedContentHash: string | null;
  observedContentHash: string | null;
};

type DiagnosticFor<C extends DiagnosticCode> = {
  schemaVersion: "diagnostic@1";
  diagnosticId: string;
  code: C;
  severity: "info" | "warning" | "blocking";
  actionId: ActionId | null;
  interfaceId: WorkflowInterfaceId | null;
  artifactBinding: DiagnosticArtifactBinding | null;
  semanticTarget: SemanticImpactTarget | null;
  frameRange: [startInclusive: number, endExclusive: number] | null;
  explanation: DurableLocatorSafeText;
  legalNextRouteId: DiagnosticRouteMap[C];
};

type Diagnostic = {
  [C in DiagnosticCode]: DiagnosticFor<C>
}[DiagnosticCode];
```

`RepositoryArtifactPath` is a branded normalized repository-relative POSIX path selected by the applicable route/path projection, never copied from an ephemeral locator or arbitrary diagnostic producer. It has no empty, dot, or dot-dot component, no backslash, URI scheme, control byte, glob, or path outside the repository. Diagnostic `explanation` passes the exact durable locator-safe tokenizer, and the recorder recursively rejects any raw locator in the complete refusal result before persistence.

Every code is therefore tied to a finite recovery vocabulary. A `WorkflowInterfaceResult` may contain several diagnostics only when all of their `legalNextRouteId` values equal the single selected refusal-recovery route. It cannot pair an arbitrary sentence with an arbitrary state jump. The selected route must also be a reachable `InterfaceRefusalRecoveryRoute` (or the exact retry, typed user-input, or terminal variant) in `workflow-decision.md`.

## Continuity and motion

| Code | Meaning | Legal route |
|---|---|---|
| `BOUNDARY_BRIDGE_MISSING` | An adjacent Beat pair has no unique bridge | MotionSpec semantic revision |
| `SHARED_NODE_NOT_PERSISTENT` | A claimed shared node loses stable identity | MotionSpec/capability revision; never visual-copy fallback |
| `CONTINUITY_ANCHOR_MISSING` | Boundary lacks an honest salient anchor | MotionSpec revision or available justified chapter cut |
| `BRIDGE_REALIZATION_MISMATCH` | Resolved tracks do not perform the declared mechanism | MotionSpec or capability revision |
| `ANCHOR_NOT_SALIENT` | Anchor is too weak to support continuity | MotionSpec revision |
| `TARGET_NOT_PREROLLED` | Real incoming target is not mounted/frozen in time | MotionSpec/capability revision |
| `TRANSITION_ENDPOINT_MISMATCH` | Terminal geometry misses the next stable state | Bounded visual semantic revision |
| `EYE_TRACE_JUMP` | Measured normalized eye trace exceeds the declaration | Bounded revision or reject cut |
| `DEAD_FRAME_DETECTED` | A bridge exposes bare, transparent, or accidental empty picture | Bounded revision; blocks release |
| `CONTENT_STATE_POP` | Content changes without a declared bridge-window transition | MotionSpec revision |
| `CAPABILITY_ROOT_REMOUNTED` | Stable root/subnode identity changed across a bridge | Capability/MotionSpec revision |
| `TRANSFORM_OWNERSHIP_CONFLICT` | Camera/node channels overlap without semantic justification | MotionSpec revision |
| `CAMERA_TELEPORT` | Camera state jumps without a valid bridge | MotionSpec revision |
| `CAMERA_JERK` | Velocity continuity exceeds declared limits | Bounded visual semantic revision |
| `CAMERA_ALWAYS_MOVING` | Decorative travel replaces meaningful holds | Treatment/MotionSpec revision |

## Cut and slide protection

| Code | Meaning | Legal route |
|---|---|---|
| `UNJUSTIFIED_CHAPTER_CUT` | Cut lacks an honest break or required evidence | Revise or remove cut |
| `CHAPTER_CUT_BUDGET_EXCEEDED` | Treatment's 0/1 budget is exceeded | MotionSpec revision |
| `CHAPTER_CUT_V1_LIMIT_EXCEEDED` | Film exceeds the absolute maximum of one | MotionSpec revision; cannot raise ceiling |
| `CONSECUTIVE_CHAPTER_CUTS` | Adjacent cuts create page rhythm | Structural revision |
| `SLIDE_LIKE_CUT_PATTERN` | Weighted visible content/layout repeatedly resets like slides | One structural repair if available, otherwise stop |

## Content, source, and release

- `TEXT_OVERFLOW`: text violates layout, safe-area, glyph, or readable-hold requirements.
- `LOCAL_SOURCE_MISSING`: a declared user-supplied source cannot be verified locally.
- `SOURCE_RIGHTS_UNRESOLVED`: rights or font/license status is inadequate.
- `UNTRUSTED_EMBEDDED_INSTRUCTION`: inspected evidence contains an embedded command/instruction; record only a safe typed summary and ignore/exclude/block it.
- `UNTRUSTED_LINK_OR_PATH_EXPANSION`: evidence attempts to broaden local reads or trigger a link/path action.
- `UNTRUSTED_AUTHORITY_OVERRIDE`: evidence attempts to replace user/repository authority or bypass a gate.
- `UNTRUSTED_UNSUPPORTED_CLAIM`: untrusted evidence proposes a claim without acceptable local support.
- `PARENT_HASH_MISMATCH`: an artifact does not bind its current parent.
- `REVISION_STALE`: the requested patch or derived action targets an old revision.
- `LOCK_CONFLICT`: actual or requested impact touches a semantic lock.
- `IMPACT_SET_MISMATCH`: actual changes fall outside declared impact.
- `GATE_EVIDENCE_MISSING`: QC, either review, approval, preview, or manifest is absent.
- `GATE_EVIDENCE_STALE`: one or more exact dependency bytes/hashes differ from the tuple the gate records. This includes a mismatch under the **same revision** or the **same RenderPlan**; matching lineage names do not cure changed bytes.
- `REPAIR_BUDGET_EXHAUSTED`: one structural or two bounded visual passes have been consumed with a blocker unresolved.
- `AUDIO_RENDER_PLAN_STALE`: AudioBrief/prompt/return/mix does not bind the approved locked picture.
- `MANUAL_AUDIO_DECLARATION_MISSING`: returned audio lacks local path, exact selected prompt-attempt path/hash/content hash, source label, user-declared payoff, or gain.
- `AUDIO_PROMPT_ATTEMPT_MISMATCH`: `ManualAudioReturn@1` does not resolve to and recompute as the selected current prompt attempt, or its locked-picture/AudioBrief binding differs.
- `CATALOG_REGISTRY_INVALID`: the checked-in catalog snapshot resource is absent or fails its closed deterministic registry contract; repair is repository-local and returns to the exact Treatment/MotionSpec origin.
- `PROJECT_POLICY_REQUEST_INVALID`: the attributed policy request has a wrong pause/prior identity, invalid host list, non-human actor, or inferred opt-in; the human must submit a replacement request at the same Preview Gate.
- `RESOLVER_CAPABILITY_UNAVAILABLE`: the committed MotionSpec names an unknown, advisory-only, or otherwise unavailable capability; route through Revision Interpreter and the normal rebuild/capability-gap workflow rather than fabricating a fallback.

## Repair and stop behavior

For `GATE_EVIDENCE_STALE`, compare the complete tuples in `artifact-contracts.md`, not only project/revision/RenderPlan IDs:

- preview evidence binds exact preview bytes/hash and every sampled-frame/scan evidence path/hash;
- Technical QC binds that preview and sampled-evidence bundle plus its own report bytes/hash and pass decision;
- each review binds the same preview, sampled bundle, passing QC, evidence-ref set, producer, decision, and its own review bytes/hash;
- approval binds all of those plus both exact `ship` review hashes, actor attribution, non-empty reason, Project Policy bytes/hash, recorder identity, and approval bytes/hash;
- silent final and the Render Manifest bind and verify the complete approval tuple, silent-master bytes/hash, plan/build identity, and Render Manifest bytes/hash;
- post-lock audio binds the Preview Approval hash and Render Manifest hash plus silent master, AudioBrief, prompt, manual return/declarations, alignment, and mux hashes as applicable; delivery binds the selected current tuple.

Replacing the preview, sampled evidence, QC report, either review, approval, policy, silent master, or Render Manifest without changing the RenderPlan still emits `GATE_EVIDENCE_STALE` and invalidates dependents. Do not “refresh” a parent hash in place; reproduce and re-evaluate the dependent evidence.

The orchestrator counts repair passes cumulatively per stable `repairCycleId`: maximum one structural repair and two bounded visual repairs. The cycle spans every revision/re-preview retry for one user-scoped request and resets only on recorded approval, explicit abandonment, or a genuinely new user-scoped request. A counter increments before its repair route, so failures remain consumed. Reviewers remain read-only; a finding routes through Revision Interpreter. Both bounded and rebuild paths require a SemanticPatch and a new revision. A direct `user-request` cause binds the exact instruction and has no review IDs/cycle; a `review-repair` cause binds the exact original instruction, non-empty current issue IDs, and stable repair cycle for either bounded or rebuild mode. Aggregate reviewer precedence is `rebuild > fix > ship`; incomplete or blocking evidence stops first. After any successful visual patch, old preview, sampled evidence, QC, review, approval, Render Manifest, audio prompt attempt, mux, and delivery evidence becomes stale.

Truth-critical ambiguity, unsupported scope, an unresolved capability gap, stale evidence, an unavailable honest continuity route, any blocking gate, Preview Gate, or the manual music handoff blocks forward release and uses its exact recoverable pause when one exists. An explicit refusal, irrecoverable scope violation, or exhausted repair budget may be terminal; none of these conditions permits fabricated success.
