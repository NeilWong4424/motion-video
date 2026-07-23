import * as React from 'react';

import type {RenderPlan} from '../../contracts/render-plan.js';
import {evaluateTrack, type RenderTrack} from './evaluate-track.js';
import {NodeRendererHost} from './NodeRendererHost.js';
import {EffectStackHost} from './EffectStackHost.js';

type PlanNode = RenderPlan['nodes'][number];

export type PersistentNodeHostProps = {
  node: PlanNode;
  frame: number;
};

type Geometry = {x: number; y: number; scale?: number; rotationDeg?: number};
type Style = {opacity?: number; color?: string; backgroundColor?: string};

/**
 * Evaluate one persistent node's tracks at the current frame and render it with
 * a stable key. The node stays mounted for the full film; it becomes visually
 * absent only through opacity/off-canvas geometry, never a beat remount.
 */
export const PersistentNodeHost: React.FC<PersistentNodeHostProps> = ({node, frame}) => {
  // A node is hidden before its first visibility keyframe when that keyframe is
  // after frame 0: it has not entered the world yet. Otherwise the track value
  // (clamped) applies.
  const firstVisFrame = node.visibleTrack[0]?.frame ?? 0;
  const visible =
    frame < firstVisFrame ? 0 : evaluateTrack(node.visibleTrack as RenderTrack<number>, frame);
  const geometry = evaluateTrack(node.geometryTrack as RenderTrack<Geometry>, frame);
  const style = node.styleTrack.length
    ? evaluateTrack(node.styleTrack as RenderTrack<Style>, frame)
    : {};
  const content =
    node.contentTrack.length > 0
      ? (evaluateTrack(node.contentTrack as RenderTrack<{text?: string}>, frame) ?? {})
      : {};

  const opacity = (style.opacity ?? 1) * visible;

  const transform = [
    `translate(${geometry.x}px, ${geometry.y}px)`,
    geometry.scale !== undefined ? `scale(${geometry.scale})` : '',
    geometry.rotationDeg !== undefined ? `rotate(${geometry.rotationDeg}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sourceProps = (node.rendererProps ?? {}) as Record<string, unknown>;
  const mergedProps: Record<string, unknown> = {
    ...sourceProps,
    ...(node.resolvedLines ? {lines: node.resolvedLines} : {}),
    ...content,
    ...(style.color ? {color: style.color} : {}),
  };

  return (
    <div
      data-node-id={node.key}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform,
        transformOrigin: 'top-left',
        opacity,
        width: node.localBounds.width,
        height: node.localBounds.height,
      }}
    >
      <EffectStackHost effects={node.effects} frame={frame}>
        <NodeRendererHost
          rendererId={node.renderer.id}
          rendererVersion={node.renderer.version}
          props={mergedProps}
          frame={frame}
        />
      </EffectStackHost>
    </div>
  );
};
