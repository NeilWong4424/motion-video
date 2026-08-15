import {describe, expect, it} from 'vitest';

import {EASING_FUNCTIONS, resolveEasing, type EasingName} from '../../src/engine/runtime/easing.js';

const ALL_NAMES = Object.keys(EASING_FUNCTIONS) as EasingName[];

// The curves that deliberately overshoot outside [0,1] in their interior.
const OVERSHOOT = new Set<EasingName>(['easeOutBack', 'easeInOutBack', 'spring']);

describe('easing functions', () => {
  it('exposes the expanded curve set', () => {
    for (const name of [
      'linear',
      'easeOutExpo',
      'easeOutQuart',
      'easeInOutQuint',
      'easeOutCubic',
      'easeInOutCubic',
      'easeInQuint',
      'easeOutQuint',
      'easeOutBack',
      'easeInOutBack',
      'spring',
    ] as const) {
      expect(EASING_FUNCTIONS[name]).toBeTypeOf('function');
    }
  });

  it('every curve maps endpoints exactly 0->0 and 1->1', () => {
    for (const name of ALL_NAMES) {
      const fn = EASING_FUNCTIONS[name];
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 10);
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 10);
    }
  });

  it('clamps out-of-range input to the endpoints', () => {
    for (const name of ALL_NAMES) {
      const fn = EASING_FUNCTIONS[name];
      expect(fn(-1), `${name}(-1)`).toBeCloseTo(0, 10);
      expect(fn(2), `${name}(2)`).toBeCloseTo(1, 10);
    }
  });

  it('non-overshoot curves stay within [0,1] across the interior', () => {
    for (const name of ALL_NAMES) {
      if (OVERSHOOT.has(name)) continue;
      const fn = EASING_FUNCTIONS[name];
      for (let i = 0; i <= 20; i++) {
        const y = fn(i / 20);
        expect(y, `${name}(${i / 20})`).toBeGreaterThanOrEqual(-1e-9);
        expect(y, `${name}(${i / 20})`).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('back curves overshoot beyond 1 somewhere in the interior', () => {
    // easeOutBack overshoots past 1 near the end; that is the follow-through.
    let sawOvershoot = false;
    for (let i = 1; i < 20; i++) {
      if (EASING_FUNCTIONS.easeOutBack(i / 20) > 1) sawOvershoot = true;
    }
    expect(sawOvershoot).toBe(true);
  });

  it('resolveEasing returns the named function and throws on unknown', () => {
    expect(resolveEasing('easeOutBack')).toBe(EASING_FUNCTIONS.easeOutBack);
    expect(resolveEasing('spring')).toBe(EASING_FUNCTIONS.spring);
    expect(() => resolveEasing('bogus')).toThrow(/EASING_UNKNOWN/);
  });
});
