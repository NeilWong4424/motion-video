import type {MotionSpec, PersistentNode} from '../../contracts/motion-spec.js';
import type {CapabilityRegistry} from '../capability/registry.js';
import type {MotionChannel} from '../capability/types.js';
import {detectChannelConflicts} from '../capability/matcher.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';
import {resolveSegmentRef} from './resolve-timeline.js';
import type {ResolvedTimeline} from './types.js';

export type CapabilityBinding = {
  id: string;
  version: string;
  implementationHash: string;
  scope: string;
};

export type ResolvedNodeBinding = {
  nodeId: string;
  renderer: CapabilityBinding;
  effects: Array<
    CapabilityBinding & {fromFrame: number; toFrame: number; channels: readonly MotionChannel[]; intent: unknown}
  >;
};

export type BindResult = {
  bindings: ResolvedNodeBinding[];
  diagnostics: Diagnostic[];
};

/**
 * Bind each node's base renderer and ordered effects to exact
 * id@version+implementationHash entries. Rejects same-channel overlaps.
 */
export function bindCapabilities(
  spec: MotionSpec,
  timeline: ResolvedTimeline,
  registry: CapabilityRegistry,
): BindResult {
  const diagnostics: Diagnostic[] = [];
  const bindings: ResolvedNodeBinding[] = [];

  for (const node of spec.world.nodes) {
    let rendererBinding: CapabilityBinding;
    try {
      const renderer = registry.resolveRenderer(node.renderer.id, node.renderer.version, spec.projectId);
      rendererBinding = {
        id: renderer.id,
        version: renderer.version,
        implementationHash: renderer.implementationHash,
        scope: 'core',
      };
    } catch {
      diagnostics.push(errorDiagnostic('CAPABILITY_GAP', {nodeId: node.id, evidence: `renderer ${node.renderer.id}`}));
      continue;
    }

    const effectBindings = resolveEffects(node, timeline, registry, spec.projectId, diagnostics);
    bindings.push({nodeId: node.id, renderer: rendererBinding, effects: effectBindings});

    const conflicts = detectChannelConflicts(
      effectBindings.map((e) => ({channels: e.channels, fromFrame: e.fromFrame, toFrame: e.toFrame})),
    );
    for (const c of conflicts) {
      diagnostics.push({...c, nodeId: node.id});
    }
  }

  return {bindings, diagnostics};
}

function resolveEffects(
  node: PersistentNode,
  timeline: ResolvedTimeline,
  registry: CapabilityRegistry,
  projectId: string,
  diagnostics: Diagnostic[],
): ResolvedNodeBinding['effects'] {
  const result: ResolvedNodeBinding['effects'] = [];
  for (const effect of node.effects) {
    let def;
    try {
      def = registry.resolveEffect(effect.id, effect.version, projectId);
    } catch {
      diagnostics.push(errorDiagnostic('CAPABILITY_GAP', {nodeId: node.id, evidence: `effect ${effect.id}`}));
      continue;
    }

    // Validate the author-supplied effect props against the capability's intent
    // schema. Absent props parse to the fixture defaults (every intent field uses
    // `.default(...)`), preserving the historical fixture-only behavior. Malformed
    // props fail loudly rather than silently degrading to defaults.
    const parsedIntent = def.intentSchema.safeParse(effect.props ?? {});
    if (!parsedIntent.success) {
      diagnostics.push(
        errorDiagnostic('EFFECT_INTENT_INVALID', {
          nodeId: node.id,
          evidence: `effect ${effect.id}: ${parsedIntent.error.issues.map((i) => i.message).join('; ')}`,
        }),
      );
      continue;
    }

    result.push({
      id: def.id,
      version: def.version,
      implementationHash: def.implementationHash,
      scope: 'core',
      fromFrame: resolveSegmentRef(timeline, effect.range.from),
      toFrame: resolveSegmentRef(timeline, effect.range.to),
      channels: def.ownedChannels,
      intent: parsedIntent.data,
    });
  }
  return result;
}
