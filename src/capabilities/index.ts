import {CapabilityRegistry} from '../engine/capability/registry.js';
import {registerBaseRenderers} from './base/index.js';
import {registerTextEffects} from './text/index.js';
import {registerShapeEffects} from './shape/index.js';
import {registerPathEffects} from './path/index.js';
import {registerDataEffects} from './data/index.js';
import {registerDiagramEffects} from './diagram/index.js';
import {registerUiEffects} from './ui/index.js';
import {registerIdentityEffects} from './identity/index.js';
import {registerAmbientEffects} from './ambient/index.js';

export * from './base/index.js';
export * from './text/index.js';
export * from './shape/index.js';
export * from './path/index.js';
export * from './data/index.js';
export * from './diagram/index.js';
export * from './ui/index.js';
export * from './identity/index.js';
export * from './ambient/index.js';

/** Build a registry populated with all core capabilities. */
export function createCoreRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  registerBaseRenderers(registry);
  registerTextEffects(registry);
  registerShapeEffects(registry);
  registerPathEffects(registry);
  registerDataEffects(registry);
  registerDiagramEffects(registry);
  registerUiEffects(registry);
  registerIdentityEffects(registry);
  registerAmbientEffects(registry);
  return registry;
}
