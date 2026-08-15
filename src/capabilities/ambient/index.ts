import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {ambientDrift} from './drift.js';
import {ambientSoftShadow} from './soft-shadow.js';

export {ambientDrift, ambientSoftShadow};

export const ambientEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  ambientDrift,
  ambientSoftShadow,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerAmbientEffects(registry: CapabilityRegistry): void {
  for (const effect of ambientEffects) registry.registerEffect(effect, 'core');
}
