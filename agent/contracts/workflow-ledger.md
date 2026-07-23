# Workflow Ledger documentation contract

## Boundary and sole writer

This Part 1 contract defines recoverable, single-project local orchestration for separate Codex or Claude Code calls. It implements no runtime, database, queue, server, renderer, CLI, or Remotion engine.

The canonical record is the append-only `projects/<project-id>/.workflow/ledger.jsonl`. The future deterministic `workflow-ledger-recorder` is its sole writer. The orchestrator, roles, reviewers, and all other interfaces have `writes: []` for this file. Each line is one RFC 8785/JCS UTF-8 JSON event followed by exactly one LF. Hashes are raw lowercase 64-hex SHA-256.

Every Ledger and action-result-sidecar filesystem operation is anchored to a trusted repository-root directory descriptor; no pathname is resolved from the process working directory. Initialization walks each existing ancestor with `openat` using directory-only and `O_NOFOLLOW` semantics and creates only the exact missing `.workflow` ancestors with `mkdirat`. The final Ledger is opened relative to the verified parent using no-follow semantics, exclusive creation for first initialization, and append/write access only for the recorder. Immediately after open, `fstat` must prove one regular file with link count one, expected owner/mode, and the same device/inode identity retained for the operation. A symlink, hard link, pre-existing unsafe file, special file, case-fold collision, or replaced ancestor is refusal.

Every read and compare-and-append uses that same opened Ledger inode. The recorder verifies the complete canonical chain and tail/head from the handle, obtains the exclusive project-local append lock, rechecks device/inode, size, and exact tail through the same handle, appends one complete LF-terminated event, calls file `fsync`, then `fsync`s the verified parent directory before publishing success. If the write reports short before the lock is released, the recorder uses `ftruncate` on that same verified inode back to the exact pre-append size and file/directory `fsync`; only a successful verified rollback restores the prior head for an identical retry. After an uncertain write or flush result, reopening under the same anchored protocol has exactly three outcomes: the complete canonical new event and hash chain are present, so its reducer result stands; the file remains byte-for-byte at the prior verified size/head, so the identical action may retry; or any partial suffix/torn event/other size exists, which is terminal Ledger corruption requiring a separately approved migration—never an in-Ledger recovery event. Inode/ancestor replacement, stale head, lock loss, failed rollback, or unclassifiable flush state also refuses/terminates according to that rule. The recorder never opens a second pathname between check and append and never truncates a suffix discovered after releasing the original append lock. Each immutable action-result sidecar uses the same anchored walk and final `openat` with `O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW`, followed by `fstat` proving a regular file with link count one, complete write, file `fsync`, parent-directory `fsync`, close, and anchored no-follow reload before its receipt can be referenced.

Host-native locators are ephemeral even when the user writes one inside an instruction. Durable instruction provenance uses this branded value:

```ts
type DurableLocatorSafeText = string & {readonly __durableLocatorSafeText: unique symbol};
type DurableInstructionText = DurableLocatorSafeText & {readonly __durableInstructionText: unique symbol};
type HumanActorId = string & {readonly __humanActorId: unique symbol};
type RequestId = string & {readonly __requestId: unique symbol};
type ActionId = string & {readonly __actionId: unique symbol};
type PauseId = string & {readonly __pauseId: unique symbol};
```

The recorder derives `DurableLocatorSafeText` deterministically before append; `DurableInstructionText` is the instruction-specific subtype. Starting from exact UTF-8 bytes, it scans left-to-right and first replaces every exact supplied locator with its stable token `[[locator:<locatorId>]]`. Exact supplied locators always match, even if their spelling would otherwise look like ordinary prose. At each byte offset the longest matching locator wins, equal byte lengths break by ascending locator ID, and matches never overlap.

The second pass scans maximal tokens separated by the exact delimiter set: bytes `0x00` through `0x20`, double quote, single quote, opening/closing parentheses, angle brackets, square brackets, braces, comma, and semicolon. A remaining token is a locator only with a **strong locator prefix**: `/`, `./`, `../`, `~/`, `.\`, `..\`, `~\`, a UNC prefix of two slashes or two backslashes, or an ASCII drive letter plus colon and a slash/backslash separator. Two closed Windows exceptions are also locators: a drive-relative form such as `C:foo`, and a case-insensitive reserved device basename `CON`, `PRN`, `AUX`, `NUL`, `COM1` through `COM9`, or `LPT1` through `LPT9`, optionally followed by a dot suffix. A URI is recognized only as an ASCII `scheme://` form or one of the closed `file:` and `data:` forms. An incidental internal slash or bare colon is not enough: ordinary slash prose such as `UI/UX` and `24/7`, and ordinary colon prose such as `CTA:`, are preserved byte-exact. Each recognized locator token becomes `[[redacted-locator:<first-occurrence-ordinal>]]`; an identical token reuses its first ordinal. This is the complete lexical grammar and implementations may not add path heuristics.

The third pass redacts credentials before computing any hash that may be written durably, before any append, and before any file projection. Its scanner is exact and deterministic:

- A PEM credential is one complete block beginning with `-----BEGIN ` plus exactly one of `PRIVATE KEY`, `RSA PRIVATE KEY`, `EC PRIVATE KEY`, `DSA PRIVATE KEY`, `OPENSSH PRIVATE KEY`, or `ENCRYPTED PRIVATE KEY`, followed by `-----`, and ending with the byte-identical label in `-----END <label>-----`. Thus literal begin markers include `-----BEGIN PRIVATE KEY-----` and `-----BEGIN OPENSSH PRIVATE KEY-----`. LF and CRLF bodies are accepted; the complete block is at most 65,536 bytes. The whole block is one secret match. A recognized begin marker without its matching bounded end marker refuses the input before hashing rather than persisting a partial block.
- An authorization credential is the maximal non-whitespace ASCII token immediately following a case-insensitive scheme plus one or more ASCII spaces. `Bearer` accepts exactly 1–512 bytes; `Basic` accepts exactly 1–512 bytes. No other authorization scheme is recognized by this class.
- A labeled credential key is an optionally single- or double-quoted 1–64-byte ASCII identifier beginning with a letter or underscore and continuing with letters, digits, underscore, or hyphen. Normalize it by ASCII-lowercasing and removing underscore/hyphen. It matches exactly `apikey`, `accesskey`, `accesstoken`, `authtoken`, `clientsecret`, `privatekey`, `token`, `secret`, `password`, `passwd`, or `pwd`; the original unnormalized name also matches when it ends case-insensitively in `_KEY`, `_TOKEN`, or `_PASSWORD`. After optional ASCII space/tab, the separator is exactly one `=` or `:`, then optional space/tab. Its value is either a matching quote-delimited 1–512-byte printable-ASCII string or one unquoted 1–512-byte token composed only of ASCII letters, digits, dot, underscore, tilde, plus, slash, equals, percent, at, colon, or hyphen and ending before whitespace, comma, semicolon, `}`, or `]`. This covers environment, JSON, YAML, and ordinary assignment forms without treating an unlabeled colon as secret syntax.
- A CLI credential flag is exactly `--api-key`, `--access-key`, `--access-token`, `--auth-token`, `--client-secret`, `--private-key`, `--token`, `--secret`, `--password`, `--passwd`, or `--pwd`, case-insensitive. It is followed by either one equals sign or one or more ASCII spaces, then the same 1–512-byte quoted/unquoted value grammar. A missing or empty value is not silently accepted as a credential-bearing instruction; it is ordinary incomplete prose.
- A prefixed token is `sk-`, `sk_live_`, `sk_test_`, `github_pat_`, `xoxb-`, `xoxp-`, `xoxa-`, `xoxr-`, or `xoxs-`, followed by 1–256 ASCII letters, digits, underscores, or hyphens; or `AKIA` followed by exactly sixteen upper-case ASCII letters or digits.
- A generic secret token is exactly 32–256 ASCII letters, digits, underscores, or hyphens and contains at least one upper-case letter, one lower-case letter, and one digit. This is a closed character-and-length rule, not an entropy estimate.

Scan left-to-right; at the same byte offset choose PEM, authorization, labeled assignment, CLI flag, provider prefix, then generic token, and within one class choose the longest match. Redact the complete PEM block and otherwise only the credential value, preserving its non-secret label/separator. Each credential value becomes `[[redacted-secret:<ordinal>]]`, with identical secret bytes reusing the first ordinal. The complete transform is idempotent: applying it to already projected text produces identical bytes and never renumbers existing valid tokens. It operates on raw free-text candidates before they can be promoted to closed IDs; already validated hashes and recorder-owned IDs are never rescanned. An incidental credential produces a sanitized same-state `needs-user` warning to rotate and resubmit it. A request for credential or API-key architecture is sanitized first and then produces `out-of-scope` with `CREDENTIAL_OR_API_KEY_ARCHITECTURE`; it never retains credential bytes or a hash of the raw envelope in the `STOP` reason.

