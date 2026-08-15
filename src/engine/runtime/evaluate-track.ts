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

// Strict 6-digit hex only (e.g. "#4f8cff"). Deliberately narrow so any other
// color notation (named colors, rgba(), 3-digit hex, gradients) falls through
// to snap-on-arrival — the historical behavior for non-numeric values.
const HEX6 = /^#([0-9a-f]{6})$/i;

function lerpHex(from: string, to: string, t: number): string {
  const fm = HEX6.exec(from);
  const tm = HEX6.exec(to);
  if (!fm || !tm) return t >= 1 ? to : from;
  const fh = fm[1]!;
  const th = tm[1]!;
  let out = '#';
  for (let i = 0; i < 6; i += 2) {
    const a = parseInt(fh.slice(i, i + 2), 16);
    const b = parseInt(th.slice(i, i + 2), 16);
    const v = Math.round(lerp(a, b, t));
    out += v.toString(16).padStart(2, '0');
  }
  return out;
}

// Interpolate one leaf value: numbers lerp, matching 6-digit hex colors lerp in
// RGB, everything else snaps to the destination on arrival (t>=1).
function interpolateLeaf(a: unknown, b: unknown, t: number): unknown {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (typeof a === 'string' && typeof b === 'string' && HEX6.test(a) && HEX6.test(b)) {
    return lerpHex(a, b, t);
  }
  return t >= 1 ? b : a;
}

function interpolateValue(from: unknown, to: unknown, t: number): unknown {
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t);
  }
  if (typeof from === 'string' && typeof to === 'string' && HEX6.test(from) && HEX6.test(to)) {
    return lerpHex(from, to, t);
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
      result[key] = interpolateLeaf(a, b, t);
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
