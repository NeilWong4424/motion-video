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
  /** Validated effect intent carried from the resolver; falls back to the
   * capability fixture default when absent or malformed. */
  intent?: unknown;
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
    // Use the intent carried from the resolver (author props validated at bind
    // time). Re-parse defensively — the plan JSON is untrusted at the runtime
    // boundary — and fall back to the fixture default when absent or malformed,
    // so pre-existing plans without an intent render exactly as before.
    const parsedIntent = def.intentSchema.safeParse(binding.intent);
    const intent = parsedIntent.success ? parsedIntent.data : def.fixture.intent;
    const resolved = def.resolve(intent, {
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
