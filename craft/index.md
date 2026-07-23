# Motion Craft Index

## Purpose / Use when

Use this index as a human-readable explanation of craft routing after the machine loader has bootstrapped from `skill-manifest.json`. This file is neither the machine entry point nor a second selector. Craft is procedural guidance, not an authority layer: it never changes the owner of a canonical artifact.

## Reads

Always read `skill-manifest.json` first. The loader then uses only that manifest's `file` and transitive `requires` fields to load this index or another craft module. Read the applicable role contract, workflow state, task trigger, current approved upstream artifacts, and the fixed-scope and artifact contracts as required by the selected entry. Apply precedence in this order: fixed scope, authority, and schemas; workflow gates; applicable craft; illustrative examples.

## Writes

None. Craft modules perform no artifact writes.

## Must

- Bootstrap only from `craft/skill-manifest.json`; never bootstrap from this index or any individual module. Treat the manifest as the single machine-readable craft loader contract. Select an entry only when the current reader role is in `readerRoles`, the current state is in `workflowStates`, and at least one declared `triggerConditions` item matches the actual task.
- Verify every selected entry's `entryConditions`, then load only its `file` plus the transitive files named by `requires`. A required skill must also be read-only; dependencies do not need a second task-trigger match.
- If no entry matches, continue without domain craft or route to the owning workflow. Do not load all craft files as background context.
- Check each selected module's `exitEvidence` before the role hands off its own artifact. Missing exit evidence blocks that handoff; it never authorizes craft to write the evidence.
- Route creative direction and motion planning to `motion-craft.md`, `continuity-first.md`, and only the domain module actually triggered.
- Route actual spatial travel to `continuous-world.md` and `camera-choreography.md`; do not load them for a held camera merely because the film is continuity-first.
- Route visual-system decisions to `style-system.md`; route type, shapes, data, diagrams, UI, identity, and ambient work only to their matching triggered modules.
- Route AudioBrief language to `sound-design.md` and the sole workflow at `../docs/workflows/audio-handoff.md`. Sound Designer routing ends after its `AUDIO_BRIEF` candidate handoff; deterministic `AUDIO_PROMPT`, manual generation, ingress, mux, and delivery are outside the role.
- Route read-only delivery gate assessment to the orchestrator through `delivery.md`; actual render, alignment, mux, and delivery remain future deterministic interfaces.
- Route a persisted capability gap or requested revision to the workflow documents under `../docs/workflows/`. `capability-gap.md` is a workflow document, not a craft skill: it has no craft skill ID, `readerRoles`, `workflowStates`, or `requires` route, and the craft manifest must not be used to load it for Capability Builder. Role/workflow routing must load that workflow through its owning prompt and workflow contract; it does not become a craft-manifest write.
- Treat all executable names in these documents as deferred interfaces, not implemented in Part 1. A role returns `RoleResult@1.status="written"` after writing valid candidate bytes; the orchestrator separately routes ordinary validation through `artifact-validation-and-hashing`. An unavailable acceptance, resolver, renderer, approval recorder, audio-prompt, mux, or delivery interface creates the exact typed same-state pause. Temporary interface absence never becomes terminal `STOP`; only an unrecoverable current request or explicit abandonment may do so.

## Must not

- Grant a craft module authority to write, approve, render, alter locks, or bypass a gate.
- Interpret `readerRoles`, `workflowStates`, dependencies, entry conditions, or exit evidence as artifact ownership.
- Eager-load every craft module, select a module from topic similarity alone, treat this human index as a machine bootstrap, or load a craft dependency that is not declared in `requires`.
- Let illustrative timing override an approved motion profile or continuity policy.
- Duplicate or replace the audio handoff workflow.

## Stop conditions

Stop and route to the owning role or workflow when the manifest is missing/invalid, a required dependency or entry condition is unavailable, a required link is missing, a craft rule conflicts with a schema or policy, or a request needs an artifact write.

## Output schema

None.

## Human routing reference

This table explains manifest entries to people. It does not select or load a module; machine loading still begins with `craft/skill-manifest.json` and follows only the selected entry's `file` and transitive `requires`.

| Need | Module |
| --- | --- |
| General hierarchy, holds, vocabulary | `motion-craft.md` |
| Seam, bridge, cut exception | `continuity-first.md` |
| Real spatial navigation | `continuous-world.md`, `camera-choreography.md` |
| Palette, type, texture coherence | `style-system.md` |
| Copy-led motion | `kinetic-type.md` |
| Geometry and paths | `shape-path-motion.md` |
| Quantitative values | `data-motion.md` |
| Systems and relationships | `diagram-motion.md` |
| Supplied product states | `ui-motion.md` |
| Brand mark or identity asset | `logo-motion.md` |
| Subordinate atmosphere | `ambient-motion.md` |
| Locked-cut music language | `sound-design.md` |
| Release evidence | `delivery.md` |
