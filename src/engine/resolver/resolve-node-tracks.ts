import type {MotionSpec, PersistentNode} from '../../contracts/motion-spec.js';
import type {z} from 'zod';
import type {ResolvedKeyframeSchema, ResolvedRegionSchema} from '../../contracts/resolved-motion.js';
import type {LayoutService, LayoutContext, ResolvedTimeline} from './types.js';
import {resolveSegmentRef} from './resolve-timeline.js';

type ResolvedKeyframe = z.infer<typeof ResolvedKeyframeSchema>;
type ResolvedRegion = z.infer<typeof ResolvedRegionSchema>;

export type ResolvedNodeTracks = {
  id: string;
  zIndex: number;
  localBounds: ResolvedRegion;
  worldBounds: ResolvedRegion;
  resolvedLines?: Array<{text: string; x: number; y: number; fontSize: number}>;
  geometryTrack: ResolvedKeyframe[];
  styleTrack: ResolvedKeyframe[];
  contentTrack: ResolvedKeyframe[];
  visibleTrack: ResolvedKeyframe[];
};

type SourceKeyframe = {
  at: {segmentId: string; progress: number};
  value: unknown;
  interpolation: 'hold' | 'linear' | 'ease';
  easing?: string | undefined;
};

function resolveTrack(timeline: ResolvedTimeline, track: readonly SourceKeyframe[]): ResolvedKeyframe[] {
  const resolved = track.map((k) => ({
    frame: resolveSegmentRef(timeline, k.at),
    value: k.value,
    interpolation: k.interpolation,
    ...(k.easing !== undefined ? {easing: k.easing} : {}),
  }));
  // Frames must be non-decreasing; equal frames allowed only when hold+equal.
  for (let i = 1; i < resolved.length; i++) {
    const prev = resolved[i - 1]!;
    const cur = resolved[i]!;
    if (cur.frame < prev.frame) {
      throw new Error('TRACK_FRAME_DECREASING');
    }
    if (cur.frame === prev.frame) {
      const sameValue = JSON.stringify(cur.value) === JSON.stringify(prev.value);
      if (!(cur.interpolation === 'hold' && sameValue)) {
        throw new Error('TRACK_DUPLICATE_FRAME');
      }
    }
  }
  return resolved;
}

function composeWorldBounds(
  node: PersistentNode,
  local: ResolvedRegion,
  byId: Map<string, PersistentNode>,
  layout: LayoutService,
  ctx: LayoutContext,
  seen: Set<string>,
): ResolvedRegion {
  if (seen.has(node.id)) return local;
  seen.add(node.id);
  if (node.parentId === undefined) return local;
  const parent = byId.get(node.parentId);
  if (!parent) return local;
  const parentLocal = layout.resolveNode(parent, ctx);
  const parentWorld = composeWorldBounds(
    parent,
    {x: parentLocal.x, y: parentLocal.y, width: parentLocal.width, height: parentLocal.height},
    byId,
    layout,
    ctx,
    seen,
  );
  return {
    x: parentWorld.x + local.x,
    y: parentWorld.y + local.y,
    width: local.width,
    height: local.height,
  };
}

/**
 * Resolve every declared node once. Geometry is parent-local; world bounds are
 * composed deterministically. A node absent from a beat is hidden through its
 * visibility track, never omitted.
 */
export function resolveNodeTracks(
  spec: MotionSpec,
  timeline: ResolvedTimeline,
  layout: LayoutService,
): ResolvedNodeTracks[] {
  const ctx: LayoutContext = {
    canvasWidth: spec.canvas.width,
    canvasHeight: spec.canvas.height,
    safeAreaInset: Math.round(spec.canvas.width * 0.05),
  };
  const byId = new Map(spec.world.nodes.map((n) => [n.id, n]));

  return spec.world.nodes.map((node, index) => {
    const layoutResult = layout.resolveNode(node, ctx);
    const local: ResolvedRegion = {
      x: layoutResult.x,
      y: layoutResult.y,
      width: layoutResult.width,
      height: layoutResult.height,
    };
    const worldBounds =
      node.space === 'world'
        ? composeWorldBounds(node, local, byId, layout, ctx, new Set())
        : local;

    return {
      id: node.id,
      zIndex: index,
      localBounds: local,
      worldBounds,
      ...(layoutResult.lines ? {resolvedLines: layoutResult.lines} : {}),
      geometryTrack: resolveTrack(timeline, node.geometryTrack),
      styleTrack: resolveTrack(timeline, node.styleTrack),
      contentTrack: node.contentTrack ? resolveTrack(timeline, node.contentTrack) : [],
      visibleTrack: resolveTrack(timeline, node.visibleTrack),
    };
  });
}
