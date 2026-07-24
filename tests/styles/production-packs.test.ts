import {describe, expect, it} from 'vitest';

import {createFullStyleCatalog, productionStylePacks} from '../../src/styles/catalog.js';

describe('production style packs', () => {
  it('registers the production packs plus test-neutral', () => {
    const catalog = createFullStyleCatalog();
    const ids = catalog.list().map((p) => p.id);
    expect(ids).toContain('styles/test-neutral@1.0.0');
    expect(ids).toContain('styles/editorial@1.0.0');
    expect(ids).toContain('styles/energetic@1.0.0');
    expect(ids).toContain('styles/calm@1.0.0');
    expect(ids).toContain('styles/broadcast-noir@1.0.0');
    expect(ids).toContain('styles/broadcast-daylight@1.0.0');
  });

  it('has at least three production packs with distinct ids and accents', () => {
    expect(productionStylePacks.length).toBeGreaterThanOrEqual(3);
    const ids = productionStylePacks.map((p) => p.id);
    expect(new Set(ids).size).toBe(productionStylePacks.length);
    const accents = productionStylePacks.map((p) => p.colors.accent);
    expect(new Set(accents).size).toBe(productionStylePacks.length);
    const validProfiles = new Set(['calm', 'editorial', 'energetic', 'playful']);
    for (const p of productionStylePacks) {
      expect(validProfiles.has(p.motion.profile)).toBe(true);
    }
  });

  it('resolves a production pack by id', () => {
    const catalog = createFullStyleCatalog();
    expect(catalog.resolve('styles/energetic@1.0.0').motion.profile).toBe('energetic');
  });
});
