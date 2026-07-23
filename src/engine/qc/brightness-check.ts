import type {BrightnessEvent} from './types.js';

/**
 * Detect brightness discontinuities using the median absolute deviation (MAD) of
 * adjacent-frame luminance deltas, so legitimate motion (a steady ramp) is not
 * flagged while a sudden flash is. Returns SEAM_FLASH events at spiking frames.
 */
export function findBrightnessDiscontinuities(
  luminanceSeries: readonly number[],
  madMultiplier = 6,
): BrightnessEvent[] {
  if (luminanceSeries.length < 3) return [];
  const deltas: number[] = [];
  for (let i = 1; i < luminanceSeries.length; i++) {
    deltas.push(Math.abs(luminanceSeries[i]! - luminanceSeries[i - 1]!));
  }
  const median = medianOf(deltas);
  const mad = medianOf(deltas.map((d) => Math.abs(d - median)));
  // Guard against zero MAD (perfectly smooth series): use a small absolute floor.
  const threshold = median + madMultiplier * Math.max(mad, 1);

  const events: BrightnessEvent[] = [];
  for (let i = 0; i < deltas.length; i++) {
    if (deltas[i]! > threshold) {
      events.push({code: 'SEAM_FLASH', frame: i + 1, delta: deltas[i]!});
    }
  }
  return events;
}

function medianOf(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
