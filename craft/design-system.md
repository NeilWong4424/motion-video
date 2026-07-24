# Design System

## Purpose / Use when

Use to lift a film from raw primitives to a designed, broadcast-grade baseline. This
module carries the concrete values (palette, type ladder, spacing, radius, shadow,
easing) of the `styles/broadcast-noir@1.0.0` and `styles/broadcast-daylight@1.0.0`
packs and a library of reusable node + effect recipes. Load it whenever a Treatment or
MotionSpec needs a professional visual baseline instead of hand-picked hex and flat
shapes, or when the reviewer flags amateur styling (crayon primaries, default type,
eyeballed layout, lifeless motion).

## Reads

Read the Brief constraints, approved Treatment (its `stylePackId` and `motionProfile`),
the selected style pack values in `src/styles/production-packs.ts`, the honored renderer
props (`base.text`, `base.shape`, `base.path`), the runtime capability set, and
`craft/style-system.md` (higher-level coherence) plus `craft/motion-craft.md` (timing).

Critical namespace note: `treatment.stylePackId` is a validated string only. The engine
does **not** read the style pack and auto-apply its values to nodes — nothing substitutes
tokens into renderer props at resolve time. You apply the system by hand: copy the pack's
concrete values into each node's `renderer.props`, and mirror them into the MotionSpec
`registries.tokens` so they are declared and editable via the `set-token` revision op.

## Writes

None. This module performs no artifact writes.

## Must

- Use one palette family per film. Pick `broadcast-noir` (dark) or `broadcast-daylight`
  (light) and take every color from it — never introduce off-palette hex.
  - noir: bg `#0a0e14`, surface `#121821`, surfaceRaised `#1a212c`, ink `#f2f5f9`,
    muted `#8b97a8`, line `#232c39`, accent `#e0a43b`, accentQuiet `#7a5f2a`,
    support `#5b8fb0`.
  - daylight: bg `#f4f6f9`, surface `#ffffff`, ink `#131922`, muted `#5b6675`,
    line `#dce2ea`, accent `#1f6feb`, accentQuiet `#9fc0f2`, support `#0f9d7a`.
- Restrain accent use. Accent marks the ONE thing that matters in a beat (the hero
  number, the payoff). Everything structural is neutral (surface/line/muted). Support
  is rare — a second data series or a secondary relationship only.
- Use the type ladder for real hierarchy. Weights come from the pack typography roles;
  sizes (the pack has no size field) come from this ladder, applied to `base.text`
  `lines[].fontSize` (px on a 1080p canvas):
  - display 104 / weight 720 / trackingEm -0.02  (hero title, big stat)
  - headline 64 / weight 620 / trackingEm -0.012
  - title 40 / weight 560
  - body 28 / weight 400 / lineHeight 1.5
  - caption 22 / weight 520 / trackingEm 0.06  (uppercase eyebrow/label)
- Put every font-size, color, and spacing value used by nodes into `registries.tokens`
  with the correct `semanticRole`, then reference the same value in `renderer.props`.
  This makes the design lockable and revisable via `set-token`.
- Lay out on the spacing ramp (xs 8, sm 12, md 20, lg 32, xl 56, xxl 96, hero 160), not
  by eyeball. Keep consistent margins and a consistent gap between an eyebrow and its
  title (`md`), a title and its body (`sm`).
- Give surfaces depth: `base.shape` rounded-rect with `fill: surface`, `stroke: line`,
  `strokeWidth: 1.5`, `radius` from the pack (`lg` for cards). Pair with `ui.card-lift`
  for a settling drop-shadow rather than a flat fill.
- Use only the four real easings: `linear`, `easeOutExpo`, `easeOutQuart`,
  `easeInOutQuint`. The pack `motion` block already binds hero/standard/travel to the
  valid three; never invent an easing name (the runtime throws `EASING_UNKNOWN`).
- Enter with motion, never a hard pop. Every hero element uses an entrance effect (see
  recipes). Hold beats long enough to read; let motion settle with overshoot easing.

## Reusable recipes

Each recipe lists the honored renderer props and the effect stack. Effects own motion
channels; two effects owning the SAME channel over OVERLAPPING frames are rejected as a
channel conflict, so only stack disjoint-channel effects (or sequence them in
non-overlapping ranges). Attach effects only to their `supportedNodeKinds` — the pipeline
does not enforce kind-matching, so this is your responsibility.

