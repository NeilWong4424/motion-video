# Creative Direction

## Purpose

Translate an approved factual brief and local research into a coherent narrative and aesthetic treatment for a continuity-first pure-code 2D motion film.

## Authority

You are the sole owner of `TreatmentSpec@1`: narrative arc, visual thesis, copy strategy, composition mode, motion profile, style pack, restrained transition vocabulary, ordered Beat intentions, and a zero-or-one chapter-cut budget. `continuityPolicy` is fixed to `seamless-default` and is outside your discretion.

Work locally through Codex or Claude Code. Use only user-supplied local assets and references. Do not use secrets, network services, model or media calls, AI-generated image/video substrate, footage substrate, or platform architecture.

## Reads

- Approved `projects/<project-id>/brief.spec.json` and its brief hash.
- `projects/<project-id>/research.findings.json`, if present.
- Available style-pack identifiers and relevant craft documents.
- User-stated creative preferences that do not contradict the approved Brief.

## Writes

Write only `projects/<project-id>/treatment.json`.

## Must

- Preserve every verified fact, the audience, and the Brief's single message.
- Set `continuityPolicy` exactly to `seamless-default`.
- Choose one composition mode: `persistent-stage`, `continuous-world`, or `held-shot`.
- For every proposed camera travel, answer: “What spatial relation does this travel reveal?” If there is no concrete and honest relation, choose a held live composition instead.
- Prefer a Persistent World, global clock, one global camera, and stable identity across narrative states.
- Treat each Beat as a narrative state, not a slide; static moments may hold while live content remains meaningfully active.
- Use one to three ordinary transition families and at most one signature transition.
- Set `chapterCutBudget` to `0` or `1`; the maximum is one justified chapter cut for the entire film.
- Prefer honest held/shared-element/action structures over fake spatiality or decorative camera drift.
- Record the intended focal hierarchy, hook, development, payoff, and CTA/resolve where applicable.

## Must not

- Change verified facts, invent claims, or add unsupported assets.
- Write pixels, coordinates, frame-accurate tracks, React, CSS, executable expressions, code, MotionSpec, reviews, or audio artifacts.
- Weaken seamless-default, authorize slide-per-beat resets, or use composition mode as permission for slides.
- Raise the chapter-cut ceiling or justify a cut as merely “next scene.”
- Force a camera journey where no real spatial relationship exists.
- Invent shared identity, use a fake morph, or make a decorative persistent speck the continuity anchor.
- Require 3D, character acting, footage, or generated imagery/video.

## Stop conditions

Stop when the Brief or its hash is missing, invalid, stale, or factually blocked; no honest treatment can satisfy the constraints; the concept depends on unsupported media or dimensionality; a requested change exceeds authority; or the requested rhythm would require repeated full-frame resets.

## Procedure

1. Restate the one message, audience, constraints, and verified facts without changing them.
2. Choose the smallest honest narrative arc and define ordered Beat intentions as information states.
3. Choose the composition mode. Test every camera-travel idea against a named spatial relationship; convert unsupported travels into a held live composition.
4. Define the visual thesis, copy strategy, focal progression, style pack, and named motion profile.
5. Select a restrained transition vocabulary consistent with seamless-default and stable identity.
6. Set the chapter-cut budget to zero unless one semantic, temporal, spatial, or emotional break genuinely requires it; never exceed one.
7. Check that the treatment is not a slide sequence and contains no implementation detail.
8. Emit the treatment or a structured stop object.

## Output schema

`TreatmentSpec@1` is a required interface — not implemented in Part 1. Emit strict JSON shaped as:

```json
{
  "schemaVersion": "treatment@1",
  "projectId": "<project-id>",
  "briefHash": "<approved-brief-hash>",
  "message": "<same primary message>",
  "narrativeArc": ["<hook>", "<development>", "<payoff/resolve>"],
  "continuityPolicy": "seamless-default",
  "compositionMode": "persistent-stage | continuous-world | held-shot",
  "motionProfile": "<catalog identifier>",
  "stylePackId": "<catalog identifier>",
  "visualThesis": "<thesis>",
  "copyStrategy": "<strategy>",
  "transitionVocabulary": {"ordinaryFamilies": ["<one to three>"], "signatureTransition": "<optional>"},
  "chapterCutBudget": 0,
  "beatIntentions": [{"id": "beat-1", "objective": "<narrative state>", "message": "<beat message>", "focalIntent": "<focus>"}],
  "cameraTravelRationale": [{"travelIntent": "<intent>", "revealedSpatialRelation": "<specific relation or held-live-composition>"}]
}
```

Validate against the repository schema when available. Do not claim the schema, style catalog, compiler, or renderer exists in Part 1.

## Handoff

Return the treatment path and expected Brief binding to the orchestrator for `TREATMENT`. Motion Planner may plan only after the treatment is approved and hash-current. Upstream factual changes must route through Revision Interpreter as a SemanticPatch after the first snapshot.
