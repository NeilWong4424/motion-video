import type {MotionSpec, ContinuityBridge, PersistentNode} from '../../contracts/motion-spec.js';
import type {TreatmentSpec} from '../../contracts/treatment.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

function nodeById(spec: MotionSpec, id: string): PersistentNode | undefined {
  return spec.world.nodes.find((n) => n.id === id);
}

/** A node is "continuous" across a bridge if it is visible on both sides. */
function isVisibleAcross(node: PersistentNode | undefined): boolean {
  if (!node) return false;
  // Any visibility keyframe above 0 indicates the node participates.
  return node.visibleTrack.some((k) => (k.value as number) > 0);
}

function beatContainsNode(spec: MotionSpec, beatId: string, nodeId: string): boolean {
  const beat = spec.timeline.beats.find((b) => b.id === beatId);
  if (!beat) return false;
  return beat.focalNodeId === nodeId || beat.liveContentNodeIds.includes(nodeId);
}

/**
 * Cross-check each continuity bridge's declaration against source tracks rather
 * than trusting its label. Emits realization/ownership/pop diagnostics.
 */
export function validateBridgeIntent(spec: MotionSpec, treatment?: TreatmentSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  let chapterCutCount = 0;

  for (const bridge of spec.timeline.bridges) {
    // Transform ownership must be explained when both camera and node move.
    if (bridge.motionOwnership === 'camera-and-node-semantic' && !bridge.combinationMeaning) {
      diagnostics.push(errorDiagnostic('TRANSFORM_OWNERSHIP_CONFLICT', {bridgeId: bridge.id}));
    }

    switch (bridge.mode) {
      case 'shared-element': {
        const node = nodeById(spec, bridge.nodeId);
        const persistent =
          isVisibleAcross(node) &&
          beatContainsNode(spec, bridge.fromBeatId, bridge.nodeId) &&
          beatContainsNode(spec, bridge.toBeatId, bridge.nodeId);
        if (!node) {
          diagnostics.push(errorDiagnostic('SHARED_NODE_NOT_PERSISTENT', {bridgeId: bridge.id, nodeId: bridge.nodeId}));
        } else if (!persistent) {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, nodeId: bridge.nodeId}));
        } else if (node.space === 'screen') {
          // A shared-element exact bridge cannot cross world/screen; here the
          // node itself must be world-space to carry a spatial handoff.
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, nodeId: bridge.nodeId}));
        }
        break;
      }
      case 'camera-navigation': {
        const segment = spec.camera.segments.find((s) => s.id === bridge.cameraSegmentId);
        if (!segment || segment.mode !== 'move') {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'camera move segment missing'}));
        }
        if (!nodeById(spec, bridge.destinationNodeId)) {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'destination node missing'}));
        }
        break;
      }
      case 'morph-into-target': {
        const target = nodeById(spec, bridge.targetNodeId);
        if (!nodeById(spec, bridge.sourceNodeId)) {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'source node missing'}));
        }
        if (!target) {
          diagnostics.push(errorDiagnostic('TARGET_STATE_MISSING', {bridgeId: bridge.id}));
        } else if (bridge.preRollFrames <= 0) {
          diagnostics.push(errorDiagnostic('TARGET_NOT_PREROLLED', {bridgeId: bridge.id}));
        }
        break;
      }
      case 'match-on-action': {
        if (!nodeById(spec, bridge.outgoingNodeId) || !nodeById(spec, bridge.incomingNodeId)) {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'match nodes missing'}));
        }
        break;
      }
      case 'directional-push': {
        // A push declared "forward" must agree with actual node/camera drift;
        // here the semantic direction must be consistent with the direction.
        const forwardDirs = new Set(['left', 'up']);
        const isForwardVisual = forwardDirs.has(bridge.direction);
        if (bridge.semanticDirection === 'forward' && !isForwardVisual && bridge.direction !== 'right') {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'direction/semantic mismatch'}));
        }
        // Backward motion declared forward is a mismatch.
        if (bridge.semanticDirection === 'forward' && bridge.direction === 'down') {
          diagnostics.push(errorDiagnostic('BRIDGE_REALIZATION_MISMATCH', {bridgeId: bridge.id, evidence: 'backward motion declared forward'}));
        }
        break;
      }
      case 'chapter-cut': {
        chapterCutCount++;
        if (!bridge.exceptionJustification || bridge.exceptionJustification.trim().length === 0) {
          diagnostics.push(errorDiagnostic('UNJUSTIFIED_CHAPTER_CUT', {bridgeId: bridge.id}));
        }
        break;
      }
    }
  }

  // Independent of the Treatment value, more than one chapter cut exceeds V1.
  if (chapterCutCount > 1) {
    diagnostics.push(errorDiagnostic('CHAPTER_CUT_V1_LIMIT_EXCEEDED', {evidence: `${chapterCutCount} cuts`}));
  }

  // Treatment budget.
  if (treatment && chapterCutCount > treatment.chapterCutBudget) {
    diagnostics.push(errorDiagnostic('CHAPTER_CUT_BUDGET_EXCEEDED', {evidence: `${chapterCutCount} > ${treatment.chapterCutBudget}`}));
  }

  // Transition vocabulary: ordinary families must appear in the Treatment vocab.
  if (treatment) {
    diagnostics.push(...validateVocabulary(spec.timeline.bridges, treatment));
  }

  return diagnostics;
}

function validateVocabulary(bridges: readonly ContinuityBridge[], treatment: TreatmentSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const vocab = new Set(treatment.transitionVocabulary);
  let signatureCount = 0;
  for (const bridge of bridges) {
    if (bridge.mode === 'chapter-cut') continue;
    if (bridge.vocabularyRole === 'signature') {
      signatureCount++;
    } else if (!vocab.has(bridge.transitionFamily)) {
      diagnostics.push(errorDiagnostic('TRANSITION_VOCABULARY_EXCESS', {bridgeId: bridge.id, evidence: bridge.transitionFamily}));
    }
  }
  if (signatureCount > 1) {
    diagnostics.push(errorDiagnostic('TRANSITION_VOCABULARY_EXCESS', {evidence: 'more than one signature transition'}));
  }
  return diagnostics;
}