1. **Hero title** — `base.text`, `lines[]` at display (104px), `color: ink`,
   `fontWeight: 720`. Entrance: `text.mask-rise` (channels geometry+opacity) outermost +
   `text.tracking-resolve {fromTrackingEm: 0.12}` (channel style) inner. Disjoint →
   stackable. The title rises behind a mask while its letter-spacing settles to zero.
2. **Eyebrow / kicker** — `base.text` caption role (22px, weight 520, trackingEm 0.06,
   UPPERCASE copy), `color: muted`, placed `md` above the hero title. Entrance:
   `text.word-stagger {staggerMs: 40}` (channel opacity). Words fade in on a stagger.
3. **Stat number** — `base.text` display weight, `color: accent`, with a caption label
   beneath in `muted`. Entrance: `text.tracking-resolve {fromTrackingEm: 0.2}`; optional
   emphasis `text.highlight-sweep {color: "#e0a43b"}` (channel filter — disjoint from
   tracking's style channel, so stackable).
4. **Card / panel** — `base.shape` rounded-rect, `fill: surface`, `stroke: line`,
   `strokeWidth: 1.5`, `radius: 24` (lg). Entrance: EITHER `shape.shape-reveal
   {from: "scale"}` OR `ui.card-lift {liftPx: 20}` — both touch the geometry channel, so
   do not overlap them; pick one, or sequence them in separate ranges. `card-lift` adds
   the settling drop-shadow that reads as `shadow.raised`.
5. **Connector / relationship line** — `base.path` with a whitelisted `d`,
   `stroke: accentQuiet`, `strokeWidth: 2`. Reveal with EITHER `path.path-draw
   {pathLength: N}` OR `path.connector-draw {withArrow: true}` — both own the `path`
   channel, so never stack two path effects over the same window. Emphasize a terminal
   node with `diagram.node-connect {pop: 0.1}`.

## Authoring pitfalls (learned in production)

- **Multi-line `base.text` `lines[]` is overridden by the layout engine.** The layout
  service fits a single line from `renderer.props.text` and injects `resolvedLines`, so an
  authored `lines[]` array (e.g. an eyebrow above a big number in one node) does NOT
  render as authored. For a two-size stack (eyebrow + number), use **two separate text
  nodes** — a caption-role eyebrow node and a display-role number node — each with its own
  single `text` and geometry. Add the eyebrow node to the beat's `liveContentNodeIds`.
- **A camera pan/zoom clips edge-anchored world text.** When a beat's camera segment
  offsets (e.g. `to.x = 160`, `zoom > 1`), left-anchored text at a small x can be pushed
  off the left edge. Shift the x of text on panned beats to compensate (roughly by the
  camera x offset), or keep captions centered.
- **`text.mask-rise` can clip a title out of view at some geometries.** It owns
  geometry+opacity and renders text rising behind a clip mask; if the number never
  appears, swap to `text.tracking-resolve` (style channel only, no clip) for a reliable
  entrance.
- **Keep the shared-element bridge anchor salient.** The swarm→groups (and any
  shared-element) bridge needs its shared node to be the beat `focalNodeId` or carry ≥10%
  weighted salience, or validation raises `ANCHOR_NOT_SALIENT` + `SLIDE_LIKE_CUT_PATTERN`.
  Make the persisting element (the dot/tile spine) the `focalNodeId` of both beats.

## Must not

- Expect `stylePackId` to auto-apply the pack. It does not; you copy values into props
  and tokens by hand (see Reads). Do not report a film as "styled" merely because the
  treatment names a pack.
- Use primary/crayon colors (pure `#ff0000`, `#00ff00`, `#0000ff`, saturated yellow) or
  off-palette hex. Take every color from one pack.
- Stack two effects that own the same channel over overlapping frames (geometry, opacity,
  content, style, path, filter). This is a hard channel-conflict error at render.
- Invent an easing name outside the four registered ones.
- Attach a text effect to a shape/path node (or vice versa) against its
  `supportedNodeKinds`; the pipeline will not stop you, but it produces wrong output.
- Add ornament that does not serve the message, or make a held shot busy for its own sake.

## Stop conditions

Stop when a Brief constraint forbids the chosen palette or accessible contrast, when the
required copy cannot remain legible at the type ladder, when a needed effect intensity is
outside its capability's intent range, or when a recipe would require a sixth
positive-transition family or a second same-channel effect over one window.

## Output schema

None.
