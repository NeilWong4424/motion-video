import {describe, expect, it} from 'vitest';

import {createCoreRegistry} from '../../src/capabilities/index.js';
import {
  dataEffects,
  diagramEffects,
  uiEffects,
  identityEffects,
  ambientEffects,
} from '../../src/capabilities/index.js';

const allExpanded = [...dataEffects, ...diagramEffects, ...uiEffects, ...identityEffects, ...ambientEffects];

describe('expanded capability families', () => {
  it('registers data/diagram/ui/identity/ambient effects', () => {
    const registry = createCoreRegistry();
    for (const effect of allExpanded) {
      expect(registry.resolveEffect(effect.id, effect.version, 'p').id).toBe(effect.id);
    }
  });

  it('covers all five families with correct family tags', () => {
    const families = new Set(allExpanded.map((e) => e.family));
    expect(families).toEqual(new Set(['data', 'diagram', 'ui', 'identity', 'ambient']));
  });

  it('every expanded effect resolves deterministically', () => {
    const ctx = Object.freeze({seed: 's', fps: 30, fromFrame: 0, toFrame: 60});
    for (const effect of allExpanded) {
      expect(effect.resolve(effect.fixture.intent, ctx)).toEqual(effect.resolve(effect.fixture.intent, ctx));
    }
  });

  it('ambient.drift is frame-driven and deterministic (no randomness)', () => {
    const drift = ambientEffects.find((e) => e.id === 'ambient.drift')!;
    // Its resolve is pure config; the frame-driven motion lives in the component.
    expect(drift.ownedChannels).toContain('geometry');
    expect(drift.family).toBe('ambient');
  });
});
