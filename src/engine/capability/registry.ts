import type {
  CapabilityManifestEntry,
  CapabilityScope,
  MotionCapabilityDefinition,
  NodeRendererDefinition,
} from './types.js';

function key(id: string, version: string): string {
  return `${id}@${version}`;
}

/**
 * A capability registry keeping renderer and effect namespaces explicit. It
 * rejects duplicates and resolves only core definitions plus project-scoped
 * definitions whose project ID matches the requesting project.
 */
export class CapabilityRegistry {
  private readonly renderers = new Map<string, {def: NodeRendererDefinition<unknown>; scope: CapabilityScope}>();
  private readonly effects = new Map<string, {def: MotionCapabilityDefinition<unknown, unknown>; scope: CapabilityScope}>();

  registerRenderer(definition: NodeRendererDefinition<unknown>, scope: CapabilityScope): void {
    const k = `${scope}::${key(definition.id, definition.version)}`;
    if (this.renderers.has(k)) throw new Error('CAPABILITY_DUPLICATE');
    this.renderers.set(k, {def: definition, scope});
  }

  registerEffect(definition: MotionCapabilityDefinition<unknown, unknown>, scope: CapabilityScope): void {
    const k = `${scope}::${key(definition.id, definition.version)}`;
    if (this.effects.has(k)) throw new Error('CAPABILITY_DUPLICATE');
    this.effects.set(k, {def: definition, scope});
  }

  resolveRenderer(id: string, version: string, projectId: string): NodeRendererDefinition<unknown> {
    return this.resolve(this.renderers, id, version, projectId, 'renderer');
  }

  resolveEffect(id: string, version: string, projectId: string): MotionCapabilityDefinition<unknown, unknown> {
    return this.resolve(this.effects, id, version, projectId, 'effect');
  }

  private resolve<T>(
    store: Map<string, {def: T; scope: CapabilityScope}>,
    id: string,
    version: string,
    projectId: string,
    kind: 'renderer' | 'effect',
  ): T {
    const core = store.get(`core::${key(id, version)}`);
    if (core) return core.def;
    const projScope: CapabilityScope = `project:${projectId}`;
    const proj = store.get(`${projScope}::${key(id, version)}`);
    if (proj) return proj.def;
    // A project-scoped capability requested from a different project is forbidden.
    for (const [storeKey, entry] of store) {
      if (storeKey.endsWith(`::${key(id, version)}`) && entry.scope.startsWith('project:')) {
        throw new Error('CAPABILITY_SCOPE_FORBIDDEN');
      }
    }
    throw new Error(kind === 'renderer' ? 'CAPABILITY_RENDERER_NOT_FOUND' : 'CAPABILITY_EFFECT_NOT_FOUND');
  }

  list(): readonly CapabilityManifestEntry[] {
    const entries: CapabilityManifestEntry[] = [];
    for (const {def, scope} of this.renderers.values()) {
      entries.push({
        kind: 'renderer',
        id: def.id,
        version: def.version,
        implementationHash: def.implementationHash,
        scope,
        supportedNodeKinds: def.supportedNodeKinds,
      });
    }
    for (const {def, scope} of this.effects.values()) {
      entries.push({
        kind: 'effect',
        id: def.id,
        version: def.version,
        implementationHash: def.implementationHash,
        scope,
        supportedNodeKinds: def.supportedNodeKinds,
        ownedChannels: def.ownedChannels,
        family: def.family,
      });
    }
    return entries.sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id) || a.version.localeCompare(b.version),
    );
  }
}
