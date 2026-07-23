import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {NodeRendererDefinition} from '../../engine/capability/types.js';
import {baseTextRenderer} from './text-node.js';
import {baseShapeRenderer} from './shape-node.js';
import {basePathRenderer} from './path-node.js';
import {baseGroupRenderer} from './group-node.js';

export {baseTextRenderer, baseShapeRenderer, basePathRenderer, baseGroupRenderer};

export const baseRenderers: readonly NodeRendererDefinition<unknown>[] = [
  baseTextRenderer as NodeRendererDefinition<unknown>,
  baseShapeRenderer as NodeRendererDefinition<unknown>,
  basePathRenderer as NodeRendererDefinition<unknown>,
  baseGroupRenderer as NodeRendererDefinition<unknown>,
];

export function registerBaseRenderers(registry: CapabilityRegistry): void {
  for (const renderer of baseRenderers) {
    registry.registerRenderer(renderer, 'core');
  }
}
