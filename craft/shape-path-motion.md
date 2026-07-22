# Shape and Path Motion

## Purpose / Use when

Use for abstract geometry, lines, paths, masks, and drawn relations that carry meaning in pure-code 2D motion.

## Reads

Read the Treatment visual thesis, MotionSpec intent, `motion-craft.md`, `style-system.md`, and `continuity-first.md`.

## Writes

None. This module performs no artifact writes.

## Must

- Give a shape or path a semantic job: containment, connection, direction, emphasis, progress, or transformation.
- Preserve stable node identity when the same object changes geometry; a genuine morph arrives at the stable real target.
- Bind a path's draw, reveal, trim, or transform to a focal action and provide an endpoint hold when it conveys information.
- Keep control points, anchors, joins, and transform origins coherent in the shared coordinate system.
- Use profile-bound starting ranges only and reduce movement when the path is supportive rather than focal.

## Must not

- Fake identity by replacing a shape with a similar copy, use path motion as wallpaper, or create an unreadable knot of simultaneous draws.
- Use geometry to imply a relationship the Brief does not support.

## Stop conditions

Stop when the path cannot retain identity, its endpoint is not a stable real target, or its movement hides the relation it is meant to explain.

## Output schema

None.
