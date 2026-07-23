import {describe, expect, it} from 'vitest';

import {createFullStyleCatalog, productionStylePacks} from '../../src/styles/catalog.js';

describe('production style packs', () => {
  it('registers three distinct production packs plus test-neutral', () => {
    const catalog = createFullStyleCatalog();
    const ids = catalog.list().map((p) => p.id);
    expect(ids).toContain('styles/test-neutral@1.0.0');
    expect(ids).toContain('styles/editorial@1.0.0');
    expect(ids).toContain('styles/energetic@1.0.0');
    expect(ids).toContain('styles/calm@1.0.0');
  });

  it('each production pack has a distinct accent color and motion profile', () => {
    const accents = productionStylePacks.map((p) => p.colors.accent);
    expect(new Set(accents).size).toBe(productionStylePacks.length);
    const profiles = productionStylePacks.map((p) => p.motion.profile);
    expect(profiles).toEqual(['editorial', 'energetic', 'calm']);
  });

  it('resolves a production pack by id', () => {
    const catalog = createFullStyleCatalog();
    expect(catalog.resolve('styles/energetic@1.0.0').motion.profile).toBe('energetic');
  });
});
