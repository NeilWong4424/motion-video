import type {MotionSpec} from '../../contracts/motion-spec.js';
import type {SegmentRef} from '../../contracts/common.js';
import type {ResolvedTimeline, TimelineSegment} from './types.js';

/**
 * Resolve beats and bridges into exact half-open global frame windows in strict
 * order. A zero-frame chapter cut consumes no frame and resolves to an explicit
 * cutAtFrame between the outgoing final frame and the incoming first frame.
 */
export function resolveTimeline(spec: MotionSpec): ResolvedTimeline {
  const beats = spec.timeline.beats;
  const bridgeByPair = new Map(spec.timeline.bridges.map((b) => [`${b.fromBeatId}=>${b.toBeatId}`, b]));

  const segments: TimelineSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!;
    if (beat.durationFrames <= 0) {
      throw new Error(`TIMELINE_BEAT_DURATION_INVALID: ${beat.id}`);
    }
    const beatFrom = cursor;
    const beatTo = cursor + beat.durationFrames;
    segments.push({id: beat.id, kind: 'beat', from: beatFrom, to: beatTo});
    cursor = beatTo;

    // Bridge to next beat.
    const next = beats[i + 1];
    if (!next) break;
    const bridge = bridgeByPair.get(`${beat.id}=>${next.id}`);
    if (!bridge) continue;

    if (bridge.mode === 'chapter-cut') {
      // The schema guarantees durationFrames === 0 for a chapter cut.
      // Zero-frame cut: no render frame; cutAtFrame is the boundary frame.
      segments.push({id: bridge.id, kind: 'bridge', from: cursor, to: cursor, cutAtFrame: cursor});
    } else {
      if (bridge.durationFrames <= 0) {
        throw new Error(`TIMELINE_BRIDGE_DURATION_INVALID: ${bridge.id}`);
      }
      const bridgeTo = cursor + bridge.durationFrames;
      segments.push({id: bridge.id, kind: 'bridge', from: cursor, to: bridgeTo});
      cursor = bridgeTo;
    }
  }

  return {segments, durationInFrames: cursor};
}

/**
 * Map a segment-relative reference to an exact integer global frame.
 * progress:0 -> first frame; progress:1 -> last rendered frame.
 */
export function resolveSegmentRef(timeline: ResolvedTimeline, ref: SegmentRef): number {
  const segment = timeline.segments.find((s) => s.id === ref.segmentId);
  if (!segment) {
    throw new Error(`TIMELINE_SEGMENT_UNKNOWN: ${ref.segmentId}`);
  }
  if (segment.from === segment.to) {
    // Zero-frame segment (chapter cut): references collapse to the cut frame.
    return segment.cutAtFrame ?? segment.from;
  }
  return segment.from + Math.round(ref.progress * Math.max(0, segment.to - segment.from - 1));
}
