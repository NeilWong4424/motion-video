# Revision Workflow

## Purpose / Use when

Use after the initial snapshot whenever a user or reviewer requests a visual-source change. This workflow preserves locks and routes every change through a new revision. Its proposed executable interfaces are not implemented in Part 1.

## Reads

Read the verbatim request, base revision, expected Brief/Treatment/Motion hashes, current source artifacts, semantic locks, diagnostics, and required review issue IDs for structural rebuilds.

## Writes

None in Part 1. The Revision Interpreter alone may own a future `SemanticPatch@1`; this workflow never directly edits source.

## Must

- Require `SemanticPatch` for every post-snapshot visual change and preserve locks, base hashes, and unrelated semantic entities.
- Use bounded mode for fine-grained permitted changes; a bounded patch cannot add, remove, reorder, or replace Beats, bridges, nodes, camera segments, or motion cues.
- Use rebuild mode only for genuine structural replacement, tied to the user instruction and required review issue IDs.
- Create a new revision, calculate the declared impact set, invalidate dependent previews/reviews/QC/approval/audio evidence, then route through validation and all required gates again.
- Keep locks explicit and stop when an operation would touch a locked or unrelated field.

## Must not

- Directly edit source, create a second snapshot path, disguise a structural request as bounded, silently redesign unrelated material, or reuse stale approval/audio evidence.
- Let a reviewer mutate source or let a patch bypass the capability-gap route.

## Stop conditions

Stop on stale base hashes, ambiguous target, lock conflict, undeclared impact, out-of-scope request, or structural change without its required user/review linkage.

## Output schema

Future only: `SemanticPatch@1` with mode (`bounded` or `rebuild`), base hashes, semantic operations, impact targets, locks, source instruction, reason, and rebuild review issue IDs where required. Apply/rebuild tools are not implemented in Part 1.
