import type {MotionSpec} from '../../contracts/motion-spec.js';
import type {ResolvedTimeline} from './types.js';
import {easeInOutQuint} from '../runtime/easing.js';

export type CameraSample = {frame: number; x: number; y: number; zoom: number};

/**
 * Resolve holds and moves to contiguous global frame ranges, sampling one
 * camera state per frame. Move endpoints must equal adjacent hold states.
 */
export function resolveCameraTrack(spec: MotionSpec, timeline: ResolvedTimeline): CameraSample[] {
  const duration = timeline.durationInFrames;
  const samples: CameraSample[] = [];
  const segmentWindow = new Map(timeline.segments.map((s) => [s.id, s]));

  // Build per-frame state from ordered camera segments mapped to their timeline
  // segment windows.
  const frameState: (CameraSample | undefined)[] = new Array(duration).fill(undefined);

  for (const seg of spec.camera.segments) {
    const window = segmentWindow.get(seg.segmentId);
    if (!window) {
      throw new Error(`CAMERA_SEGMENT_UNMAPPED: ${seg.id}`);
    }
    const {from, to} = window;
    for (let f = from; f < to; f++) {
      if (seg.mode === 'hold') {
        frameState[f] = {frame: f, x: seg.state.x, y: seg.state.y, zoom: seg.state.zoom};
      } else {
        const span = Math.max(1, to - from - 1);
        const t = span === 0 ? 1 : (f - from) / span;
        const e = easeInOutQuint(Math.min(1, Math.max(0, t)));
        frameState[f] = {
          frame: f,
          x: seg.from.x + (seg.to.x - seg.from.x) * e,
          y: seg.from.y + (seg.to.y - seg.from.y) * e,
          zoom: seg.from.zoom + (seg.to.zoom - seg.from.zoom) * e,
        };
      }
    }
  }

  // Fill any gaps by carrying the last known state; the first frame must be set.
  let last: CameraSample | undefined;
  for (let f = 0; f < duration; f++) {
    const s = frameState[f];
    if (s) {
      last = s;
      samples.push(s);
    } else if (last) {
      samples.push({frame: f, x: last.x, y: last.y, zoom: last.zoom});
    } else {
      // No camera state at frame 0: default identity.
      samples.push({frame: f, x: 0, y: 0, zoom: 1});
    }
  }

  return samples;
}
