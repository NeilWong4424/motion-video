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

export const EASING_FUNCTIONS = {
  linear,
  easeOutExpo,
  easeOutQuart,
  easeInOutQuint,
} as const;

export type EasingName = keyof typeof EASING_FUNCTIONS;

export function resolveEasing(name: string): (t: number) => number {
  const fn = (EASING_FUNCTIONS as Record<string, (t: number) => number>)[name];
  if (!fn) {
    throw new Error(`EASING_UNKNOWN: ${name}`);
  }
  return fn;
}
