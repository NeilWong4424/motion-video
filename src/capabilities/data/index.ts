import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {dataBarGrow} from './bar-grow.js';

export {dataBarGrow};

export const dataEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  dataBarGrow,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerDataEffects(registry: CapabilityRegistry): void {
  for (const effect of dataEffects) registry.registerEffect(effect, 'core');
}
