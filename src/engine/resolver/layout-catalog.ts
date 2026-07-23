export type LayoutPresetId =
  | 'center-stack'
  | 'full-frame-type'
  | 'top-copy-bottom-visual'
  | 'split'
  | 'stat-focus'
  | 'diagram-flow';

export type SafeArea = {x: number; y: number; width: number; height: number};

export function computeSafeArea(canvasWidth: number, canvasHeight: number, insetFraction = 0.05): SafeArea {
  const insetX = Math.round(canvasWidth * insetFraction);
  const insetY = Math.round(canvasHeight * insetFraction);
  return {
    x: insetX,
    y: insetY,
    width: canvasWidth - insetX * 2,
    height: canvasHeight - insetY * 2,
  };
}

/**
 * Approximate advance-width per character for a variable sans font at a given
 * font size. This is a deterministic estimate used by the metric layout service;
 * the browser probe (documented follow-up) provides exact measured metrics.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Latin average advance ~0.52em; CJK ~1.0em.
  let em = 0;
  for (const ch of text) {
    em += ch.codePointAt(0)! > 0x2e7f ? 1.0 : 0.52;
  }
  return em * fontSize;
}

export const LAYOUT_PRESETS: readonly LayoutPresetId[] = [
  'center-stack',
  'full-frame-type',
  'top-copy-bottom-visual',
  'split',
  'stat-focus',
  'diagram-flow',
];
