import {StylePackSchema, type StylePack} from './types.js';

/** Editorial: calm, high-contrast, serious. */
export const editorialPack: StylePack = StylePackSchema.parse({
  id: 'styles/editorial@1.0.0',
  version: '1.0.0',
  colors: {bg: '#0b0c10', surface: '#14161d', ink: '#f5f7fa', muted: '#9aa4b2', accent: '#e8b04b'},
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 700, trackingEm: -0.015, lineHeight: 1.04},
    body: {fontId: 'noto-sans-sc', weight: 400, trackingEm: 0, lineHeight: 1.5},
  },
  spacing: {xs: 8, sm: 16, md: 32, lg: 64, xl: 128},
  radius: {sm: 6, md: 12, lg: 24},
  shadow: {soft: {x: 0, y: 10, blur: 40, spread: -12, color: 'rgba(0,0,0,0.5)'}},
  motion: {profile: 'editorial', heroEase: 'easeOutExpo', standardEase: 'easeOutQuart', travelEase: 'easeInOutQuint'},
});

/** Energetic: bold, saturated, fast register. */
export const energeticPack: StylePack = StylePackSchema.parse({
  id: 'styles/energetic@1.0.0',
  version: '1.0.0',
  colors: {bg: '#0a0a12', surface: '#171426', ink: '#ffffff', muted: '#a79ad0', accent: '#7c5cff'},
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 800, trackingEm: -0.02, lineHeight: 1.0},
    body: {fontId: 'noto-sans-sc', weight: 500, trackingEm: 0, lineHeight: 1.4},
  },
  spacing: {xs: 8, sm: 16, md: 32, lg: 64, xl: 128},
  radius: {sm: 10, md: 20, lg: 40},
  shadow: {soft: {x: 0, y: 12, blur: 48, spread: -8, color: 'rgba(124,92,255,0.35)'}},
  motion: {profile: 'energetic', heroEase: 'easeOutExpo', standardEase: 'easeOutQuart', travelEase: 'easeInOutQuint'},
});

/** Calm: soft, airy, restrained. */
export const calmPack: StylePack = StylePackSchema.parse({
  id: 'styles/calm@1.0.0',
  version: '1.0.0',
  colors: {bg: '#0e1113', surface: '#171b1e', ink: '#eef2f3', muted: '#8fa0a4', accent: '#5bbfa5'},
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 600, trackingEm: -0.005, lineHeight: 1.1},
    body: {fontId: 'noto-sans-sc', weight: 400, trackingEm: 0.005, lineHeight: 1.6},
  },
  spacing: {xs: 8, sm: 16, md: 32, lg: 64, xl: 128},
  radius: {sm: 12, md: 24, lg: 48},
  shadow: {soft: {x: 0, y: 6, blur: 28, spread: -10, color: 'rgba(0,0,0,0.35)'}},
  motion: {profile: 'calm', heroEase: 'easeOutExpo', standardEase: 'easeOutQuart', travelEase: 'easeInOutQuint'},
});

/**
 * Broadcast Noir: a dark, editorial-grade design-system pack. One neutral ramp
 * (bg → surface → surfaceRaised → line), one restrained hero accent (warm brass),
 * a rare cool support hue, and a full type ladder with tuned tracking. This is the
 * professional baseline every dark film should start from instead of raw primaries.
 * Font sizes are NOT in this pack (the schema has no size field); the size ladder
 * lives in craft/design-system.md and each project's registries.tokens, applied to
 * base.text lines[].fontSize. See craft/design-system.md for the token→prop map.
 */
export const broadcastNoirPack: StylePack = StylePackSchema.parse({
  id: 'styles/broadcast-noir@1.0.0',
  version: '1.0.0',
  colors: {
    bg: '#0a0e14',
    surface: '#121821',
    surfaceRaised: '#1a212c',
    ink: '#f2f5f9',
    muted: '#8b97a8',
    line: '#232c39',
    accent: '#e0a43b',
    accentQuiet: '#7a5f2a',
    support: '#5b8fb0',
  },
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 720, trackingEm: -0.02, lineHeight: 1.02},
    headline: {fontId: 'noto-sans-sc', weight: 620, trackingEm: -0.012, lineHeight: 1.08},
    title: {fontId: 'noto-sans-sc', weight: 560, trackingEm: -0.006, lineHeight: 1.2},
    body: {fontId: 'noto-sans-sc', weight: 400, trackingEm: 0, lineHeight: 1.5},
    caption: {fontId: 'noto-sans-sc', weight: 520, trackingEm: 0.06, lineHeight: 1.35},
  },
  spacing: {xs: 8, sm: 12, md: 20, lg: 32, xl: 56, xxl: 96, hero: 160},
  radius: {sm: 8, md: 14, lg: 24, pill: 999},
  shadow: {
    soft: {x: 0, y: 12, blur: 36, spread: -14, color: 'rgba(0,0,0,0.45)'},
    raised: {x: 0, y: 24, blur: 64, spread: -20, color: 'rgba(0,0,0,0.55)'},
    accentGlow: {x: 0, y: 8, blur: 40, spread: -16, color: 'rgba(224,164,59,0.28)'},
  },
  motion: {profile: 'editorial', heroEase: 'easeOutExpo', standardEase: 'easeOutQuart', travelEase: 'easeInOutQuint'},
});

/**
 * Broadcast Daylight: the light counterpart to Broadcast Noir with the same type
 * ladder and spacing, retuned for legibility on a light background (cooler accent,
 * softer shadows). Use for explainers and product films that want an airy register.
 */
export const broadcastDaylightPack: StylePack = StylePackSchema.parse({
  id: 'styles/broadcast-daylight@1.0.0',
  version: '1.0.0',
  colors: {
    bg: '#f4f6f9',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    ink: '#131922',
    muted: '#5b6675',
    line: '#dce2ea',
    accent: '#1f6feb',
    accentQuiet: '#9fc0f2',
    support: '#0f9d7a',
  },
  typography: {
    display: {fontId: 'noto-sans-sc', weight: 700, trackingEm: -0.018, lineHeight: 1.03},
    headline: {fontId: 'noto-sans-sc', weight: 600, trackingEm: -0.01, lineHeight: 1.08},
    title: {fontId: 'noto-sans-sc', weight: 560, trackingEm: -0.004, lineHeight: 1.2},
    body: {fontId: 'noto-sans-sc', weight: 420, trackingEm: 0, lineHeight: 1.5},
    caption: {fontId: 'noto-sans-sc', weight: 540, trackingEm: 0.05, lineHeight: 1.35},
  },
  spacing: {xs: 8, sm: 12, md: 20, lg: 32, xl: 56, xxl: 96, hero: 160},
  radius: {sm: 6, md: 12, lg: 20, pill: 999},
  shadow: {
    soft: {x: 0, y: 12, blur: 36, spread: -14, color: 'rgba(20,30,50,0.10)'},
    raised: {x: 0, y: 24, blur: 64, spread: -20, color: 'rgba(20,30,50,0.16)'},
    accentGlow: {x: 0, y: 8, blur: 40, spread: -16, color: 'rgba(31,111,235,0.20)'},
  },
  motion: {profile: 'playful', heroEase: 'easeOutExpo', standardEase: 'easeOutQuart', travelEase: 'easeInOutQuint'},
});

export const productionStylePacks: readonly StylePack[] = [
  editorialPack,
  energeticPack,
  calmPack,
  broadcastNoirPack,
  broadcastDaylightPack,
];