All bytes outside recognized locator and secret tokens remain exact. After projection, the recorder rejects surviving exact envelope locator bytes, exact secret bytes, any token matching the strong locator grammar, an unknown redaction token, or a locator token whose ID is absent from separately accepted ingress evidence. The same transformation applies to the initial request, later user answers, rights declarations, labels, reasons, revision causes, preview changes, role blocked/advisory prose, trust findings, pause/terminal prose, and diagnostics. Exact secret bytes never reach the Ledger, a result sidecar, artifact, receipt, review, diagnostic, or derived manifest.

Before any Ledger event, result sidecar, candidate, receipt, review, diagnostic, or derived manifest is canonicalized, every string value must be one of: a closed enum; a grammar-validated ID/hash; a schema-projected normalized repository-relative path; or `DurableLocatorSafeText`. A recursive final check rejects exact ephemeral locator or secret bytes anywhere in the output, including fields whose illustrative schema still aliases a closed string subtype. No producer may copy a raw locator or credential into a summary, filename, source label, rights field, reason, explanation, or blocking message.

`HumanActorId` is 1–64 lowercase ASCII characters: the first and last are alphanumeric, and interior characters are alphanumeric, dot, underscore, or hyphen. It is not free-form provenance and cannot contain a slash, backslash, URI delimiter, whitespace, or control byte. Every persisted human-authored statement, label, or reason uses `DurableLocatorSafeText` (or its instruction subtype) and therefore inherits the same locator-tokenization rule.

Recorder-owned IDs are never accepted from model output. Within one project they are monotonically allocated ASCII ordinals with no gaps on successful append: `request-0001`, `action-0001`, `pause-0001`, `repair-0001`, `candidate-0001`, `revision-attempt-0001`, `review-attempt-0001`, and `rev-0001`; widths grow beyond four digits without truncation. `RequestId`, `ActionId`, and `PauseId` are branded forms of those exact families. Every occurrence used in a repository path is revalidated before composition. Caller/model-selected suffixes, separators, traversal, alternate spelling, or reuse are invalid.

## Mutually exclusive workflow control

The checkpoint cannot be ready, running, candidate-ready, refusal-ready, paused, and terminal at the same time.

```ts
type PendingArtifactForRoute<R extends ArtifactRouteId> = {
  candidate: ArtifactCandidateForRoute<R>;
  candidateByteHash: Sha256;
  candidateByteLength: number;
  producerState: AcceptanceProducerStateFor<R>;
  producerCorrelation: CandidateProducerCorrelationFor<R>;
  producerDecisionHash: Sha256;
  producerResultReceiptHash: Sha256;
  promptBinding: {promptPath: string; promptHash: Sha256} | null;
};

type PendingArtifact = {
  [R in ArtifactRouteId]: PendingArtifactForRoute<R>
}[ArtifactRouteId];

type PendingRoleActionFor<R extends RoleDelegationRoute> = {
  kind: "role";
  actionId: ActionId;
  decisionEventHash: Sha256;
  originState: R["fromState"];
  executionState: R["toState"];
  role: R["delegatedRole"];
  roleRouteId: R["roleRouteId"];
  allowedAcceptanceRouteIds: R["allowedAcceptanceRouteIds"];
  invocationInput: ActionInvocationInputFor<R>;
  inputBindingHash: Sha256;
  resultRouteId: R["resultRouteId"];
  promptBinding: {promptPath: string; promptHash: Sha256};
};

type PendingRoleAction = RoleDelegationRoute extends infer R
  ? R extends RoleDelegationRoute ? PendingRoleActionFor<R> : never
  : never;

type PendingNormalInterfaceActionFor<R extends NormalInterfaceInvocationRoute> = {
  kind: "interface";
  actionId: ActionId;
  decisionEventHash: Sha256;
  originState: R["fromState"];
  executionState: InterfaceExecutionStateFor<R>;
  interfaceId: R["interfaceId"];
  invocationInput: ActionInvocationInputFor<R>;
  inputBindingHash: Sha256;
  resultRouteId: ResultRouteIdFor<R>;
  promptBinding: null;
  artifact: R extends ArtifactAcceptanceInvocationRoute
    ? PendingArtifactForRoute<R["acceptanceRouteId"]>
    : null;
};

type PendingNormalInterfaceAction = NormalInterfaceInvocationRoute extends infer R
  ? R extends NormalInterfaceInvocationRoute ? PendingNormalInterfaceActionFor<R> : never
  : never;

type PendingNormalAction = PendingRoleAction | PendingNormalInterfaceAction;

type PendingNormalActionForExecutionState<S extends NormalActionExecutionState> =
  Extract<PendingNormalAction, {executionState: S}>;

type PendingReconciliationActionFor<R extends ReconciliationInvocationRoute> = {
  kind: "interface";
  actionId: ActionId;
  decisionEventHash: Sha256;
  originState: R["fromState"];
  executionState: R["fromState"];
  interfaceId: "action-result-reconciliation";
  invocationInput: ReconciliationActionInvocationInputFor<R>;
  inputBindingHash: Sha256;
  resultRouteId: "interface.action-result-reconciliation.result";
  promptBinding: null;
  originalAction: PendingNormalActionForExecutionState<R["fromState"]>;
};

type PendingReconciliationAction = ReconciliationInvocationRoute extends infer R
  ? R extends ReconciliationInvocationRoute ? PendingReconciliationActionFor<R> : never
  : never;

type PendingInterfaceAction = PendingNormalInterfaceAction | PendingReconciliationAction;

type PendingAction = PendingNormalAction | PendingReconciliationAction;

type PendingCandidateRejectionActionFor<R extends CandidateRejectionRecoveryRoute> =
  Omit<
    PendingNormalInterfaceActionFor<Extract<NormalInterfaceRouteForRecovery<R>, ArtifactAcceptanceInvocationRoute>>,
    "artifact"
  > & {
    artifact: Omit<PendingArtifactForRoute<R["acceptanceRouteId"]>, "producerCorrelation"> & {
      producerCorrelation: R["producerCorrelation"];
    };
  };

type PendingInterfaceActionForRecovery<R extends InterfaceRefusalRecoveryRoute> =
  R extends CandidateRejectionRecoveryRoute
    ? PendingCandidateRejectionActionFor<R>
    : R["interfaceId"] extends "action-result-reconciliation"
      ? PendingReconciliationActionFor<Extract<ReconciliationInvocationRoute, {fromState: R["fromState"]}>>
      : PendingNormalInterfaceActionFor<NormalInterfaceRouteForRecovery<R>>;

type PendingInterfaceRefusalFor<R extends InterfaceRefusalRecoveryRoute> = {
  originalAction: PendingInterfaceActionForRecovery<R>;
  actionId: PendingInterfaceActionForRecovery<R>["actionId"];
  interfaceId: R["interfaceId"];
  originState: R["fromState"];
  inputBindingHash: PendingInterfaceActionForRecovery<R>["inputBindingHash"];
  resultRouteId: ResultRouteIdForRecovery<R>;
  resultReceiptHash: Sha256;
  recovery: R;
};

type PendingInterfaceRefusal = InterfaceRefusalRecoveryRoute extends infer R
  ? R extends InterfaceRefusalRecoveryRoute ? PendingInterfaceRefusalFor<R> : never
  : never;

type RunningControl = PendingAction extends infer A
  ? A extends PendingAction ? {kind: "running"; state: A["executionState"]; action: A} : never
  : never;

type CandidateReadyControl = PendingArtifact extends infer P
  ? P extends PendingArtifact ? {kind: "candidate-ready"; state: P["producerState"]; pendingArtifact: P} : never
  : never;

type RefusalReadyControl = InterfaceRefusalRecoveryRoute extends infer R
  ? R extends InterfaceRefusalRecoveryRoute ? {kind: "refusal-ready"; state: R["fromState"]; refusal: PendingInterfaceRefusalFor<R>} : never
  : never;

type PausedControl = WorkflowPause extends infer P
  ? P extends WorkflowPause ? {kind: "paused"; state: P["state"]; pause: P} : never
  : never;

type TerminalOutcome =
  | {kind: "completed"; requestId: string; deliveryManifestHash: string}
  | {kind: "abandoned"; requestId: string; actor: {type: "human"; id: HumanActorId}; reason: DurableInstructionText}
  | {kind: "blocked"; requestId: RequestId; interfaceId: WorkflowInterfaceId | null; blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]]}
  | {kind: "out-of-scope"; requestId: RequestId; outOfScopeCodes: [OutOfScopeCode, ...OutOfScopeCode[]]; blockingReasons: [DurableLocatorSafeText, ...DurableLocatorSafeText[]]};

type TerminalControl =
  | {kind: "terminal"; state: "COMPLETE"; outcome: Extract<TerminalOutcome, {kind: "completed"}>}
  | {kind: "terminal"; state: "STOP"; outcome: Exclude<TerminalOutcome, {kind: "completed"}>};

type WorkflowControl =
  | {kind: "ready"; state: ResumableState}
  | RunningControl
  | CandidateReadyControl
  | RefusalReadyControl
  | PausedControl
  | TerminalControl;
```

