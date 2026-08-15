import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {NodeRendererDefinition} from '../../engine/capability/types.js';
import {baseTextRenderer} from './text-node.js';
import {baseShapeRenderer} from './shape-node.js';
import {baseGradientShapeRenderer} from './gradient-shape-node.js';
import {baseIsoStackRenderer} from './iso-stack-node.js';
import {basePathRenderer} from './path-node.js';
import {baseGroupRenderer} from './group-node.js';
import {baseImageRenderer} from './image-node.js';

export {
  baseTextRenderer,
  baseShapeRenderer,
  baseGradientShapeRenderer,
  baseIsoStackRenderer,
  basePathRenderer,
  baseGroupRenderer,
  baseImageRenderer,
};

export const baseRenderers: readonly NodeRendererDefinition<unknown>[] = [
  baseTextRenderer as NodeRendererDefinition<unknown>,
  baseShapeRenderer as NodeRendererDefinition<unknown>,
  baseGradientShapeRenderer as NodeRendererDefinition<unknown>,
  baseIsoStackRenderer as NodeRendererDefinition<unknown>,
  basePathRenderer as NodeRendererDefinition<unknown>,
  baseGroupRenderer as NodeRendererDefinition<unknown>,
  baseImageRenderer as NodeRendererDefinition<unknown>,
];

export function registerBaseRenderers(registry: CapabilityRegistry): void {
  for (const renderer of baseRenderers) {
    registry.registerRenderer(renderer, 'core');
  }
}
