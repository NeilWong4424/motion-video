import type {MotionSpec, PersistentNode, Beat} from '../../contracts/motion-spec.js';
import {errorDiagnostic, warningDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

/**
 * Estimate a node's opacity- and area-weighted visible salience at a beat.
 * Uses declared geometry (width*height) and last style opacity, weighted by
 * semantic role. This is an auxiliary source-level estimate; Task 6 repeats it
 * with resolved world bounds.
 */
function nodeSalience(node: PersistentNode): number {
  const geo = node.geometryTrack.at(-1)?.value as {width?: number; height?: number} | undefined;
  const area = (geo?.width ?? 100) * (geo?.height ?? 100);
  const opacity = (node.styleTrack.at(-1)?.value as {opacity?: number} | undefined)?.opacity ?? 1;
  const roleWeight = node.semanticRole === 'content' ? 1 : node.semanticRole === 'overlay' ? 0.5 : 0.15;
  return area * opacity * roleWeight;
}

function isFocalOrAncestor(spec: MotionSpec, beat: Beat, nodeId: string): boolean {
  if (beat.focalNodeId === nodeId) return true;
  // Ancestor of the focal node.
  let current: string | undefined = beat.focalNodeId;
  const parentOf = new Map(spec.world.nodes.map((n) => [n.id, n.parentId]));
  const seen = new Set<string>();
  while (current !== undefined && !seen.has(current)) {
    seen.add(current);
    if (current === nodeId) return true;
    current = parentOf.get(current);
  }
  return false;
}

/**
 * Detect slide-like resets at each boundary. An ordinary boundary is blocking
 * when focal/full-frame content resets without a salient persistent anchor,
 * camera relation or match action. A tiny decorative node cannot waive a reset.
 */
export function detectSlideReset(spec: MotionSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const beats = spec.timeline.beats;
  const bridgeByPair = new Map(spec.timeline.bridges.map((b) => [`${b.fromBeatId}=>${b.toBeatId}`, b]));

  // Track equal-duration + repeated full-frame replacement for SLIDESHOW_RHYTHM.
  let repeatedEqualDuration = 0;

  for (let i = 0; i < beats.length - 1; i++) {
    const from = beats[i]!;
    const to = beats[i + 1]!;
    const bridge = bridgeByPair.get(`${from.id}=>${to.id}`);
    if (!bridge) continue;

    if (from.durationFrames === to.durationFrames) repeatedEqualDuration++;

    // A shared persistent anchor: a node that is salient on both sides and is a
    // focal node / ancestor / carries >=10% of weighted salient area.
    const fromNodes = new Set([from.focalNodeId, ...from.liveContentNodeIds]);
    const toNodes = new Set([to.focalNodeId, ...to.liveContentNodeIds]);
    const shared = [...fromNodes].filter((id) => toNodes.has(id));

    const totalSalience = spec.world.nodes.reduce((sum, n) => sum + nodeSalience(n), 0) || 1;

    let hasSalientAnchor = false;
    for (const nodeId of shared) {
      const node = spec.world.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      const salienceFraction = nodeSalience(node) / totalSalience;
      const focalRelated = isFocalOrAncestor(spec, from, nodeId) || isFocalOrAncestor(spec, to, nodeId);
      if (focalRelated || salienceFraction >= 0.1) {
        hasSalientAnchor = true;
        break;
      }
    }

    const cameraRelated = bridge.mode === 'camera-navigation';
    const matchAction = bridge.mode === 'match-on-action';
    const isChapterCut = bridge.mode === 'chapter-cut';

    if (isChapterCut) {
      // A chapter cut may waive one boundary, but repeated full-page cuts with
      // empty/placeholder reasons and no salient anchor are slide rhythm.
      const emptyReason =
        /^\s*(next scene|next|new scene)\s*$/i.test(bridge.narrativeReason.trim());
      if (!hasSalientAnchor && emptyReason) {
        diagnostics.push(errorDiagnostic('SLIDE_LIKE_CUT_PATTERN', {bridgeId: bridge.id}));
      }
      continue;
    }

    if (!hasSalientAnchor && !cameraRelated && !matchAction) {
      // If there was a nominal shared declaration but only a decorative survivor,
      // emit ANCHOR_NOT_SALIENT; otherwise a plain slide-like reset.
      if (shared.length > 0) {
        diagnostics.push(errorDiagnostic('ANCHOR_NOT_SALIENT', {bridgeId: bridge.id}));
      }
      diagnostics.push(errorDiagnostic('SLIDE_LIKE_CUT_PATTERN', {bridgeId: bridge.id}));
    }
  }

  // Consecutive chapter cuts.
  for (let i = 0; i < beats.length - 2; i++) {
    const b1 = bridgeByPair.get(`${beats[i]!.id}=>${beats[i + 1]!.id}`);
    const b2 = bridgeByPair.get(`${beats[i + 1]!.id}=>${beats[i + 2]!.id}`);
    if (b1?.mode === 'chapter-cut' && b2?.mode === 'chapter-cut') {
      diagnostics.push(errorDiagnostic('CONSECUTIVE_CHAPTER_CUTS', {bridgeId: b2.id}));
    }
  }

  if (repeatedEqualDuration >= 2 && diagnostics.some((d) => d.code === 'SLIDE_LIKE_CUT_PATTERN')) {
    diagnostics.push(warningDiagnostic('SLIDESHOW_RHYTHM'));
  }

  return diagnostics;
}