Every distributed member of `PausedControl` has the structural inspection projection `{kind: "paused"; state: WorkflowPause["state"]; pause: WorkflowPause}`. That wider projection is descriptive only and is not a constructible control type; the actual union retains the correlation between each pause payload and its exact state.

When a role reports `written`, the recorder first requires its `roleRouteId`, literal `resultRouteId`, role, and candidate route to equal the pending role action. In particular, the candidate's `acceptanceRouteId` must be a member of that action's exact `allowedAcceptanceRouteIds`; a mismatch is refused before any control transition. It then reloads the candidate path, computes `candidateByteHash` and length, derives `producerCorrelation` from the complete pending role action's route and exact `capabilityGapRoute`, and atomically places the exact immutable `PendingArtifact` in the same `role-result-recorded` event. Candidate-producing interfaces do the same from their complete pending interface action, including origin state or exact initial/rebuild planning context and route binding. The candidate/model cannot supply or alter this correlation. There is no follow-up candidate event that can become orphaned. This mechanical capture is not semantic acceptance. The acceptance interface later reloads the same path and refuses if its byte hash or length changed. This closes the role-route cross-product, honest-approximation lineage, and write/result/acceptance time-of-check gaps.

## Checkpoint, source update, and revision attempt

```ts
type RequestClass = "new-project" | "visual-revision" | "review-retry" | "audio-request" | "delivery-retry";

type ActiveRequest = {
  requestId: string;
  requestClass: RequestClass;
  trustedHostId: HostId;
  sourceUserInstruction: DurableInstructionText;
  invocationEnvelopeHash: Sha256;
  suppliedLocatorSetHash: Sha256 | null;
  invocationEventHash: string;
  repairCycleId: string;
  structuralRepairCount: number;
  visualRepairCount: number;
};

type CurrentProjectPolicyIdentity = {
  path: string;
  contentHash: string;
  acceptanceHash: string;
  acceptanceResultReceiptHash: string;
};

type StagedSourceUpdate = {
  baseRevisionId: string;
  localAssetManifestPath: string | null;
  localAssetManifestHash: string | null;
  researchFindingsPath: string | null;
  researchFindingsHash: string | null;
};

type AcceptedRevisionCandidate = {
  artifactKind: "brief" | "treatment" | "motion-spec";
  artifactPath: string;
  contentHash: string;
  acceptanceHash: string;
  acceptanceResultReceiptHash: string;
};

type ActiveRevisionAttempt =
  | {
      kind: "bounded";
      revisionAttemptId: string;
      proposedRevisionId: string;
      semanticPatchPath: string;
      semanticPatchHash: string;
      baseRevisionId: string;
      stage: "apply" | "validate";
      structuralCountAlreadyCharged: false;
    }
  | {
      kind: "structural-rebuild";
      revisionAttemptId: string;
      proposedRevisionId: string;
      semanticPatchPath: string;
      semanticPatchHash: string;
      baseRevisionId: string;
      rebuildFrom: "brief" | "treatment" | "motion-spec";
      stage: "brief" | "treatment" | "motion-spec" | "validate" | "commit";
      acceptedCandidates: AcceptedRevisionCandidate[];
      structuralCountAlreadyCharged: true;
    };

type WorkflowCheckpoint = {
  control: WorkflowControl;
  currentRevisionId: string | null;
  currentProjectPolicy: CurrentProjectPolicyIdentity | null;
  sourceHashes: {
    revisionManifestHash: string | null;
    localAssetManifestHash: string | null;
    researchFindingsHash: string | null;
    briefHash: string | null;
    treatmentHash: string | null;
    motionSpecHash: string | null;
  };
  sourcePaths: {
    localAssetManifestPath: string | null;
    researchFindingsPath: string | null;
    briefPath: string | null;
    treatmentPath: string | null;
    motionSpecPath: string | null;
  };
  lockSetHash: string | null;
  lineageHashes: {
    renderPlanHash: string | null;
    previewHash: string | null;
    sampledEvidenceManifestHash: string | null;
    technicalQcHash: string | null;
    creativeReviewHash: string | null;
    motionReviewHash: string | null;
    previewApprovalHash: string | null;
    silentMasterHash: string | null;
    renderManifestHash: string | null;
    audioBriefHash: string | null;
    promptAttemptHash: string | null;
    manualAudioReturnHash: string | null;
    alignmentManifestHash: string | null;
    muxManifestHash: string | null;
    mixedMasterHash: string | null;
    deliveryManifestHash: string | null;
  };
  activeRequest: ActiveRequest | null;
  stagedSourceUpdate: StagedSourceUpdate | null;
  activeRevisionAttempt: ActiveRevisionAttempt | null;
  activeCapabilityGap: {
    gapPath: string;
    gapContentHash: string;
    originPlanningContext: OriginPlanningContext;
    routeDecisionHash: string | null;
    advisoryResultReceiptHash: string | null;
    implementationAuthorizationHash: string | null;
    implementationBindingHash: string | null;
  } | null;
  invalidatedContentHashes: string[];
};

type AudioLineageInvalidationRule =
  | {
      trigger: "begin-audio-request";
      clears: ["audioBriefHash", "promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "accept-audio-brief";
      clears: ["audioBriefHash", "promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "generate-prompt-attempt";
      clears: ["promptAttemptHash", "manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "accept-manual-audio-return";
      clears: ["manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "complete-local-mux";
      clears: ["alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "recover-manual-audio-reselect";
      clears: ["manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "begin-delivery-retry-manual-wait";
      clears: ["manualAudioReturnHash", "alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "begin-delivery-retry-mux";
      clears: ["alignmentManifestHash", "muxManifestHash", "mixedMasterHash", "deliveryManifestHash"];
    }
  | {
      trigger: "begin-delivery-retry-delivery";
      clears: ["deliveryManifestHash"];
    };
```

During a structural rebuild, `currentRevisionId`, current `sourceHashes`, `sourcePaths`, and `lockSetHash` must not change before the `commit` performed by `semantic-revision-apply`. Accepted owner candidates live only in `activeRevisionAttempt.acceptedCandidates`. A failed candidate, validation, pause, or commit leaves the prior revision fully reloadable.

The structural owner cascade is mechanically derived from `rebuildFrom`:

```text
brief       → brief → treatment → motion-spec → validate → commit
treatment   → treatment → motion-spec → validate → commit
motion-spec → motion-spec → validate → commit
```

The recorder rejects skipped, repeated, or out-of-order owner stages. Each accepted rebuilt Treatment binds the accepted rebuilt/current Brief identity; each rebuilt MotionSpec binds the accepted rebuilt/current Brief and Treatment identities.

An accepted project-policy candidate atomically updates `currentProjectPolicy` inside the matching `interface-result-recorded` event with the immutable candidate path, accepted content hash, external acceptance hash, and acceptance interface `resultReceiptHash`, then returns to `PREVIEW_GATE`. Its `previousProjectPolicyHash` parent must equal the prior identity's `contentHash`, or `null` only when the checkpoint has no accepted policy. The effective implicit human-only policy is derived when this field is null; it is not stored as a fabricated accepted artifact.

Every `AudioLineageInvalidationRule` is an exact reducer rule, not advisory cleanup. Beginning an `audio-request` from `COMPLETE` or `STOP` first verifies the current locked-picture tuple, then atomically nulls the complete listed audio/delivery suffix before entering `AUDIO_BRIEF`. Acceptance of a replacement AudioBrief clears the listed suffix including the old head, then sets only the new `audioBriefHash`. Audio-prompt success does the same for `promptAttemptHash`; manual-audio ingress does the same for `manualAudioReturnHash`; mux success clears its prior alignment/mux/mixed heads plus delivery, then sets its three new hashes. A `manual-audio-reselect` recovery from `OPTIONAL_LOCAL_MUX` or `DELIVERY` applies `recover-manual-audio-reselect` before `WAITING_FOR_MANUAL_MUSIC`, so either a replacement track or no-track selection starts from a null manual-through-delivery suffix. A delivery retry entering manual wait, mux, or delivery applies its target-specific tuple before that state becomes ready.

