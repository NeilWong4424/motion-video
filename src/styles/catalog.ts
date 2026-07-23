import {StylePackSchema, type StylePack} from './types.js';
import {productionStylePacks} from './production-packs.js';

export {productionStylePacks};

/** The neutral test style pack. Production packs arrive in Task 12. */
export const testNeutralStylePack: StylePack = StylePackSchema.parse({
  id: 'styles/test-neutral@1.0.0',
  version: '1.0.0',
  colors: {
    bg: '#0b0c10',
    surface: '#15171e',
    ink: '#f5f7fa',
    muted: '#9aa4b2',
    accent: '#4f8cff',
  },
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 700, trackingEm: -0.01, lineHeight: 1.05},
    body: {fontId: 'noto-sans-sc', weight: 400, trackingEm: 0, lineHeight: 1.4},
  },
  spacing: {xs: 8, sm: 16, md: 32, lg: 64, xl: 128},
  radius: {sm: 8, md: 16, lg: 32},
  shadow: {
    soft: {x: 0, y: 8, blur: 32, spread: -8, color: 'rgba(0,0,0,0.4)'},
  },
  motion: {
    profile: 'editorial',
    heroEase: 'easeOutExpo',
    standardEase: 'easeOutQuart',
    travelEase: 'easeInOutQuint',
  },
});

export class StyleCatalog {
  private readonly packs = new Map<string, StylePack>();

  register(pack: StylePack): void {
    const parsed = StylePackSchema.parse(pack);
    if (this.packs.has(parsed.id)) throw new Error('STYLE_PACK_DUPLICATE');
    this.packs.set(parsed.id, parsed);
  }

  resolve(id: string): StylePack {
    const pack = this.packs.get(id);
    if (!pack) throw new Error('STYLE_PACK_NOT_FOUND');
    return pack;
  }

  list(): readonly StylePack[] {
    return [...this.packs.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
}

export function createDefaultStyleCatalog(): StyleCatalog {
  const catalog = new StyleCatalog();
  catalog.register(testNeutralStylePack);
  return catalog;
}

/** A catalog with the neutral test pack plus the three production packs. */
export function createFullStyleCatalog(): StyleCatalog {
  const catalog = new StyleCatalog();
  catalog.register(testNeutralStylePack);
  for (const pack of productionStylePacks) {
    catalog.register(pack);
  }
  return catalog;
}
