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

export const productionStylePacks: readonly StylePack[] = [editorialPack, energeticPack, calmPack];
