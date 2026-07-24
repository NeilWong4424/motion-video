import {describe, expect, it} from 'vitest';

import {ResolvedNodeSchema} from '../../src/contracts/resolved-motion.js';

const baseNode = {
  id: 'n',
  kind: 'text' as const,
  space: 'world' as const,
  semanticRole: 'content' as const,
  zIndex: 0,
  localBounds: {x: 0, y: 0, width: 10, height: 10},
  worldBounds: {x: 0, y: 0, width: 10, height: 10},
  renderer: {id: 'base.text', version: '1.0.0', implementationHash: 'a'.repeat(64), scope: 'core'},
  rendererProps: {text: 'x'},
  geometryTrack: [],
  styleTrack: [],
  contentTrack: [],
  visibleTrack: [],
};

describe('ResolvedNodeSchema effect intent', () => {
  it('round-trips a resolved effect carrying a validated intent', () => {
    const parsed = ResolvedNodeSchema.parse({
      ...baseNode,
      effects: [
        {
          id: 'text.mask-rise',
          version: '1.0.0',
          implementationHash: 'b'.repeat(64),
          scope: 'core',
          fromFrame: 0,
          toFrame: 30,
          channels: ['geometry', 'opacity'],
          intent: {riseFraction: 0.4},
        },
      ],
    });
    expect((parsed.effects[0]!.intent as {riseFraction: number}).riseFraction).toBe(0.4);
  });
});
