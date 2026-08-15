/**
 * Deterministic named easing functions from direct math. Input and output are
 * clamped to [0, 1]. Unknown easing is a compile-time validation error
 * elsewhere, never a runtime fallback.
 */

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function linear(t: number): number {
  return clamp01(t);
}

export function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutQuart(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 4);
}

export function easeInOutQuint(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeInQuint(t: number): number {
  const x = clamp01(t);
  return x * x * x * x * x;
}

export function easeOutQuint(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 5);
}

/**
 * Back curves deliberately overshoot outside [0, 1] mid-range to give hero
 * elements weight and follow-through. Endpoints remain exactly 0 and 1; only
 * the interior anticipates/overshoots. The overshoot constant 1.70158 is the
 * standard Penner value (~10% overshoot).
 */
const BACK_C1 = 1.70158;
const BACK_C2 = BACK_C1 * 1.525;
const BACK_C3 = BACK_C1 + 1;

export function easeOutBack(t: number): number {
  const x = clamp01(t);
  return 1 + BACK_C3 * Math.pow(x - 1, 3) + BACK_C1 * Math.pow(x - 1, 2);
}

export function easeInOutBack(t: number): number {
  const x = clamp01(t);
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((BACK_C2 + 1) * 2 * x - BACK_C2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((BACK_C2 + 1) * (x * 2 - 2) + BACK_C2) + 2) / 2;
}

/**
 * Closed-form damped spring settle. Deterministic (no per-frame state): a
 * decaying cosine that starts at 0, overshoots 1, and settles to exactly 1 at
 * t=1. Gives a natural "land and settle" feel for hero arrivals.
 */
export function spring(t: number): number {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  const decay = Math.exp(-6 * x);
  return 1 - decay * Math.cos(12 * x);
}

export const EASING_FUNCTIONS = {
  linear,
  easeOutExpo,
  easeOutQuart,
  easeInOutQuint,
  easeOutCubic,
  easeInOutCubic,
  easeInQuint,
  easeOutQuint,
  easeOutBack,
  easeInOutBack,
  spring,
} as const;

export type EasingName = keyof typeof EASING_FUNCTIONS;

export function resolveEasing(name: string): (t: number) => number {
  const fn = (EASING_FUNCTIONS as Record<string, (t: number) => number>)[name];
  if (!fn) {
    throw new Error(`EASING_UNKNOWN: ${name}`);
  }
  return fn;
}
