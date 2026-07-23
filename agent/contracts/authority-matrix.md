# Authority matrix

Authority is singular and field-specific. Precedence is: user facts, explicit constraints, and semantic locks; strict schemas and fixed product boundaries; the artifact owner; current hash-bound release evidence; applicable craft; examples. A downstream role cannot silently override an upstream owner. It requests a semantic revision instead.

| Concern or artifact | Sole authority | Inputs | Explicit exclusion |
|---|---|---|---|
| State and next-route decision | Orchestrator | Verified Ledger checkpoint, roles, interfaces, and user evidence | Creative content, role candidates, direct persistence, gate evidence |
| Recoverable state, revision/lock/counter/pause checkpoint | Future Workflow Ledger recorder | Exact head-bound decision/result/operator input | Creative/routing judgment, mutable overwrite, database/platform semantics |
| Accepted role-artifact identity | Future artifact-validation-and-hashing interface | Exact immutable candidate bytes/path, `AcceptanceContext`, delegated execution-time prompt binding, closed parents, assets, current Ledger | Semantic editing, repair, role self-acceptance, creative approval |
| Local-source rights/use/provenance semantics | Human | Typed per-locator kind, visual-generation declaration, requested/allowed uses, rights status/holder/evidence, attribution, and limits | Permission or visual provenance inferred from possession/pixels; interface/orchestrator creative use choice |
| Content-addressed staged local bytes and `LocalAssetManifest@1` candidate | Future local-source-ingress interface | Recorded `LocalSourceIngressRequest` plus matching ephemeral exact top-level locator set | Persisting arbitrary locators, network/embedded expansion, content interpretation, inventing rights/use grants, direct acceptance |
| `ProjectPolicy@1` semantics | Human | Attributed typed `ProjectPolicyIngressRequest` at the exact Preview Gate | Orchestrator/host self-authorization; `_template` example as authority |
| Immutable `ProjectPolicy@1` candidate projection | Future project-policy-ingress interface | Exact recorded human request and current accepted policy identity-or-null | Altering policy fields, inferred opt-in, mutable canonical policy, direct acceptance |
| Missing-policy `implicit-human-only` projection | Effective-policy resolver | Closed deterministic projection | Auto approval or host authority |
| `FACT_CHECK` closure and `facts-closed` route | Orchestrator | Verbatim request/answers, declared research questions, accepted local evidence, typed unresolved items | Brief authorship, factual invention, creative assumptions |
| Brief synthesis: audience, one message, CTA, constraints, assumptions | Brief Planner | Verbatim user facts and accepted Researcher evidence | State/routing decisions, inventing facts, changing source evidence, style, composition, exact timing |
| Measured local-source findings | Researcher | User-supplied local sources | Facts by invention, treatment, style choice |
| Core catalog/registry snapshot identity | Future `catalog-registry-snapshot` interface | Checked-in `catalog/core-registry.json` and its closed contract | Catalog invention, network discovery, implementation claims, project-local promotion |
| Treatment, narrative, visual thesis, motion profile, style pack, Beat intentions, vocabulary, cut budget | Creative Direction | Approved Brief, findings, validated catalog snapshot, craft | Unregistered catalog IDs, geometry, tracks, code |
| MotionSpec and accepted capability-gap candidate | Motion Planner | Accepted Brief/Treatment, exact asset-use grants, registry snapshot and receipt set, craft | Runtime code, undeclared capability, implementation authorization |
| Capability gap diagnosis and project-local proposal advisory | Capability Builder interface stub | Accepted immutable gap/hash and explicit attributed project-local-proposal route | Canonical artifact, current/future implementation authority, package writes, Brief/Treatment/MotionSpec changes, shared promotion |
| `CapabilityImplementationAuthorization` | Human | Accepted gap/route, recorded advisory, finite exact new-file manifest under the one project/capability/version root | Wildcards, traversal, symlinks, reserved paths, overwrite, directory-wide authority, authority inferred from route/advisory |
| Future approved project-local capability files and receipt | `project-local-capability-implementation-and-registration` interface | Exact authorization hash/manifest plus accepted gap/route and recorded advisory; the one protocol-derived immutable receipt path is addressed by that authorization hash | Implementation/evidence files outside the authorized manifest, any other inferred output, receipt overwrite, shared promotion, engine-wide change |
| `SemanticPatch@1` directive | Revision Interpreter | Verbatim instruction, current hashes/locks, and closed `user-request` or issue/cycle-bound `review-repair` cause | Applying patch, direct source edits, embedded Brief/Treatment/MotionSpec replacement payloads |
| Rebuild Brief/Treatment/MotionSpec candidates | Brief Planner → Creative Direction → Motion Planner from the declared `rebuildFrom` stage | Accepted rebuild directive, authorized scopes, current base, accepted staged parent from the same revision attempt | Revision Interpreter/orchestrator authorship, mutable current-source overwrite, bypassing owner order |
| Revision validation and commit | Future canonical-source validator and semantic-revision applier | Complete accepted bounded patch or complete accepted owner rebuild chain, actual diff, locks, current base | Partial publication, semantic invention, undeclared impact, switching current revision before success |
| Creative review | Creative Reviewer | Exact preview, Brief/Treatment, current QC | Source edits, Preview Approval |
| Motion review | Motion Reviewer | Exact preview/frames, MotionSpec, current QC | Source edits, Preview Approval |
| Preview Approval decision | Human by default; exact host only after explicit user opt-in in an accepted Project Policy | Passing current QC and two externally accepted `ship` reviews | Reviewers, implicit policy, or orchestrator by implication |
| `PreviewApproval@1` artifact | Future deterministic Approval recorder | Attributed decision/reason, effective policy hash, exact preview/evidence, passing QC, both accepted `ship` review hashes | Creative judgment, policy writes, inferred actor authority |
| AudioBrief | Sound Designer | Approved locked silent cut and motion cues | `MUSIC_PROMPT.md`, generated music, visual edits |
| Technical QC and derived artifacts | Future deterministic tools | Canonical, current hash-bound inputs | New creative decisions or silent fallbacks |
| `MUSIC_PROMPT.md` and `MusicPromptAttempt@1` | Future deterministic audio-prompt generator | Externally accepted current AudioBrief and exact locked-picture bindings | Human/role/orchestrator editing, supplemental chat/MotionCue semantics, provider selection |
| Music generation | User operating a third-party tool | Tool-agnostic prompt | Repository automation |
| Manual audio ingress and `ManualAudioReturn@1` | Future deterministic manual-audio-ingress interface | Durable locator ID/envelope hash plus separately supplied matching ephemeral locator, exact prompt attempt, source label, rights, declared payoff/gain, actor/reason | URL/directory/glob expansion, putting a host locator in Ledger/candidate/diagnostic/receipt, automatic payoff inference |
| No-track selection | Human | Actual accepted AudioBrief and prompt attempt at `WAITING_FOR_MANUAL_MUSIC` | Bypassing prompt generation or relabeling stale picture evidence |
| Alignment, mux, delivery manifests | Future deterministic local tools | Accepted staged return or exact no-track selection plus current locked-picture lineage | Peak inference, picture retiming, remote provider contact |

Reviewer `ship` means that review found no blocking issue in its own domain. It is necessary but is not approval. The orchestrator coordinates gates but cannot grant creative or artifact authority to itself.

Roles and reviewers own only the semantics of immutable candidate/attempt outputs and have `writes: []`; they submit canonical bytes through the opaque trusted candidate writer, which alone creates their Ledger-allocated paths. Only external acceptance establishes canonical identity. Recoverable waits—including unavailable future interfaces, manual music, and capability implementation—preserve their exact workflow state; terminal `STOP` is not a waiting room.

## Host and media boundary

Roles run as local Codex or Claude Code prompts. They may use supported user-supplied local sources, but the repository has no model runtime, credential flow, external-media integration, generated-image/video substrate, or hosted application. Pure-code 2D motion is the fixed V1 medium.