Each reducer appends every previously non-null superseded identity to `invalidatedContentHashes` in the tuple's declared order, preserving only the first occurrence, in the same atomic event. A replaced head is superseded and recorded just like its descendants; if an incoming replacement has exactly the same content identity, that identity is not added as invalidated while it remains the current head. Immutable historical files remain but are no longer current authority.

Consequently, a mixed delivery followed by a new `audio-request` can later select no track: the no-track delivery precondition requires `manualAudioReturnHash`, `alignmentManifestHash`, `muxManifestHash`, and `mixedMasterHash` all to be null, while the newly accepted AudioBrief and generated prompt attempt must be current. A stale manual return is not one of the “three mux hashes” and is never allowed to survive as hidden authority. Failure or pause before a replacement-producing success leaves the already-cleared fields null; it cannot restore superseded lineage from filenames or old events.

An accepted `initial-local-assets` candidate updates current `sourcePaths.localAssetManifestPath` and `sourceHashes.localAssetManifestHash` before `FACT_CHECK`. An accepted `source-update-local-assets` candidate updates only `stagedSourceUpdate.localAssetManifestPath` and `.localAssetManifestHash`; the committed current revision/source identity remains unchanged until semantic revision apply. Both reducers require the context selected by the producing ingress origin state.

An accepted `initial-capability-gap` or `rebuild-capability-gap` atomically initializes `activeCapabilityGap` with the exact gap path/hash and the gap payload's matching initial/rebuild `originPlanningContext`. That context remains unchanged through the route pause/decision, advisory, implementation wait, authorization, implementation result, receipt candidate, and receipt acceptance. `initial-capability-receipt` clears the active gap and returns to `MOTION_SPEC`; `rebuild-capability-receipt` clears it and returns to the still-active `REBUILD_AUTHORING` motion-spec stage.

An honest-approximation MotionSpec candidate retains the full human-selected route in `PendingArtifact.producerCorrelation`. Its acceptance success requires byte equality between that correlation's `capabilityGapRoute`, the recorded route decision, and `activeCapabilityGap`, then atomically clears `activeCapabilityGap` before taking the MotionSpec context's `VALIDATE` continuation. An ordinary `initial-motion-planning` or `rebuild-motion-planning` MotionSpec candidate is accepted only when `activeCapabilityGap` is null. Rejection never clears the gap: the rejected honest initial/rebuild candidate returns to `CAPABILITY_GAP` with the exact route/context intact and may invoke only its same mapped honest-approximation role; a rejected ordinary candidate returns to `MOTION_SPEC` or `REBUILD_AUTHORING`. A context mismatch never falls back to the initial or ordinary route.

## Immutable revision and lock artifacts

The initial snapshotter and semantic revision applier write exact RFC 8785 bytes at:

- `projects/<project-id>/revisions/<revision-id>/revision.manifest.json`
- `projects/<project-id>/revisions/<revision-id>/locks.json`

```ts
type RevisionSourceRef = {path: string; contentHash: string};

type RevisionManifest = {
  schemaVersion: "revision-manifest@1";
  projectId: string;
  revisionId: string;
  previousRevisionId: string | null;
  createdBy:
    | {kind: "initial-snapshot"}
    | {kind: "bounded-patch"; semanticPatchHash: string}
    | {kind: "structural-rebuild"; semanticPatchHash: string; ownerAcceptanceHashes: [string, ...string[]]};
  sources: {
    localAssetManifest: RevisionSourceRef | null;
    researchFindings: RevisionSourceRef | null;
    brief: RevisionSourceRef;
    treatment: RevisionSourceRef;
    motionSpec: RevisionSourceRef;
  };
  lockSetHash: string;
  invalidatedContentHashes: string[];
};

type LockSetArtifact = {
  schemaVersion: "lock-set@1";
  projectId: string;
  revisionId: string;
  locks: SemanticLockTarget[];
};
```

`SemanticLockTarget` is the exact closed union in `revision-contract.md`. Targets use unique canonical keys in ascending canonical-key order. Neither file contains its own hash. The manifest hash and lock-set hash are external identities. Initial snapshot is legal exactly once with `previousRevisionId:null`; every later revision binds the immediately current revision and accepted SemanticPatch. A structural manifest additionally binds the ordered external `artifactAcceptanceHash` values for its owner candidates.

All role-authored candidates are immutable request/attempt files, not overwrites of current source:

```text
projects/<project-id>/.workflow/candidates/<request-id>/<candidate-attempt-id>/...
projects/<project-id>/.workflow/candidates/<revision-attempt-id>/<candidate-attempt-id>/...
```

The current revision manifest retains exact source paths and hashes, so old bytes remain verifiable.

## Closed Ledger events

```ts
type LedgerEventBindingProjection<K extends string, P> = {
  schemaVersion: "workflow-ledger-event@1";
  sequence: number;
  projectId: string;
  requestId: string;
  previousEventHash: string | null;
  eventKind: K;
  payload: P;
};

type LedgerEvent<K extends string, P> = LedgerEventBindingProjection<K, P> & {
  eventBindingHash: string;
  stateAfter: WorkflowCheckpoint;
  eventHash: string;
};

type ProjectInitializedPayload = {requestedProjectId: string | null; allocatedProjectId: string};
type InvocationReceivedPayload = {
  requestClass: RequestClass;
  trustedHostId: HostId;
  sourceUserInstruction: DurableInstructionText;
  suppliedLocalPathCount: number;
  suppliedLocatorSetHash: Sha256 | null;
  invocationEnvelopeHash: Sha256;
};
type DecisionRecordedPayload = {decision: WorkflowDecision};
type CandidateByteCapture = {candidateByteHash: string; candidateByteLength: number};
type RoleResultRecordedPayload =
  | {actionId: ActionId; inputBindingHash: string; result: Extract<RoleResult, {status: "written"}>; candidateCapture: CandidateByteCapture; resultReceiptHash: string}
  | {actionId: ActionId; inputBindingHash: string; result: Exclude<RoleResult, {status: "written"}>; candidateCapture: null; resultReceiptHash: string};
type InterfaceResultRecordedPayload = {actionId: ActionId; result: WorkflowInterfaceResult};
type OperatorInputRecordedPayload = {
  pauseId: PauseId | null;
  operatorEnvelopeHash: Sha256 | null;
  input: RecordedWorkflowOperatorInput;
};
type WorkflowLedgerEvent =
  | LedgerEvent<"project-initialized", ProjectInitializedPayload>
  | LedgerEvent<"invocation-received", InvocationReceivedPayload>
  | LedgerEvent<"decision-recorded", DecisionRecordedPayload>
  | LedgerEvent<"role-result-recorded", RoleResultRecordedPayload>
  | LedgerEvent<"interface-result-recorded", InterfaceResultRecordedPayload>
  | LedgerEvent<"operator-input-recorded", OperatorInputRecordedPayload>;
```

`WorkflowInterfaceResult` is the closed success/refusal envelope in `engine-interface.md`. A role `resultReceiptHash` is SHA-256 over the JCS bytes of its complete `RoleResultRecordedPayload` projection with only `resultReceiptHash` omitted; it therefore binds the action/input, exact RoleResult, and written candidate capture without referring to the enclosing event. `sequence` starts at 1 and increases by exactly one.

`eventBindingHash` is SHA-256 of the RFC 8785/JCS bytes of the exact `LedgerEventBindingProjection`: it includes the immutable header, prior chain hash, kind, and complete payload, and the projection deliberately omits `stateAfter`, `eventBindingHash`, and `eventHash`. The reducer computes that binding first, then derives `stateAfter`. The legacy-named `ActiveRequest.invocationEventHash` equals the matching `eventBindingHash` of `invocation-received`, and every pending action `decisionEventHash` equals the matching `eventBindingHash` of `decision-recorded`. These fields never equal their enclosing event's chain `eventHash`.

Capability advisory lineage deliberately uses `activeCapabilityGap.advisoryResultReceiptHash`, not a result-event hash. It equals the verified `RoleResultRecordedPayload.resultReceiptHash` of the exact advisory outcome. A normal `role-result-recorded` reducer and a reconciliation `matching-result-found` reducer both copy that same stable receipt identity while applying the identical recovered original result. The recorder requires the receipt to bind the pending advisory action/input/route, exact `ProjectLocalCapabilityProposal<C>`, current gap path/hash, recorded `future-project-local-proposal` route decision, and same origin context before entering `WAITING_FOR_CAPABILITY_IMPLEMENTATION`. Recovery never depends on an event that a pre-append crash prevented from existing.

