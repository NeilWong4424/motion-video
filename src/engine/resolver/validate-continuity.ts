import type {MotionSpec, PersistentNode} from '../../contracts/motion-spec.js';
import type {TreatmentSpec} from '../../contracts/treatment.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';
import {validateReferences} from './validate-references.js';
import {validateBridgeIntent} from './validate-bridge-intent.js';
import {detectSlideReset} from './detect-slide-reset.js';
import {validateCameraIntent} from './validate-camera-intent.js';
import {normalizedDistance} from './continuity-diagnostics.js';

/**
 * The single continuity entry point. Delegates to reference, bridge-intent,
 * slide-reset and camera validators, adds eye-trace and chapter-cut budget
 * checks, and enforces the anchor-missing rule for ordinary boundaries.
 */
export function validateContinuity(treatment: TreatmentSpec, spec: MotionSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(...validateReferences(spec));
  diagnostics.push(...validateBridgeIntent(spec, treatment));
  diagnostics.push(...detectSlideReset(spec));
  diagnostics.push(...validateCameraIntent(spec));

  const nodeById = new Map(spec.world.nodes.map((n) => [n.id, n]));

  for (const bridge of spec.timeline.bridges) {
    // Every bridge's eye-trace nodes must exist.
    const outNode = nodeById.get(bridge.eyeTrace.outgoing.nodeId);
    const inNode = nodeById.get(bridge.eyeTrace.incoming.nodeId);
    if (!outNode || !inNode) {
      diagnostics.push(errorDiagnostic('CONTINUITY_ANCHOR_MISSING', {bridgeId: bridge.id}));
    }

    if (bridge.mode === 'chapter-cut') {
      // Eye-trace distance must not exceed the declared maximum.
      const measured = normalizedDistance(bridge.eyeTrace.outgoing.point, bridge.eyeTrace.incoming.point);
      if (measured > bridge.maxEyeTraceDistanceNormalized) {
        diagnostics.push(
          errorDiagnostic('EYE_TRACE_JUMP', {
            bridgeId: bridge.id,
            evidence: `${measured.toFixed(4)} > ${bridge.maxEyeTraceDistanceNormalized}`,
          }),
        );
      }
      // A chapter cut with no genuine anchor node.
      if (!outNode || !inNode) {
        diagnostics.push(errorDiagnostic('CONTINUITY_ANCHOR_MISSING', {bridgeId: bridge.id}));
      }
    }

    // Content-state pop: a content transition inside the bridge window must name
    // an allowed mode; a raw content change without a transition pops.
    diagnostics.push(...detectContentPop(bridge.toBeatId, spec));
  }

  return dedupe(diagnostics);
}

function detectContentPop(toBeatId: string, spec: MotionSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const beat = spec.timeline.beats.find((b) => b.id === toBeatId);
  if (!beat) return diagnostics;
  for (const nodeId of beat.liveContentNodeIds) {
    const node = spec.world.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    if (hasUndeclaredContentChange(node)) {
      diagnostics.push(errorDiagnostic('CONTENT_STATE_POP', {beatId: toBeatId, nodeId}));
    }
  }
  return diagnostics;
}

function hasUndeclaredContentChange(node: PersistentNode): boolean {
  const contentKeyframes = node.contentTrack ?? [];
  if (contentKeyframes.length < 2) return false;
  // Multiple distinct content states with no declared content transition = pop.
  const distinct = new Set(
    contentKeyframes.map((k) => JSON.stringify((k.value as {stateId?: string; text?: string}))),
  );
  if (distinct.size < 2) return false;
  return (node.contentTransitions ?? []).length === 0;
}

function dedupe(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const out: Diagnostic[] = [];
  for (const d of diagnostics) {
    const key = `${d.code}|${d.bridgeId ?? ''}|${d.beatId ?? ''}|${d.nodeId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}
