import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {uiCardLift} from './card-lift.js';

export {uiCardLift};

export const uiEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  uiCardLift,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerUiEffects(registry: CapabilityRegistry): void {
  for (const effect of uiEffects) registry.registerEffect(effect, 'core');
}
