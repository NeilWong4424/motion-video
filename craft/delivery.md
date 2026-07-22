# Delivery Craft

## Purpose / Use when

Use to assess whether a silent or optionally mixed delivery has the required current evidence and clean provenance.

## Reads

Read current revision, RenderPlan binding, QC, reviews, Preview Approval, Render Manifest, silent master metadata, and—if present—the returned local audio declaration and mix evidence.

## Writes

None. This module performs no artifact writes.

## Must

- Treat an approved silent master plus the future `MUSIC_PROMPT.md` interface as a valid delivery state when no local track returns.
- Bind every delivery statement to one exact project, revision, plan, and evidence set; preserve immutable, content-addressed attempts.
- Keep editable project source by reference and distinguish silent from optional locally mixed delivery.
- Require fresh approval and evidence after any change that invalidates locks or bindings.
- State that render, mux, and delivery commands are deferred executable interfaces not implemented in Part 1.

## Must not

- Treat a mutable “latest” label as authority, overwrite prior attempts, bypass review/QC/approval, or claim a delivery file was produced without local evidence.
- Promise remote generation, automatic payoff detection, or a clean-room archive not supported by evidence.

## Stop conditions

Stop when evidence is missing, stale, mismatched, or points across revisions/plans; also stop on output collision or an undeclared local audio payoff.

## Output schema

None.