After `stateAfter` is derived, `eventHash` is SHA-256 over the complete event projection with only `eventHash` omitted; it therefore includes `eventBindingHash` and the complete derived checkpoint. Every later `previousEventHash` equals the immediately prior chain hash. This two-stage projection is non-self-referential and requires no fixed point: state may bind the event's pre-state binding identity while the final chain hash binds that state.

`stateAfter` is not caller authority. The recorder runs the deterministic reducer over the verified previous checkpoint plus the typed event, derives the one legal next checkpoint, and requires the stored bytes to match. It must not trust or accept a caller-supplied alternative `stateAfter`. It refuses a broken chain, stale compare-and-append head, invalid transition, altered candidate, invalid reducer result, repeated sequence, or non-canonical bytes.

A `decision-recorded` event containing the exact `PauseDecision` or `NeedsUserDecision` is the sole atomic pause reducer. Its reducer derives `PausedControl` from that decision's embedded typed pause; no separate pause event exists and an operator-input event never silently creates a pause.

## One decision, one atomic result, and crash recovery

Every normal role/interface decision binds the current Ledger head and is recorded before execution. The reducer recomputes SHA-256 over the JCS `ActionInvocationInputFor<Route>`, requires the decision's `inputBindingHash`, and moves `ready → running` with the exact action ID, typed input, literal result route, route correlation, allowed candidate routes, and prompt binding. Exactly one matching result event may consume that running action:

- `role-result-recorded` with `written` atomically verifies/captures candidate bytes and moves to `candidate-ready`; `blocked` returns control to its recorded origin for a typed orchestrator decision; `advisory` takes only its recorded advisory route.
- `interface-result-recorded` with candidate-producing success atomically captures the candidate and moves to `candidate-ready`; acceptance success embeds the exact `ArtifactAcceptance` and atomically applies its context continuation; every other success applies its sole declared continuation. Delivery-packager success also derives the sole completed `TerminalOutcome` from the active request and exact `deliveryManifestHash` in that same event—there is no second completion event.
- `interface-result-recorded` with refusal atomically moves to `refusal-ready` with the exact correlated recovery and the complete original `PendingInterfaceAction`. For acceptance, that action itself contains the immutable pending artifact. It does not take the success edge.

There is no separate candidate or acceptance event. The recorder rejects an orphan result with no matching running action, a role result for an interface action (or vice versa), mismatched action/input/result route/prompt binding, a second or duplicate result after control has left `running`, or a success whose candidate/acceptance/output/state correlation is wrong. This makes the result and its checkpoint transition one compare-and-append transaction; no second action may start while control is `running`.

A successful `local-alignment-mux` result verifies and writes `alignmentManifestHash`, `muxManifestHash`, and `mixedMasterHash` into the checkpoint atomically. The later `delivery-packager` reloads and binds that exact `mixedMasterHash` when audio is provided; the no-track branch instead binds the locked `silentMasterHash` and requires `manualAudioReturnHash`, `alignmentManifestHash`, `muxManifestHash`, and `mixedMasterHash` all to be null. Delivery may not infer a master from a filename or mux manifest summary.

From `refusal-ready`, exactly one of four head-bound actions is legal: a `retry-refused-interface` decision when the stored route is `retry-same-action`; a state-matched `NeedsUserDecision` when it is `request-user-input`; a matching `recover-interface-refusal` decision for a repair route; or terminal `blocked` for `terminal-refusal`. The retry decision must repeat the stored refused action/result-receipt/input/result-route identity. Its reducer restores the exact stored `PendingInterfaceAction` to `running` with the same action ID, decision event, typed input, input hash, literal result route, execution state, and embedded acceptance artifact when applicable; it does not allocate a new action or decision-owned input. A candidate-owner repair is constructible only when the recovery route's `producerCorrelation` equals the complete embedded `PendingArtifact.producerCorrelation`; it invalidates that candidate hash before returning to the producer-specific recorded owner/context. Thus an ordinary MotionSpec refusal cannot select the honest-approximation recovery, and the honest branch cannot escape its retained active gap through the ordinary route. Any other decision, stale refusal receipt, or attempt to edit/reuse rejected bytes is refused.

If the process stops with a running action, re-entry never assumes success and never launches an unrelated action. The first head-bound decision may only place that exact `PendingAction` into an `action-recovery` pause; it cannot replace or clear it. After the matching `ActionRecoveryRequest` is recorded, an ordinary pending action (role or a non-reconciliation interface) may invoke one separately recorded `action-result-reconciliation`. The complete action necessarily preserves the same decision hash, action ID, input-binding hash, and literal result route. Both its typed invocation input and its checkpoint copy the complete immutable `PendingNormalAction`, not a hand-picked identifier subset:

1. If the recorder's immutable action-result sidecar exists and its full envelope/action/input/route hashes match, the reconciliation result binds that sidecar and the reducer atomically applies the recovered original result exactly once.
2. If no sidecar or side effect exists and the original action is declared retry-safe, the reconciliation result binds an absence proof plus that complete original action and authorizes only its byte-identical restoration.
3. If a side effect exists without a complete matching result envelope, or the outcome cannot be reconciled safely, the interface refuses into a same-state recovery pause or terminal ambiguity diagnostic; it never guesses.

Before appending any ordinary role/interface result, the future recorder writes one immutable canonical sidecar at `projects/<project-id>/.workflow/action-results/<action-id>/<result-receipt-hash>.json`; the sidecar contains the complete typed result payload and candidate capture when applicable. It then compare-and-appends the one Ledger result event. A crash before the sidecar exists proves only that no durable result envelope exists—not that an external side effect is absent. A crash after the sidecar but before the event is reconcilable. A duplicate sidecar with different bytes, multiple receipts for one action, or a side effect without the receipt is ambiguous and never replay-safe.

`action-result-reconciliation` is the sole sidecar exception. It is read-only and retry-idempotent, and its own result is compare-and-appended directly without a pre-result sidecar. If it crashes before that append, the Ledger still names the same reconciliation action as running. The exact `action-recovery` pause retains it; when the pending action is itself `action-result-reconciliation`, recording its matching `ActionRecoveryRequest` is the one resume-input exception that atomically restores that identical `PendingInterfaceAction` to `running`, after which the host re-executes the already recorded action with the same action/decision/input/route IDs. No new WorkflowDecision is recorded for that restoration. For an ordinary pending action the same input does not restore it; it enables the separately recorded reconciliation invocation. The reconciler path allocates no second reconciliation action and never invokes reconciliation-of-reconciliation. This closes the reconciler's own crash window without recursion. The protocol is a future interface contract, not implemented code.

## Closed pauses

```ts
type PauseQuestion = {
  questionId: string;
  category: "fact" | "rights" | "destination" | "source" | "scope" | "lock";
  prompt: DurableLocatorSafeText;
};

type DeferredInvocationCorrelationFor<R extends NonAcceptanceInterfaceInvocationRoute> =
  {declaredInvocationToState: R["toState"]} &
  (R extends {validationDisposition: infer V} ? {validationDisposition: V} : {validationDisposition: null});

type DeferredInterfacePauseFor<R extends NonAcceptanceInterfaceInvocationRoute> = {
  kind: "deferred-interface";
  pauseId: string;
  state: R["fromState"];
  interfaceId: R["interfaceId"];
  invocationInputHash: string;
  resultRouteId: ResultRouteIdFor<R>;
} & DeferredInvocationCorrelationFor<R>;

type DeferredInterfacePause = NonAcceptanceInterfaceInvocationRoute extends infer R
  ? R extends NonAcceptanceInterfaceInvocationRoute ? DeferredInterfacePauseFor<R> : never
  : never;

type ActionRecoveryPauseFor<A extends PendingAction> = {
  kind: "action-recovery";
  pauseId: string;
  state: A["executionState"];
  action: A;
};

type ActionRecoveryPause = PendingAction extends infer A
  ? A extends PendingAction ? ActionRecoveryPauseFor<A> : never
  : never;

type ArtifactAcceptancePauseFor<R extends ArtifactRouteId> = {
  kind: "artifact-acceptance";
  pauseId: string;
  state: AcceptanceProducerStateFor<R>;
  pendingArtifact: PendingArtifactForRoute<R>;
  candidateByteHash: string;
  acceptanceRouteId: R;
};

type ArtifactAcceptancePause = {
  [R in ArtifactRouteId]: ArtifactAcceptancePauseFor<R>
}[ArtifactRouteId];

type CapabilityGapRoutePause = {
  kind: "capability-gap-route";
  pauseId: string;
  state: "CAPABILITY_GAP";
  gapContentHash: string;
  originPlanningContext: OriginPlanningContext;
};

type WorkflowPause =
  | {kind: "required-user-input"; pauseId: string; state: ResumableState; questionSetHash: string; questions: [PauseQuestion, ...PauseQuestion[]]}
  | ArtifactAcceptancePause
  | DeferredInterfacePause
  | ActionRecoveryPause
  | CapabilityGapRoutePause
  | {kind: "preview-gate"; pauseId: string; state: "PREVIEW_GATE"; requiredTupleHash: string}
  | {kind: "manual-music-generation"; pauseId: string; state: "WAITING_FOR_MANUAL_MUSIC"; promptAttemptHash: string; promptContentHash: string}
  | {kind: "awaiting-capability-implementation"; pauseId: string; state: "WAITING_FOR_CAPABILITY_IMPLEMENTATION"; gapContentHash: string; routeDecisionHash: string; advisoryResultReceiptHash: string; originPlanningContext: OriginPlanningContext};
```

