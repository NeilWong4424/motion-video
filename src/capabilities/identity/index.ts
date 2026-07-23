import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {identityLogoAssemble} from './logo-assemble.js';

export {identityLogoAssemble};

export const identityEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  identityLogoAssemble,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerIdentityEffects(registry: CapabilityRegistry): void {
  for (const effect of identityEffects) registry.registerEffect(effect, 'core');
}
