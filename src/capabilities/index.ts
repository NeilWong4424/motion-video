import {CapabilityRegistry} from '../engine/capability/registry.js';
import {registerBaseRenderers} from './base/index.js';

export * from './base/index.js';

/** Build a registry populated with all core capabilities. */
export function createCoreRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  registerBaseRenderers(registry);
  return registry;
}
