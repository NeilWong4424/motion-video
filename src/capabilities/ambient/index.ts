import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {ambientDrift} from './drift.js';

export {ambientDrift};

export const ambientEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  ambientDrift,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerAmbientEffects(registry: CapabilityRegistry): void {
  for (const effect of ambientEffects) registry.registerEffect(effect, 'core');
}
