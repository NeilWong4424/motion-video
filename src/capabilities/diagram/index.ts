import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {diagramNodeConnect} from './node-connect.js';

export {diagramNodeConnect};

export const diagramEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  diagramNodeConnect,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerDiagramEffects(registry: CapabilityRegistry): void {
  for (const effect of diagramEffects) registry.registerEffect(effect, 'core');
}