A pause keeps its exact state. It is not `STOP`, not completion, and not interface success. Pause IDs are deterministic local ordinals. An unavailable acceptance pause is derived only from current `CandidateReadyControl` and embeds its complete `pendingArtifact: PendingArtifactForRoute<R>` byte-for-byte, including candidate path/schema/parents/context, byte hash/length, producer state, producer decision/result receipt, and prompt binding. The pause's `state`, `candidateByteHash`, and `acceptanceRouteId` are redundant check fields and must equal the corresponding values projected from that embedded object; mismatch is refusal. It pauses in the candidate's mapped producer state, not in an otherwise unreachable ready `ARTIFACT_ACCEPTANCE`.

A matching `ArtifactAcceptanceRetry` must equal the current pause ID/hash/route. Its reducer restores exactly `pause.pendingArtifact`—not a reconstructed object—to `CandidateReadyControl.pendingArtifact` in that embedded producer state, after which the ordinary candidate-ready acceptance invocation enters `ARTIFACT_ACCEPTANCE`. This restores the exact candidate-ready control in the original producer state. No field from the retry, current filesystem, candidate filename, or later checkpoint may fill, replace, or default any part of the retained object.

## Closed operator and resume inputs

```ts
type TrustedOperatorContext = {
  provenance: "out-of-band-operator-adapter";
  actorId: HumanActorId;
  actualUserTurnEnvelopeHash: Sha256;
  operatorEnvelopeHash: Sha256;
};

type RequiredUserAnswer = {
  kind: "required-user-answer";
  pauseId: string;
  questionSetHash: string;
  answers: [{questionId: string; tokenizedAnswer: DurableInstructionText}, ...Array<{questionId: string; tokenizedAnswer: DurableInstructionText}>];
  suppliedLocatorSetHash: string | null;
  actor: {type: "human"; id: HumanActorId};
};

type ArtifactAcceptanceRetry = {
  kind: "artifact-acceptance-retry";
  pauseId: string;
  candidateByteHash: string;
  acceptanceRouteId: AcceptanceContext["acceptanceRouteId"];
};

type DeferredInterfaceRetryFor<P extends DeferredInterfacePause> = {
  kind: "deferred-interface-retry";
  pauseId: P["pauseId"];
  interfaceId: P["interfaceId"];
  invocationInputHash: P["invocationInputHash"];
  resultRouteId: P["resultRouteId"];
  declaredInvocationToState: P["declaredInvocationToState"];
  validationDisposition: P["validationDisposition"];
};

type DeferredInterfaceRetry = DeferredInterfacePause extends infer P
  ? P extends DeferredInterfacePause ? DeferredInterfaceRetryFor<P> : never
  : never;

type ActionRecoveryRequest = {
  kind: "action-recovery-request";
  pauseId: string;
  actionId: ActionId;
  inputBindingHash: Sha256;
  decisionEventHash: Sha256;
  resultRouteId: ResultRouteIdFor<NormalActionRoute> | "interface.action-result-reconciliation.result";
};

type LocalSourceIngressRequest = {
  kind: "local-source-ingress-request";
  pauseId: string | null;
  projectId: string;
  originState: LocalSourceIngressState;
  previousLocalAssetManifestPath: string | null;
  previousLocalAssetManifestHash: string | null;
  locatorSetHash: string;
  declarations: [LocalSourceDeclaration, ...LocalSourceDeclaration[]];
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type ProjectPolicyIngressRequest = {
  kind: "project-policy-ingress-request";
  pauseId: string;
  projectId: string;
  previousProjectPolicyHash: string | null;
  previewApproval: ProjectPolicy["previewApproval"];
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type PreviewGateDecision =
  | {kind: "preview-gate-decision"; pauseId: string; decision: "approve"; projectId: string; revisionId: string; renderPlanHash: string; previewHash: string; technicalQcHash: string; creativeReviewHash: string; motionReviewHash: string; actor: {type: "human"; id: HumanActorId}; reason: DurableInstructionText}
  | {kind: "preview-gate-decision"; pauseId: string; decision: "request-changes"; projectId: string; revisionId: string; renderPlanHash: string; previewHash: string; technicalQcHash: string; creativeReviewHash: string; motionReviewHash: string; actor: {type: "human"; id: HumanActorId}; reason: DurableInstructionText; sourceUserInstruction: DurableInstructionText};

type EphemeralHostPreviewApprovalEnvelope = {
  kind: "host-preview-approval-envelope";
  pauseId: string;
  decision: "approve";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  previewHash: string;
  technicalQcHash: string;
  creativeReviewHash: string;
  motionReviewHash: string;
  reason: DurableInstructionText;
  invocationEnvelopeHash: Sha256;
};

type DerivedHostPreviewGateDecision = {
  kind: "preview-gate-decision";
  pauseId: string;
  decision: "approve";
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  previewHash: string;
  technicalQcHash: string;
  creativeReviewHash: string;
  motionReviewHash: string;
  actor: {type: "host"; id: HostId};
  reason: DurableInstructionText;
};

type CapabilityImplementationBudget = {
  maxSourceBytesPerFile: 262144;
  maxEvidenceBytesPerFile: 1048576;
  maxTotalAuthorizedBytes: 8388608;
  maxAstNodesPerSource: 50000;
  maxAstDepth: 128;
  maxCpuMillisecondsPerPhase: 30000;
  maxWallMillisecondsPerPhase: 60000;
  maxMemoryBytes: 536870912;
  maxStdoutBytes: 1048576;
  maxStderrBytes: 1048576;
  maxTemporaryBytes: 0;
  maxOutputBytes: 8388608;
  maxOpenFileDescriptors: 64;
  maxChildProcesses: 0;
};

type CapabilityAuthorizedFile = {
  projectId: string;
  capabilityId: string;
  capabilityVersion: string;
  relativePath: string;
  path: string;
  purpose: "source" | "intent-schema" | "resolved-schema" | "fixture" | "test" | "performance-check" | "registration-record" | "registry-snapshot";
};

type CapabilityImplementationAuthorization = {
  kind: "capability-implementation-authorization";
  pauseId: string;
  projectId: string;
  capabilityId: string;
  capabilityVersion: string;
  originPlanningContext: OriginPlanningContext;
  gapContentHash: string;
  routeDecisionHash: string;
  advisoryResultReceiptHash: string;
  exactFileManifest: [CapabilityAuthorizedFile, ...CapabilityAuthorizedFile[]];
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type NoTrackSelection = {
  kind: "no-track-selection";
  pauseId: string;
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
  promptContentHash: string;
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type AbandonRequest = {
  kind: "abandon-request";
  pauseId: string;
  actor: {type: "human"; id: HumanActorId};
  reason: DurableInstructionText;
};

type WorkflowOperatorInput =
  | RequiredUserAnswer
  | ArtifactAcceptanceRetry
  | DeferredInterfaceRetry
  | ActionRecoveryRequest
  | LocalSourceIngressRequest
  | ProjectPolicyIngressRequest
  | PreviewGateDecision
  | CapabilityGapRouteDecision
  | CapabilityImplementationAuthorization
  | ManualAudioIngressRequest
  | NoTrackSelection
  | AbandonRequest;

type HumanWorkflowOperatorInput = Exclude<
  WorkflowOperatorInput,
  ArtifactAcceptanceRetry | DeferredInterfaceRetry | ActionRecoveryRequest
>;

type SystemWorkflowResumeInput = Extract<
  WorkflowOperatorInput,
  ArtifactAcceptanceRetry | DeferredInterfaceRetry | ActionRecoveryRequest
>;

type ActorFree<I> = I extends HumanWorkflowOperatorInput ? Omit<I, "actor"> : never;

type EphemeralHumanOperatorInputEnvelope<I extends HumanWorkflowOperatorInput> =
  I extends HumanWorkflowOperatorInput
    ? {
        kind: "human-operator-input-envelope";
        input: ActorFree<I>;
        operatorEnvelopeHash: Sha256;
      }
    : never;

type RecordedWorkflowOperatorInput = WorkflowOperatorInput | DerivedHostPreviewGateDecision;
```

