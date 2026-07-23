import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {pathDraw} from './path-draw.js';
import {connectorDraw} from './connector-draw.js';

export {pathDraw, connectorDraw};

export const pathEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  pathDraw,
  connectorDraw,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerPathEffects(registry: CapabilityRegistry): void {
  for (const effect of pathEffects) registry.registerEffect(effect, 'core');
}
