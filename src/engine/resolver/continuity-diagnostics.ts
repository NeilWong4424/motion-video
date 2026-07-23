import type {Diagnostic} from '../../contracts/diagnostic.js';

/** Extract stable diagnostic codes for concise test assertions. */
export function codes(diagnostics: readonly Diagnostic[]): string[] {
  return diagnostics.map((d) => d.code);
}

/** Euclidean distance between two canvas-normalized points. */
export function normalizedDistance(
  a: {x: number; y: number},
  b: {x: number; y: number},
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
