import {describe, expect, it} from 'vitest';

import {MotionSpecSchema} from '../../src/contracts/motion-spec.js';
import {DeterministicLayoutService} from '../../src/engine/resolver/resolve-layout.js';
import {computeSafeArea, estimateTextWidth} from '../../src/engine/resolver/layout-catalog.js';
import type {LayoutContext} from '../../src/engine/resolver/types.js';

const ctx: LayoutContext = {canvasWidth: 1920, canvasHeight: 1080, safeAreaInset: 96};

function textNode(text: string, box: {x: number; y: number; width: number; height: number}) {
  return MotionSpecSchema.shape.world.shape.nodes.element.parse({
    id: 'hero',
    kind: 'text',
    space: 'world',
    semanticRole: 'content',
    renderer: {id: 'base.text', version: '1.0.0', props: {text}},
    effects: [],
    geometryTrack: [{at: {segmentId: 's', progress: 0}, value: {x: box.x, y: box.y, width: box.width, height: box.height}, interpolation: 'hold'}],
    styleTrack: [{at: {segmentId: 's', progress: 0}, value: {opacity: 1}, interpolation: 'hold'}],
    visibleTrack: [{at: {segmentId: 's', progress: 0}, value: 1, interpolation: 'hold'}],
  });
}

describe('deterministic layout', () => {
  it('computes a safe area inset from the canvas', () => {
    const safe = computeSafeArea(1920, 1080);
    expect(safe).toEqual({x: 96, y: 54, width: 1728, height: 972});
  });

  it('fits a short headline within the box and returns lines', () => {
    const service = new DeterministicLayoutService();
    const result = service.resolveNode(textNode('Persistent', {x: 200, y: 200, width: 1400, height: 200}), ctx);
    expect(result.lines).toHaveLength(1);
    expect(result.lines![0]!.fontSize).toBeGreaterThanOrEqual(24);
    expect(service.diagnostics).toEqual([]);
  });

  it('emits TEXT_OVERFLOW when text cannot fit even at min size', () => {
    const service = new DeterministicLayoutService();
    service.resolveNode(textNode('X'.repeat(400), {x: 100, y: 100, width: 200, height: 60}), ctx);
    expect(service.diagnostics.map((d) => d.code)).toContain('TEXT_OVERFLOW');
  });

  it('estimates CJK wider than Latin', () => {
    expect(estimateTextWidth('中文', 40)).toBeGreaterThan(estimateTextWidth('ab', 40));
  });
});
