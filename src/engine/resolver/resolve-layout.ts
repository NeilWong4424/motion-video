import type {PersistentNode} from '../../contracts/motion-spec.js';
import type {Diagnostic} from '../../contracts/diagnostic.js';
import {errorDiagnostic} from '../../contracts/diagnostic.js';
import type {LayoutContext, LayoutService, ResolvedNodeLayout} from './types.js';
import {computeSafeArea, estimateTextWidth} from './layout-catalog.js';

export type LayoutTextConfig = {
  minFontSize: number;
  maxFontSize: number;
};

const DEFAULT_TEXT: LayoutTextConfig = {minFontSize: 24, maxFontSize: 160};

/**
 * A deterministic, metric-based layout service. It places a node at its declared
 * geometry origin and fits text within the safe area using estimated advance
 * widths. Unlike a runtime fallback, this runs at resolve time and emits
 * TEXT_OVERFLOW/LAYOUT_COLLISION diagnostics rather than silently shrinking.
 *
 * The browser probe (documented follow-up) supplies exact measured metrics; this
 * service is sufficient for the M1 Golden Film and never runs inside the runtime.
 */
export class DeterministicLayoutService implements LayoutService {
  readonly diagnostics: Diagnostic[] = [];

  constructor(private readonly text: LayoutTextConfig = DEFAULT_TEXT) {}

  resolveNode(node: PersistentNode, context: LayoutContext): ResolvedNodeLayout {
    const geo = node.geometryTrack[0]?.value as
      | {x?: number; y?: number; width?: number; height?: number}
      | undefined;
    const safe = computeSafeArea(context.canvasWidth, context.canvasHeight);

    const x = geo?.x ?? safe.x;
    const y = geo?.y ?? safe.y;
    const width = geo?.width ?? safe.width;
    const height = geo?.height ?? safe.height;

    if (node.kind === 'text') {
      return this.resolveText(node, {x, y, width, height}, safe);
    }

    return {x, y, width, height};
  }

  private resolveText(
    node: PersistentNode,
    box: {x: number; y: number; width: number; height: number},
    safe: {x: number; y: number; width: number; height: number},
  ): ResolvedNodeLayout {
    const props = node.renderer.props as {text?: string} | undefined;
    const text = props?.text ?? '';

    // Fit the single line: largest font size whose width fits the box width.
    let fontSize = this.text.maxFontSize;
    while (fontSize > this.text.minFontSize && estimateTextWidth(text, fontSize) > box.width) {
      fontSize -= 2;
    }
    if (estimateTextWidth(text, fontSize) > box.width) {
      this.diagnostics.push(
        errorDiagnostic('TEXT_OVERFLOW', {nodeId: node.id, evidence: `"${text}" exceeds ${box.width}px at min size`}),
      );
    }

    // Bounds must stay inside the safe area.
    if (box.x < safe.x || box.y < safe.y || box.x + box.width > safe.x + safe.width || box.y + box.height > safe.y + safe.height) {
      this.diagnostics.push(errorDiagnostic('LAYOUT_OUT_OF_SAFE_AREA', {nodeId: node.id}));
    }

    return {
      ...box,
      lines: [{text, x: box.x, y: box.y, fontSize}],
    };
  }
}
