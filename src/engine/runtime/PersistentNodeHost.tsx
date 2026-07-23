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
  const visible = evaluateTrack(node.visibleTrack as RenderTrack<number>, frame);
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

  const rendererProps = {...(node.renderer as {props?: unknown}), ...content} as Record<string, unknown>;
  const mergedProps = {
    ...(typeof (node as {rendererProps?: unknown}).rendererProps === 'object' ? {} : {}),
    ...(rendererProps.props as Record<string, unknown> | undefined),
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
