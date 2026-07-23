import {describe, expect, it} from 'vitest';

import {validateContinuity} from '../../src/engine/resolver/validate-continuity.js';
import {codes} from '../../src/engine/resolver/continuity-diagnostics.js';
import {loadSpec, makeTreatment} from './helpers.js';

// Build a two-beat push variant from the tiny-anchor fixture's structure.
function pushSpec(direction: 'left' | 'right' | 'up' | 'down', semantic: 'forward' | 'back' | 'parallel') {
  const spec = structuredClone(loadSpec('valid-continuity'));
  // Reduce to two beats + one directional-push bridge.
  spec.timeline.beats = spec.timeline.beats.slice(0, 2);
  spec.timeline.bridges = [
    {
      id: 'push',
      fromBeatId: 'hook',
      toBeatId: 'proof',
      durationFrames: 20,
      narrativeReason: 'forward push',
      transitionFamily: 'directional-push',
      vocabularyRole: 'ordinary',
      eyeTrace: {
        outgoing: {nodeId: 'hero', point: {x: 0.5, y: 0.5}},
        incoming: {nodeId: 'card', point: {x: 0.5, y: 0.5}},
      },
      motionOwnership: 'node',
      mode: 'directional-push',
      direction,
      semanticDirection: semantic,
    },
  ];
  return spec;
}

describe('directional push', () => {
  it('accepts a forward push', () => {
    const spec = pushSpec('left', 'forward');
    const result = codes(
      validateContinuity(makeTreatment({transitionVocabulary: ['directional-push']}), spec),
    );
    expect(result).not.toContain('BRIDGE_REALIZATION_MISMATCH');
  });

  it('flags backward motion declared forward', () => {
    const spec = pushSpec('down', 'forward');
    const result = codes(
      validateContinuity(makeTreatment({transitionVocabulary: ['directional-push']}), spec),
    );
    expect(result).toContain('BRIDGE_REALIZATION_MISMATCH');
  });
});
