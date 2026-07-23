import type {z} from 'zod';

import {MotionSpecSchema, type MotionSpec} from '../../contracts/motion-spec.js';
import type {BriefSpec} from '../../contracts/brief.js';
import type {TreatmentSpec} from '../../contracts/treatment.js';
import {ResolvedMotionIRSchema} from '../../contracts/resolved-motion.js';
import {hasErrors, type Diagnostic} from '../../contracts/diagnostic.js';
import {errorDiagnostic} from '../../contracts/diagnostic.js';
import {sha256Canonical} from '../hash.js';
import type {CapabilityRegistry} from '../capability/registry.js';
import {validateContinuity} from './validate-continuity.js';
import {resolveTimeline} from './resolve-timeline.js';
import {resolveNodeTracks} from './resolve-node-tracks.js';
import {resolveCameraTrack} from './resolve-camera-track.js';
import {validateBridgeRealization} from './validate-bridge-realization.js';
import {validateResolvedContinuity} from './validate-resolved-continuity.js';
import {bindCapabilities} from './bind-capabilities.js';
import type {LayoutService} from './types.js';

type ResolvedMotionIR = z.infer<typeof ResolvedMotionIRSchema>;

export type ResolveMotionInput = {
  brief: BriefSpec;
  treatment: TreatmentSpec;
  motion: MotionSpec;
  layout: LayoutService;
  registry: CapabilityRegistry;
  layoutArtifactHash?: string;
};

export type ResolveMotionResult = {
  ir: ResolvedMotionIR | null;
  diagnostics: Diagnostic[];
};

/**
 * Run contract validation, source continuity validation, injected layout,
 * node/camera track resolution, resolved continuity + bridge-realization
 * validation and capability binding in order. Any error returns no IR.
 */
export function resolveMotion(input: ResolveMotionInput): ResolveMotionResult {
  const diagnostics: Diagnostic[] = [];

  const parsed = MotionSpecSchema.safeParse(input.motion);
  if (!parsed.success) {
    return {ir: null, diagnostics: [errorDiagnostic('MOTION_SPEC_INVALID', {evidence: parsed.error.message})]};
  }
  const spec = parsed.data;

  diagnostics.push(...validateContinuity(input.treatment, spec));

  // Frame total must equal round(durationSeconds * fps).
  const timeline = resolveTimeline(spec);
  const expected = Math.round(input.brief.durationSeconds * spec.canvas.fps);
  if (timeline.durationInFrames !== expected) {
    diagnostics.push(
      errorDiagnostic('DURATION_MISMATCH', {
        evidence: `${timeline.durationInFrames} != ${expected}`,
      }),
    );
  }

  if (hasErrors(diagnostics)) {
    return {ir: null, diagnostics};
  }

  const nodeTracks = resolveNodeTracks(spec, timeline, input.layout);
  const cameraSamples = resolveCameraTrack(spec, timeline);
  const realization = validateBridgeRealization(spec, timeline, nodeTracks);
  diagnostics.push(...realization.diagnostics);

  const binding = bindCapabilities(spec, timeline, input.registry);
  diagnostics.push(...binding.diagnostics);

  if (hasErrors(diagnostics)) {
    return {ir: null, diagnostics};
  }

  const bindingByNode = new Map(binding.bindings.map((b) => [b.nodeId, b]));

  const ir: ResolvedMotionIR = {
    schemaVersion: 'resolved-motion@1',
    projectId: spec.projectId,
    motionSpecHash: sha256Canonical(spec),
    layoutArtifactHash: input.layoutArtifactHash ?? '0'.repeat(64),
    canvas: spec.canvas,
    durationInFrames: timeline.durationInFrames,
    segments: timeline.segments,
    nodes: nodeTracks.map((n) => {
      const node = spec.world.nodes.find((x) => x.id === n.id)!;
      const b = bindingByNode.get(n.id)!;
      return {
        id: n.id,
        kind: node.kind,
        space: node.space,
        semanticRole: node.semanticRole,
        zIndex: n.zIndex,
        localBounds: n.localBounds,
        worldBounds: n.worldBounds,
        renderer: b.renderer,
        rendererProps: node.renderer.props,
        ...(n.resolvedLines ? {resolvedLines: n.resolvedLines} : {}),
        effects: b.effects.map((e) => ({
          id: e.id,
          version: e.version,
          implementationHash: e.implementationHash,
          scope: e.scope,
          fromFrame: e.fromFrame,
          toFrame: e.toFrame,
          channels: [...e.channels],
        })),
        geometryTrack: n.geometryTrack,
        styleTrack: n.styleTrack,
        contentTrack: n.contentTrack,
        visibleTrack: n.visibleTrack,
      };
    }),
    cameraSamples,
    handoffChecks: realization.handoffChecks,
  };

  diagnostics.push(...validateResolvedContinuity(ir));
  if (hasErrors(diagnostics)) {
    return {ir: null, diagnostics};
  }

  // Final strict validation of the assembled IR.
  const validated = ResolvedMotionIRSchema.safeParse(ir);
  if (!validated.success) {
    return {
      ir: null,
      diagnostics: [...diagnostics, errorDiagnostic('RESOLVED_IR_INVALID', {evidence: validated.error.message})],
    };
  }

  return {ir: validated.data, diagnostics};
}
