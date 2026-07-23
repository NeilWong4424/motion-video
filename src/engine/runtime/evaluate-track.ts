import {resolveEasing} from './easing.js';

export type RenderKeyframe<T> = {
  frame: number;
  value: T;
  interpolation: 'hold' | 'linear' | 'ease';
  easing?: string;
};

export type RenderTrack<T> = readonly RenderKeyframe<T>[];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateValue(from: unknown, to: unknown, t: number): unknown {
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t);
  }
  if (
    from !== null &&
    to !== null &&
    typeof from === 'object' &&
    typeof to === 'object' &&
    !Array.isArray(from) &&
    !Array.isArray(to)
  ) {
    const result: Record<string, unknown> = {...(from as Record<string, unknown>)};
    for (const key of Object.keys(to as Record<string, unknown>)) {
      const a = (from as Record<string, unknown>)[key];
      const b = (to as Record<string, unknown>)[key];
      result[key] = typeof a === 'number' && typeof b === 'number' ? lerp(a, b, t) : b;
    }
    return result;
  }
  // Non-numeric values hold until the next keyframe.
  return t >= 1 ? to : from;
}

/**
 * Evaluate a resolved track at an exact frame. Binary-searches neighboring
 * keyframes, holds when declared, interpolates numeric/geometry values and
 * returns exact endpoint objects at keyframe frames.
 */
export function evaluateTrack<T>(track: RenderTrack<T>, frame: number): T {
  if (track.length === 0) {
    throw new Error('TRACK_EMPTY');
  }
  const first = track[0]!;
  if (frame <= first.frame) return first.value;
  const last = track[track.length - 1]!;
  if (frame >= last.frame) return last.value;

  // Binary search for the segment [lo, hi] with lo.frame <= frame < hi.frame.
  let lo = 0;
  let hi = track.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid]!.frame <= frame) lo = mid;
    else hi = mid;
  }
  const a = track[lo]!;
  const b = track[hi]!;

  if (a.interpolation === 'hold' || a.frame === b.frame) {
    return a.value;
  }

  const span = b.frame - a.frame;
  const rawT = (frame - a.frame) / span;
  const t = a.interpolation === 'ease' && a.easing ? resolveEasing(a.easing)(rawT) : rawT;

  return interpolateValue(a.value, b.value, t) as T;
}
