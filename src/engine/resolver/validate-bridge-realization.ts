import type {MotionSpec} from '../../contracts/motion-spec.js';
import type {z} from 'zod';
import type {HandoffCheckSchema} from '../../contracts/resolved-motion.js';
import {type Diagnostic} from '../../contracts/diagnostic.js';
import type {ResolvedNodeTracks} from './resolve-node-tracks.js';
import type {ResolvedTimeline} from './types.js';
import {resolveSegmentRef} from './resolve-timeline.js';
import {normalizedDistance} from './continuity-diagnostics.js';

type HandoffCheck = z.infer<typeof HandoffCheckSchema>;

/**
 * Emit typed handoff checks for each bridge using resolved frames and world
 * bounds, and re-verify realization at the resolved level. Modes:
 * - shared-element -> geometry-only
 * - camera-navigation / match-on-action -> continuous-motion
 * - morph-into-target -> exact-visual
 * - chapter-cut -> chapter-cut-evidence
 */
export function validateBridgeRealization(
  spec: MotionSpec,
  timeline: ResolvedTimeline,
  nodes: readonly ResolvedNodeTracks[],
): {handoffChecks: HandoffCheck[]; diagnostics: Diagnostic[]} {
  const handoffChecks: HandoffCheck[] = [];
  const diagnostics: Diagnostic[] = [];
  const boundsById = new Map(nodes.map((n) => [n.id, n.worldBounds]));

  for (const bridge of spec.timeline.bridges) {
    const window = timeline.segments.find((s) => s.id === bridge.id);
    if (!window) continue;

    if (bridge.mode === 'chapter-cut') {
      const cutFrame = window.cutAtFrame ?? window.from;
      const measured = normalizedDistance(bridge.eyeTrace.outgoing.point, bridge.eyeTrace.incoming.point);
      handoffChecks.push({
        mode: 'chapter-cut-evidence',
        bridgeId: bridge.id,
        sourceFrame: Math.max(0, cutFrame - 1),
        targetFrame: cutFrame,
        incomingHeldFrame: cutFrame,
        outgoingEyeTrace: bridge.eyeTrace.outgoing.point,
        incomingEyeTrace: bridge.eyeTrace.incoming.point,
        maxEyeTraceDistanceNormalized: bridge.maxEyeTraceDistanceNormalized,
        measuredEyeTraceDistanceNormalized: measured,
      });
      continue;
    }

    const sourceFrame = Math.max(0, window.to - 1);
    const targetFrame = window.to;

    switch (bridge.mode) {
      case 'shared-element': {
        const anchor = boundsById.get(bridge.nodeId);
        handoffChecks.push({
          mode: 'geometry-only',
          bridgeId: bridge.id,
          sourceFrame,
          targetFrame,
          anchorNodeId: bridge.nodeId,
          maxGeometryDriftPx: 1,
        });
        if (!anchor) {
          diagnostics.push({code: 'BRIDGE_REALIZATION_MISMATCH', severity: 'error', bridgeId: bridge.id});
        }
        break;
      }
      case 'camera-navigation':
      case 'match-on-action': {
        const anchorNodeId =
          bridge.mode === 'camera-navigation' ? bridge.destinationNodeId : bridge.incomingNodeId;
        handoffChecks.push({
          mode: 'continuous-motion',
          bridgeId: bridge.id,
          sourceFrame,
          targetFrame,
          anchorNodeId,
          maxPositionJumpPx: 8,
          maxVelocityDeltaPxPerFrame: 6,
        });
        break;
      }
      case 'morph-into-target': {
        const target = boundsById.get(bridge.targetNodeId);
        handoffChecks.push({
          mode: 'exact-visual',
          bridgeId: bridge.id,
          sourceFrame,
          targetFrame,
          anchorNodeId: bridge.targetNodeId,
          cropOrMask: target ?? {x: 0, y: 0, width: spec.canvas.width, height: spec.canvas.height},
          minPsnrDb: 40,
          maxGeometryDriftPx: 1,
        });
        // Target must be prerolled: visible before takeover.
        const targetNode = nodes.find((n) => n.id === bridge.targetNodeId);
        const preRollStart = resolveSegmentRef(timeline, bridge.motionRange.from) - bridge.preRollFrames;
        const visibleEarly = targetNode?.visibleTrack.some(
          (k) => k.frame <= Math.max(0, preRollStart) && (k.value as number) > 0,
        );
        if (!visibleEarly && targetNode) {
          // Not a hard error at source level (Task 10 QC confirms with pixels),
          // but record a diagnostic when clearly absent.
          diagnostics.push({code: 'TARGET_NOT_PREROLLED', severity: 'warning', bridgeId: bridge.id});
        }
        break;
      }
      case 'directional-push': {
        handoffChecks.push({
          mode: 'continuous-motion',
          bridgeId: bridge.id,
          sourceFrame,
          targetFrame,
          anchorNodeId: bridge.eyeTrace.incoming.nodeId,
          maxPositionJumpPx: 12,
          maxVelocityDeltaPxPerFrame: 8,
        });
        break;
      }
    }
  }

  return {handoffChecks, diagnostics};
}
