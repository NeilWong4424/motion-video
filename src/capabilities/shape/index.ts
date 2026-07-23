import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {shapeReveal} from './shape-reveal.js';
import {shapeGeometryMorph} from './geometry-morph.js';

export {shapeReveal, shapeGeometryMorph};

export const shapeEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  shapeReveal,
  shapeGeometryMorph,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerShapeEffects(registry: CapabilityRegistry): void {
  for (const effect of shapeEffects) registry.registerEffect(effect, 'core');
}
