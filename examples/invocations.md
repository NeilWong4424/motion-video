# Invocation Examples

These are honest conversation starters for the local Prompt OS. Part 1 cannot render, preview, validate, produce a music prompt, mux, or deliver media. Use the canonical workflow to determine what documentation artifact or blocker is appropriate; do not treat an example as proof of output.

## Codex

Create intake and a Brief candidate from the fast input in `projects/acme/BRIEF_INPUT.md`. Follow `agent/video-workflow.md`, preserve every verified fact and lock, and use the typed required-user-input pause for correctable local-source rights evidence. Write the candidate only to its immutable request/attempt path and do not call it accepted until artifact acceptance succeeds. Part 1 cannot render this request.

## Claude Code

Use the `/video` workflow for project `acme`. Read `projects/acme/BRIEF_INPUT.md` and `projects/acme/LOCAL_SOURCES.md`, restore the verified Ledger, route to the owning role, and report the next allowed state, same-state pause, or terminal outcome. Part 1 cannot render this request.

## Revision

Interpret `projects/acme/REVISION_REQUEST.md` against the current hash-bound evidence. Preserve the listed locks and all unrelated work, and author only an immutable `SemanticPatch@1` candidate. For bounded mode, emit fine-grained operations; for rebuild mode, emit only `rebuildFrom`, authorized scopes, and declared impact—never replacement Brief/Treatment/MotionSpec payloads. Part 1 cannot apply or render the revision.

## Revision with new local sources

Restore project `acme`, keep directly supplied local locators only in the ephemeral locator envelope, and persist the revision instruction with those exact locator bytes replaced by their stable locator-ID tokens before entering `REVISION_SOURCE_UPDATE`. Stage exact source bytes through local ingress, externally accept the new manifest and any Researcher candidate, and only then delegate Revision Interpreter. Never insert a raw locator into the Ledger, a current revision, or an overwritten staged path.

## Preview approval response

Restore project `acme` from its verified Ledger. A human response must arrive from the adapter as an actor-free `EphemeralHumanOperatorInputEnvelope<PreviewGateDecision>` beside matching out-of-band `TrustedOperatorContext`; the recorder validates the actual-user-turn/sanitized-envelope binding and derives the persisted actor. Record it only if the current pause is exactly `PREVIEW_GATE` and every supplied revision/plan/preview/QC/review hash matches. A host approval instead arrives as an actor-free `EphemeralHostPreviewApprovalEnvelope` beside the adapter's out-of-band `TrustedHostContext`; the recorder derives the host actor after policy and invocation checks. For `decision: "approve"`, route to `RECORD_PREVIEW_APPROVAL`. A human `request-changes` decision contains no raw locators and routes only to `REVISION_INTERPRET` with its exact durable locator-and-secret-tokenized `sourceUserInstruction`. If the user supplies new local locators, treat that as a separate new `visual-revision` invocation: project the instruction, retain paths only in the ephemeral locator envelope, record its typed `BeginRequestRoute`/`LocalSourceIngressRequest`, and route to `REVISION_SOURCE_UPDATE` before Revision Interpreter. A chat message such as “looks good” without the exact tuple is not approval evidence.

## Artifact acceptance resume

Restore the exact pending artifact from project `acme`'s producer-state `artifact-acceptance` pause and current Ledger head. Record the matching `ArtifactAcceptanceRetry`, restore the byte-identical `candidate-ready` control in that producer state, and then use the ordinary candidate-ready `artifact-validation-and-hashing` invocation with the same candidate-byte hash, acceptance route, prompt binding, and parent set. There is no separate retained-candidate retry route. Do not ask the semantic role to rewrite the candidate, invent a content hash, or skip to its downstream owner. Because the Part 1 interface is unavailable, preserve the producer-state acceptance pause.

## Manual audio return

At the exact `WAITING_FOR_MANUAL_MUSIC` pause, create one ephemeral local-audio locator envelope. The adapter projects the actor-free `ManualAudioIngressRequest` from the actual user turn, sanitizes its durable text, and supplies matching `TrustedOperatorContext`; the recorder derives its human actor. The request selects the actual content-addressed prompt attempt and persists only the matching locator ID/envelope hash, source label, rights statement, user-declared payoff time, gain, derived actor, and reason. Pass the locator envelope directly to the future ingress interface; never record its raw path. The interface stages and hashes the bytes and emits `ManualAudioReturn@1`; only then may the workflow route to `OPTIONAL_LOCAL_MUX`. Part 1 cannot stage, align, or mux it.

## No-track selection

At the same exact `WAITING_FOR_MANUAL_MUSIC` pause, accept a `NoTrackSelection` only through a matching trusted human operator envelope, derive its actor, and bind it to the actual accepted AudioBrief and actual prompt attempt. Invoke delivery packaging with `audioStatus=not-provided`; do not bypass AudioBrief or `MUSIC_PROMPT.md`. Part 1 cannot package delivery.

## Capability implementation authorization

At `WAITING_FOR_CAPABILITY_IMPLEMENTATION`, accept a human `CapabilityImplementationAuthorization` only from an actor-free actual-user-turn envelope plus matching `TrustedOperatorContext`, then derive the actor. Bind the current pause, gap hash, route-decision hash, recovery-stable `advisoryResultReceiptHash`, exact initial/rebuild `originPlanningContext`, reason, exact `project.<project-id>.*` capability ID/version, and a finite exact new-file/purpose manifest beneath `projects/<project-id>/capabilities/<capability-id>/<capability-version>/`. The manifest obeys the closed lower-case path lengths, purpose extensions, forbidden dot/package roots, and static relative source-only import graph. Before a destination exists, the future interface must pass the exact literal `CapabilityImplementationBudget`; that same byte/AST/CPU/memory/wall-time/output/file-descriptor/process budget remains active during exclusive anchored creation, validation, tests, performance checks, and render, with unknown or overflow treated as refusal. The interface exclusively creates each exact target from a trusted repository-root directory descriptor with anchored no-follow operations; capability code has no network, child process, ambient host/global API, or writable repository outside those targets. Its closed context-discriminated success result carries the exact receipt candidate, which then goes through artifact acceptance. Motion Planner resumes only after the receipt manifest minus `contentHash` exactly equals the authorization manifest and all named evidence is externally accepted. Part 1 cannot implement or register it.

## Credential-bearing request

If a user includes a credential or asks for API-key architecture, apply the deterministic secret projection before calculating any durable envelope hash. Persist only stable `[[redacted-secret:<ordinal>]]` tokens and the sanitized typed finding. A credential/API-key architecture request then routes to `out-of-scope`/`STOP`; neither its blocking reason nor any role input receives the original credential bytes.