`EphemeralHumanOperatorInputEnvelope` is actor-free and distributive over every input union. `ActorFree<I>` removes only `actor` from each concrete union member, so branch-only required fields remain required: in particular, `PreviewGateDecision` with `decision:"request-changes"` retains `sourceUserInstruction`, while `decision:"approve"` forbids it. The operator adapter constructs the envelope only from an actual user turn after applying the exact idempotent locator/secret projection. `operatorEnvelopeHash` is SHA-256 over the RFC 8785/JCS bytes of that sanitized concrete actor-free input, and is computed only after the projection; `actualUserTurnEnvelopeHash` remains out-of-band and is never written. The Ledger recorder accepts a human input only beside a `TrustedOperatorContext` whose provenance and two hashes match the active adapter turn, then derives the persisted human actor as `{type:"human", id: trustedOperatorContext.actorId}`. The role, orchestrator, model, interface producer, or prompt cannot construct a human approval, policy decision, capability route/authorization, rights declaration, no-track choice, or abandonment. It rejects every model-authored operator input or actor claim, absent context, stale turn, hash mismatch, or model-generated imitation before append. `OperatorInputRecordedPayload.operatorEnvelopeHash` is non-null exactly for this derived human path; system resume inputs and the separately derived host-preview path use null.

`EphemeralHostPreviewApprovalEnvelope` is never a `WorkflowOperatorInput` and contains no actor. The Ledger recorder accepts it only beside the out-of-band `TrustedHostContext`, verifies the envelope and context `invocationEnvelopeHash` against the active request, applies the accepted explicit policy, and derives the recorded actor exactly as `{type: "host", id: trustedHostContext.hostId}`. A model-authored host actor, caller-supplied host field, context/envelope mismatch, stale tuple, or host not present in the policy allowlist is rejected. Only the derived `DerivedHostPreviewGateDecision` may appear in the Ledger.

`LocalSourceIngressRequest` durably records the attributed per-locator rights/use declarations and the hash of the ephemeral locator set, never the path values themselves. `pauseId:null` is legal only for the first request in an unpaused `INTAKE` or `REVISION_SOURCE_UPDATE`; a correction must name the matching required-input pause. The prior path/hash pair must exactly equal the applicable accepted current/staged manifest identity, or both be null only for first ingress. The interface receives the separately supplied ephemeral `EphemeralLocalSourceLocatorSet`, recomputes `locatorSetHash`, and refuses rather than persisting a host-native locator.

`ProjectPolicyIngressRequest` is legal only against the exact current `PREVIEW_GATE` pause. Its prior hash equals `currentProjectPolicy.contentHash` or is null when no explicit policy has been accepted. The mechanical ingress projects only its `projectId` and `previewApproval`; actor/reason remain Ledger provenance and do not enter `ProjectPolicy@1` bytes.

`CapabilityGapRouteDecision` is the exact user-attributed shape in `capability-gap-contract.md`; it must match the current capability-gap-route pause ID, gap hash, and `originPlanningContext`. Its external `routeDecisionHash` is the SHA-256 of its RFC 8785 bytes. The capability gap route decision is fully closed: `honest-approximation` selects only the same initial/rebuild Motion Planner route, `future-project-local-proposal` selects only the same-context advisory route, and `decline` selects the explicit `CapabilityGapDeclineDecision` terminal `STOP` route. `CapabilityImplementationAuthorization` is a separate human decision over the advisory's finite exact-file manifest. It must match the same active gap, route, advisory, awaiting-implementation pause, and origin context. Its external `implementationAuthorizationHash` is likewise the SHA-256 of the complete canonical authorization bytes. Route selection alone never authorizes writes.

The one canonical implementation root is:

`projects/<project-id>/capabilities/<capability-id>/<capability-version>/`

The authorization's `capabilityId` begins with `project.<project-id>.`; its version is one exact safe semantic version. Every `CapabilityAuthorizedFile` repeats the authorization's exact `projectId`, `capabilityId`, and `capabilityVersion`. Its `path` must byte-for-byte equal the canonical root followed by its normalized `relativePath`; the repetition is checked, never trusted as a second source of truth. Manifest entries are unique and sorted by full `path` before authorization hashing.

