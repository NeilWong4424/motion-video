import {CapabilityRegistry} from '../engine/capability/registry.js';
import {registerBaseRenderers} from './base/index.js';
import {registerTextEffects} from './text/index.js';
import {registerShapeEffects} from './shape/index.js';
import {registerPathEffects} from './path/index.js';

export * from './base/index.js';
export * from './text/index.js';
export * from './shape/index.js';
export * from './path/index.js';

/** Build a registry populated with all core capabilities. */
export function createCoreRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  registerBaseRenderers(registry);
  registerTextEffects(registry);
  registerShapeEffects(registry);
  registerPathEffects(registry);
  return registry;
}
