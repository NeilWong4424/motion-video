import {describe, expect, it} from 'vitest';

import {createCoreRegistry} from '../../src/capabilities/index.js';
import {textEffects} from '../../src/capabilities/text/index.js';

describe('text capability pack', () => {
  it('registers all six text effects into the core registry', () => {
    const registry = createCoreRegistry();
    for (const effect of textEffects) {
      const resolved = registry.resolveEffect(effect.id, effect.version, 'any');
      expect(resolved.id).toBe(effect.id);
      expect(resolved.implementationHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('every text effect resolves deterministically with a frozen context', () => {
    const ctx = Object.freeze({seed: 's', fps: 30, fromFrame: 0, toFrame: 30});
    for (const effect of textEffects) {
      const a = effect.resolve(effect.fixture.intent, ctx);
      const b = effect.resolve(effect.fixture.intent, ctx);
      expect(a).toEqual(b);
    }
  });

  it('each text effect owns a non-empty unique channel set', () => {
    for (const effect of textEffects) {
      expect(effect.ownedChannels.length).toBeGreaterThan(0);
      expect(new Set(effect.ownedChannels).size).toBe(effect.ownedChannels.length);
    }
  });

  it('exposes distinct owned channels across the pack (mask-rise vs word-replace)', () => {
    const registry = createCoreRegistry();
    const maskRise = registry.resolveEffect('text.mask-rise', '1.0.0', 'p');
    const wordReplace = registry.resolveEffect('text.word-replace', '1.0.0', 'p');
    expect(maskRise.ownedChannels).toContain('opacity');
    expect(wordReplace.ownedChannels).toContain('content');
  });
});
