import type {MotionSpec} from '../../contracts/motion-spec.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

/**
 * Validate structural references in a MotionSpec: unique ordered beat ids,
 * positive durations, valid node/camera references, exactly one bridge per
 * adjacent beat pair and no non-adjacent bridge.
 */
export function validateReferences(spec: MotionSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const beats = spec.timeline.beats;
  const nodeIds = new Set(spec.world.nodes.map((n) => n.id));

  // Unique beat ids.
  const seenBeats = new Set<string>();
  for (const beat of beats) {
    if (seenBeats.has(beat.id)) {
      diagnostics.push(errorDiagnostic('BEAT_ID_DUPLICATE', {beatId: beat.id}));
    }
    seenBeats.add(beat.id);
    if (beat.durationFrames <= 0) {
      diagnostics.push(errorDiagnostic('BEAT_DURATION_INVALID', {beatId: beat.id}));
    }
    if (!nodeIds.has(beat.focalNodeId)) {
      diagnostics.push(errorDiagnostic('FOCAL_NODE_MISSING', {beatId: beat.id, nodeId: beat.focalNodeId}));
    }
    for (const liveId of beat.liveContentNodeIds) {
      if (!nodeIds.has(liveId)) {
        diagnostics.push(errorDiagnostic('LIVE_NODE_MISSING', {beatId: beat.id, nodeId: liveId}));
      }
    }
  }

  // Node references: valid parent groups, no cycles, unique ids.
  const seenNodes = new Set<string>();
  for (const node of spec.world.nodes) {
    if (seenNodes.has(node.id)) {
      diagnostics.push(errorDiagnostic('NODE_ID_DUPLICATE', {nodeId: node.id}));
    }
    seenNodes.add(node.id);
    if (node.parentId !== undefined && !nodeIds.has(node.parentId)) {
      diagnostics.push(errorDiagnostic('NODE_PARENT_MISSING', {nodeId: node.id}));
    }
  }
  diagnostics.push(...detectParentCycles(spec));

  // One bridge for every adjacent pair; no non-adjacent bridge.
  const adjacentPairs = new Map<string, number>();
  for (let i = 0; i < beats.length - 1; i++) {
    adjacentPairs.set(`${beats[i]!.id}=>${beats[i + 1]!.id}`, 0);
  }
  const beatIndex = new Map(beats.map((b, i) => [b.id, i]));
  for (const bridge of spec.timeline.bridges) {
    const key = `${bridge.fromBeatId}=>${bridge.toBeatId}`;
    if (!adjacentPairs.has(key)) {
      const fromIdx = beatIndex.get(bridge.fromBeatId);
      const toIdx = beatIndex.get(bridge.toBeatId);
      if (fromIdx === undefined || toIdx === undefined) {
        diagnostics.push(errorDiagnostic('BRIDGE_BEAT_MISMATCH', {bridgeId: bridge.id}));
      } else {
        diagnostics.push(errorDiagnostic('BRIDGE_NON_ADJACENT', {bridgeId: bridge.id}));
      }
    } else {
      adjacentPairs.set(key, (adjacentPairs.get(key) ?? 0) + 1);
    }
  }
  for (const [pair, count] of adjacentPairs) {
    if (count === 0) {
      diagnostics.push(errorDiagnostic('BOUNDARY_BRIDGE_MISSING', {evidence: pair}));
    } else if (count > 1) {
      diagnostics.push(errorDiagnostic('BOUNDARY_BRIDGE_MULTIPLE', {evidence: pair}));
    }
  }

  // Camera track named main-camera required.
  if (spec.camera.id !== 'main-camera') {
    diagnostics.push(errorDiagnostic('CAMERA_TRACK_MISSING'));
  }

  return diagnostics;
}

function detectParentCycles(spec: MotionSpec): Diagnostic[] {
  const parentOf = new Map(spec.world.nodes.map((n) => [n.id, n.parentId]));
  const diagnostics: Diagnostic[] = [];
  for (const node of spec.world.nodes) {
    const seen = new Set<string>();
    let current: string | undefined = node.id;
    while (current !== undefined) {
      if (seen.has(current)) {
        diagnostics.push(errorDiagnostic('NODE_PARENT_CYCLE', {nodeId: node.id}));
        break;
      }
      seen.add(current);
      current = parentOf.get(current);
    }
  }
  return diagnostics;
}
