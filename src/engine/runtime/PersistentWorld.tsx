import * as React from 'react';

import type {RenderPlan} from '../../contracts/render-plan.js';
import {CameraHost} from './CameraHost.js';
import {ScreenSpaceHost} from './ScreenSpaceHost.js';
import {PersistentNodeHost} from './PersistentNodeHost.js';
import {evaluateTrack, type RenderTrack} from './evaluate-track.js';

export type PersistentWorldProps = {
  plan: RenderPlan;
  frame: number;
};

/**
 * The world mounts once for the full duration. It maps the complete node array
 * every frame — never filtering a node out by beat — and splits world-space
 * nodes (under the single camera) from persistent screen-space overlays.
 */
export const PersistentWorld: React.FC<PersistentWorldProps> = ({plan, frame}) => {
  const worldNodes = plan.nodes.filter((n) => n.layer === 'world');
  const screenNodes = plan.nodes.filter((n) => n.layer === 'screen');

  const camera = evaluateTrack(
    plan.camera.samples.map((s) => ({
      frame: s.frame,
      value: {x: s.x, y: s.y, zoom: s.zoom},
      interpolation: 'linear' as const,
    })) as RenderTrack<{x: number; y: number; zoom: number}>,
    frame,
  );

  return (
    <div data-persistent-world style={{position: 'absolute', inset: 0}}>
      <CameraHost x={camera.x} y={camera.y} zoom={camera.zoom}>
        {worldNodes.map((node) => (
          <PersistentNodeHost key={node.key} node={node} frame={frame} />
        ))}
      </CameraHost>
      <ScreenSpaceHost>
        {screenNodes.map((node) => (
          <PersistentNodeHost key={node.key} node={node} frame={frame} />
        ))}
      </ScreenSpaceHost>
    </div>
  );
};
