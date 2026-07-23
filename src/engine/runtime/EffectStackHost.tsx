import * as React from 'react';

import {
  textEffects,
  shapeEffects,
  pathEffects,
  dataEffects,
  diagramEffects,
  uiEffects,
  identityEffects,
  ambientEffects,
} from '../../capabilities/index.js';
import type {MotionCapabilityDefinition} from '../capability/types.js';

const effectById = new Map<string, MotionCapabilityDefinition<unknown, unknown>>(
  [
    ...textEffects,
    ...shapeEffects,
    ...pathEffects,
    ...dataEffects,
    ...diagramEffects,
    ...uiEffects,
    ...identityEffects,
    ...ambientEffects,
  ].map((e) => [`${e.id}@${e.version}`, e]),
);

export type EffectBinding = {
  id: string;
  version: string;
  fromFrame: number;
  toFrame: number;
};

export type EffectStackHostProps = {
  effects: readonly EffectBinding[];
  frame: number;
  children: React.ReactNode;
};

/**
 * Apply the ordered, already-resolved effect stack around a stable renderer.
 * Each effect wraps the child with a normalized progress computed from its
 * resolved frame window; the effect component must not replace the child's
 * continuity root. Effects outside the core set are ignored (never invented).
 */
export const EffectStackHost: React.FC<EffectStackHostProps> = ({effects, frame, children}) => {
  let node = children;
  // Apply in reverse so the first-declared effect is outermost.
  for (let i = effects.length - 1; i >= 0; i--) {
    const binding = effects[i]!;
    const def = effectById.get(`${binding.id}@${binding.version}`);
    if (!def) continue;
    const span = Math.max(1, binding.toFrame - binding.fromFrame);
    const progress = Math.min(1, Math.max(0, (frame - binding.fromFrame) / span));
    const resolved = def.resolve(def.fixture.intent, {
      seed: '',
      fps: 30,
      fromFrame: binding.fromFrame,
      toFrame: binding.toFrame,
    });
    const Component = def.Component as React.ComponentType<{
      resolved: unknown;
      frame: number;
      progress: number;
      children?: React.ReactNode;
    }>;
    node = (
      <Component resolved={resolved} frame={frame} progress={progress}>
        {node}
      </Component>
    );
  }
  return <>{node}</>;
};
