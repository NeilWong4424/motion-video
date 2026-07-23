import {describe, expect, it} from 'vitest';

import {StyleCatalog, createDefaultStyleCatalog, testNeutralStylePack} from '../../src/styles/catalog.js';
import {StylePackSchema} from '../../src/styles/types.js';

describe('StyleCatalog', () => {
  it('registers the test-neutral pack and resolves it', () => {
    const catalog = createDefaultStyleCatalog();
    expect(catalog.resolve('styles/test-neutral@1.0.0').id).toBe('styles/test-neutral@1.0.0');
  });

  it('rejects a duplicate pack id', () => {
    const catalog = new StyleCatalog();
    catalog.register(testNeutralStylePack);
    expect(() => catalog.register(testNeutralStylePack)).toThrow(/STYLE_PACK_DUPLICATE/);
  });

  it('rejects an invalid color', () => {
    expect(() =>
      StylePackSchema.parse({...testNeutralStylePack, colors: {bg: 'not-a-color'}}),
    ).toThrow(/STYLE_COLOR_INVALID/);
  });

  it('throws when resolving an unknown pack', () => {
    expect(() => createDefaultStyleCatalog().resolve('styles/missing@1.0.0')).toThrow(
      /STYLE_PACK_NOT_FOUND/,
    );
  });
});
