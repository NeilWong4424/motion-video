# Diagnostic contract

Diagnostics are evidence, not permission for silent repair. Future deterministic interfaces and role reviews must emit stable codes, severity (`info`, `warning`, `blocking`), exact artifact/hash binding, semantic target IDs, frame/range evidence where relevant, a human-readable explanation, and the legal next route. A blocking diagnostic prevents Preview Approval, silent final, mux, or delivery until new current evidence clears it.

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
- `PARENT_HASH_MISMATCH`: an artifact does not bind its current parent.
- `REVISION_STALE`: the requested patch or derived action targets an old revision.
- `LOCK_CONFLICT`: actual or requested impact touches a semantic lock.
- `IMPACT_SET_MISMATCH`: actual changes fall outside declared impact.
- `GATE_EVIDENCE_MISSING`: QC, either review, approval, preview, or manifest is absent.
- `GATE_EVIDENCE_STALE`: gate evidence points to another revision or RenderPlan.
- `REPAIR_BUDGET_EXHAUSTED`: one structural or two bounded visual passes have been consumed with a blocker unresolved.
- `AUDIO_RENDER_PLAN_STALE`: AudioBrief/prompt/return/mix does not bind the approved locked picture.
- `MANUAL_AUDIO_DECLARATION_MISSING`: returned audio lacks local path, source label, user-declared payoff, or gain.

## Repair and stop behavior

The orchestrator counts repair passes globally per review cycle. Reviewers remain read-only; a finding routes through Revision Interpreter. Both bounded and rebuild paths require a SemanticPatch and a new revision. A rebuild requires the triggering issue IDs and source user instruction. After any successful visual patch, old render, QC, review, approval, audio, mux, and delivery evidence becomes stale.

Truth-critical ambiguity, unsupported scope, unresolved capability gap, stale evidence, an unavailable honest continuity route, any blocking gate, Preview Gate, manual music handoff, or exhausted budget is a stop—not an invitation to fabricate success.