`relativePath` is a non-empty repository-relative POSIX file path of at most 240 UTF-8 bytes. Each component is 1–64 ASCII bytes, uses only lower-case letters, digits, dot, underscore, and hyphen, begins and ends with a lower-case letter or digit, and is not dot-prefixed. Absolute paths, drive prefixes, backslashes, empty components, `.` or `..` traversal, URI schemes, control characters, shell metacharacters, glob/wildcard syntax, and directory-only entries are forbidden. For every component, its case-insensitive basename before the first dot must not be any `ReservedDeviceBasename` from `workflow-decision.md`; thus `con`, `con.ts`, `aux.json`, and `com1.anything` all refuse on every platform. No component may be `.git`, `.codex`, `.claude`, `.workflow`, `node_modules`, `revisions`, `sources`, `out`, `receipts`, `catalog`, `agent`, `craft`, `shared`, `engine`, or `runtime`; no final basename may be `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, or any other package/lock manifest. These explicit names supplement the universal dot-prefixed component ban and reserved-device rule.

Purpose, first component, and extension are one closed tuple: `source → src/ → .ts or .tsx`; `intent-schema | resolved-schema → schemas/ → .schema.json`; and `fixture → fixtures/`, `test → tests/`, `performance-check → evidence/`, `registration-record → registration/`, `registry-snapshot → registry/`, each ending in `.json`. A path under another purpose root or with another purpose extension is invalid. The exact manifest has at most 64 unique entries, sorted by full path. Every required purpose is represented: at least one `source`, and exactly one each of `intent-schema`, `resolved-schema`, `fixture`, `test`, `performance-check`, `registration-record`, and `registry-snapshot`. Extra purpose values are invalid.

The implementation's **static import graph** is closed before execution and contains only authorized source files. A source may import only another authorized file with `purpose: source`, using an explicit relative static specifier whose spelling includes `.ts` or `.tsx` and resolves exactly without index or extension inference. Dynamic import, bare specifiers, package resolution, Node/runtime built-in imports, absolute/URL imports, `require`, import assertions that fetch, and generated module names are forbidden. The capability ABI is passed through closed typed parameters rather than package or host imports.

Source AST validation also rejects ambient or computed escape surfaces: `process`, `global`, `globalThis`, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `eval`, `Function`, `AsyncFunction`, WebAssembly compilation, dynamic code generation, timers, workers, child-process or shell launch, filesystem/environment/OS/network/module-loader access, reflection that reaches those values, and any host/process/resource API outside the closed capability ABI. Aliasing, computed-property access, destructuring, optional chaining, string construction, or type escape does not make one legal. Validation, tests, performance checks, and preview/final render execute with network and child processes disabled, the repository mounted read-only, bounded CPU/memory/time/file descriptors, no inherited credentials or writable temporary directory, and write access only to the exact not-yet-created authorized targets during the implementation commit. Any source or runtime attempt to escape the ABI refuses the entire capability.

TSX/JSX is closed by an allowlist, not a denylist. Intrinsic DOM/SVG/HTML element names are all forbidden, including `video`, `audio`, `img`, `image`, `iframe`, `object`, `embed`, `script`, `style`, `link`, `canvas`, and `foreignObject`. A JSX element may name only one injected, non-importable closed 2D ABI primitive: `MotionGroup`, `MotionRect`, `MotionCircle`, `MotionEllipse`, `MotionLine`, `MotionPath`, `MotionText`, `MotionAsset`, `MotionClip`, or `MotionMask`. Spread attributes, namespace attributes, raw child text/HTML, `dangerouslySetInnerHTML`, `style`, `className`, `src`, `srcSet`, `href`, `xlinkHref`, `poster`, any `on*` event property, ref/portal access, and unknown props are forbidden whether literal, aliased, computed, concatenated, or spread. `MotionAsset` accepts only an exact accepted `assetId` with an allowed render use; `MotionText` accepts only an exact MotionSpec `copyId`; color, font, and other design values accept only exact MotionSpec token IDs. No primitive accepts a URL, data URI, path, filename, CSS string, markup string, executable callback, or free content. Mechanical AST/type validation resolves every asset/copy/token reference against the accepted MotionSpec/LocalAssetManifest before implementation, registration, tests, preview, or final render. A capability that cannot express itself through this finite pure-code 2D ABI is refused rather than granted raw DOM access.

`CapabilityImplementationBudget` is one literal system constant, not an operator-, advisory-, model-, or capability-adjustable input. Before creating any destination, the future implementation interface must materialize the complete proposed authorized bytes in a bounded in-memory staging object, classify each member by its authorized purpose, and verify every source member, every non-source evidence member, and their exact aggregate against the three byte limits. It parses each source with counters that stop at the exact AST-node and AST-depth limits and closes the static import graph before any destination ancestor or file is created. Planned stdout, stderr, temporary, and output accounting begins at zero; integer addition uses checked non-negative arithmetic. An absent size, parser count, or resource meter is unknown and therefore not passing.

The same literal budget is installed before implementation generation and remains enforced during destination creation, validation, tests, performance checks, and render. CPU and wall time are independently limited per phase; memory, open file descriptors, and child processes are hard sandbox ceilings; stdout and stderr are counted separately and cannot be truncated into success; temporary bytes include every attempted unlisted scratch/cache/lock write and therefore have a zero ceiling; output bytes include all authorized implementation and evidence bytes produced or rewritten by a phase and cannot exceed the literal output or aggregate limits. The exclusive destination writer compares actual bytes written with the preflight bytes and running counters, aborting before the next file on any disagreement. Any unknown, unmeasurable, overflow, or limit breach refuses the entire implementation, exposes no receipt or registry entry, and quarantines any already created incomplete target under the existing fail-closed rule; no partial, truncated, timed-out, or killed phase is acceptable evidence.

All capability targets are resolved from a trusted repository-root directory descriptor. Each existing ancestor is opened with `openat` using directory-only plus `O_NOFOLLOW`; each exact missing authorized ancestor is created with `mkdirat` and reopened the same way. A final authorized file is created once with `openat` flags `O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW` and mode `0600`; there is no check-then-open pathname step. Immediate `fstat` must prove the opened inode is a regular file with link count one, and post-write verification must retain the same device/inode. Each file is completely written and `fsync`ed, then each affected parent directory is `fsync`ed before the receipt is exposed. Preflight failure creates nothing; a later write/flush/verification failure refuses the implementation, with any already created files treated as quarantined incomplete output that cannot be registered or retried as pre-existing success.

The future implementation interface performs no overwrite: every authorized target must be a new file, and every canonical-root ancestor must pass the anchored rules above. An existing file/directory, symlink, hard link target, path escape, case-fold collision, reserved-path collision, or attempted overwrite refuses before registration. The authorization grants no directory-wide authority and no unlisted temporary, lock, generated, cache, package, engine, shared, Ledger, revision, source, output, or receipt path.

Every resume input must exactly match the current pause ID and its hashes. Ordinarily a valid input is recorded first and a head-bound resume/advance/invocation decision then consumes it. The sole action-recovery exception is a pause whose pending action is already `action-result-reconciliation`: its matching `ActionRecoveryRequest` event directly restores that exact action to running as specified above, without a second decision. A mismatched input leaves the pause unchanged. Locator-bearing answers use a separately supplied `EphemeralLocalSourceLocatorSet`: `RequiredUserAnswer` persists only its nullable `suppliedLocatorSetHash`, which must equal that envelope's recomputed hash, never a path value. Null means the answer supplied no locator envelope. An `operator-input-recorded` event carrying a valid `AbandonRequest` is itself the sole atomic transition from that pause to terminal `STOP` and derives the attributed abandoned `TerminalOutcome`; there is no later abandonment event or duplicate reducer.

## Re-entry matrix

| Invocation/input class | Required current control/evidence | Only legal next action |
|---|---|---|
| new project | no Ledger at allocated identity | initialize, record invocation, then local ingress or `FACT_CHECK` |
| existing visual revision without new paths | terminal/stable current revision and new durable locator-tokenized instruction | `REVISION_INTERPRET` |
| existing visual revision with new paths | same plus exact top-level locators | `REVISION_SOURCE_UPDATE` → local ingress/acceptance → Revision Interpreter |
| local-source ingress request | unpaused intake/source-update or matching required-input pause, exact ephemeral locator-set hash, prior manifest identity, complete rights/use declarations | invoke `local-source-ingress`; its origin-bound candidate → acceptance only |
| required-user-answer | matching required-input pause | same origin state, then repeat the blocked decision path |
| artifact-acceptance-retry | matching producer-state acceptance pause | restore exact candidate-ready control, then invoke `artifact-validation-and-hashing` |
| deferred-interface-retry | matching deferred interface pause | same interface, typed input hash, literal result route, declared target, and validator disposition |
| action-recovery-request for ordinary action | matching action-recovery pause | record one reconciliation action only |
| action-recovery-request for reconciler | matching action-recovery pause whose action is already reconciliation | atomically restore and re-execute that same recorded reconciler; never reconciliation-of-reconciliation |
| preview decision | exact Preview Gate tuple/pause | request changes → Revision Interpreter; approve → Approval recorder stage |
| project-policy ingress request | exact Preview Gate pause plus current policy hash-or-null and attributed human policy fields | invoke `project-policy-ingress`; immutable policy candidate → acceptance → same Preview Gate |
| capability gap route decision | matching gap-route pause/hash/context and trusted human operator envelope | honest approximation, advisory, or explicit terminal decline in that same initial/rebuild context |
| capability implementation authorization | matching capability wait/pause plus accepted gap/route/advisory/context and finite exact manifest | invoke the authorized implementation interface; receipt acceptance returns to the exact initial/rebuild Motion Planner state |
| approved locked-cut audio request | current approval, silent master, Render Manifest | Sound Designer in `AUDIO_BRIEF` |
| manual audio ingress request | exact manual-music pause and prompt attempt | stage/verify exact local track, then optional mux |
| no-track selection | same manual-music pause | delivery with `audioStatus=not-provided` |

Existing projects never reset to `INTAKE`. If files exist without a valid Ledger, or chain/reducer verification fails, the current request terminates for explicit future migration/re-initialization; Part 1 defines no migration utility.

## Initialization, IDs, invalidation, and completion

New-project order is exact: project and secret-sanitize the raw instruction, raw requested project-ID candidate, and locator-set identity; reject a secret/locator-bearing explicit ID for a safe replacement; allocate/validate `projectId` only from unchanged safe explicit ID bytes or sanitized title bytes; reject every reserved-device basename; perform collision lookup; derive `invocationEnvelopeHash` only from the durable projection; verify the separate `TrustedHostContext`; only then create the anchored project/Ledger path and append sequence 1 `project-initialized` with request `request-0001` and `currentProjectPolicy:null`; then append `invocation-received` containing `trustedHostId`, durable instruction, local-path count, nullable locator-set hash, and matching sanitized `invocationEnvelopeHash`. The reducer binds those exact fields into `activeRequest`; raw request text, raw requested-ID, locator or credential bytes, a hash of a raw envelope, and a caller/model host claim are never used for lookup/path composition or appended. Only then may it emit the first head-bound decision. Initialization writes no Brief, research, source acceptance, policy acceptance, revision, or creative choice.

IDs are deterministic local ordinals (`request-0001`, `repair-0001`, `candidate-0001`, `revision-attempt-0001`, `review-attempt-0001`, `rev-0001`). They use no clock, randomness, remote service, or model-selected suffix.

A committed source revision clears downstream RenderPlan, preview/evidence, QC, review, approval, silent-master/manifest, AudioBrief, prompt, audio, mux, and delivery identities and records every superseded hash under `invalidatedContentHashes`. Audio-only re-entry and replacement results apply the narrower exact `AudioLineageInvalidationRule` tuples above; they never retain or resurrect a stale downstream manual/mux/delivery identity. Earlier events and immutable source candidates remain.

The successful `delivery-packager` `interface-result-recorded` event is the sole completion reducer: it requires the current DeliveryManifest hash, derives `{kind:"completed", requestId, deliveryManifestHash}`, and moves directly to `{kind:"terminal", state:"COMPLETE"}`. A valid recorded `AbandonRequest` is the sole abandonment reducer described above. No `request-completed` or `request-abandoned` event exists. Neither terminal outcome prevents a later genuinely new project request from loading the immutable history.
