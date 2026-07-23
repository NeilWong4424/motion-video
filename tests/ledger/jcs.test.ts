import {describe, expect, it} from 'vitest';

import {jcsCanonical} from '../../src/engine/ledger/jcs.js';
import {sha256Jcs} from '../../src/engine/ledger/hash.js';

describe('jcsCanonical', () => {
  it('sorts object keys by UTF-16 code unit', () => {
    expect(jcsCanonical({b: 1, a: 2, c: 3})).toBe('{"a":2,"b":1,"c":3}');
  });

  it('orders keys by code unit, not locale', () => {
    // Uppercase letters (U+0041..) sort before lowercase (U+0061..) by code unit.
    expect(jcsCanonical({a: 1, A: 2})).toBe('{"A":2,"a":1}');
  });

  it('sorts nested objects recursively', () => {
    expect(jcsCanonical({z: {y: 1, x: 2}, a: 3})).toBe('{"a":3,"z":{"x":2,"y":1}}');
  });

  it('preserves array order and rejects holes', () => {
    expect(jcsCanonical([3, 1, 2])).toBe('[3,1,2]');
    const holed = [1, 2, 3];
    delete holed[1];
    expect(() => jcsCanonical(holed)).toThrow(/array hole/);
  });

  it('normalizes -0 to 0 and rejects non-finite numbers', () => {
    expect(jcsCanonical(-0)).toBe('0');
    expect(jcsCanonical(0)).toBe('0');
    expect(() => jcsCanonical(NaN)).toThrow(/JCS_NUMBER_INVALID/);
    expect(() => jcsCanonical(Infinity)).toThrow(/JCS_NUMBER_INVALID/);
  });

  it('serializes numbers with ECMAScript Number::toString form', () => {
    expect(jcsCanonical(1)).toBe('1');
    expect(jcsCanonical(1.5)).toBe('1.5');
    expect(jcsCanonical(1e21)).toBe('1e+21');
    expect(jcsCanonical(100)).toBe('100');
  });

  it('escapes strings via minimal JSON escaping', () => {
    expect(jcsCanonical('a"b\\c')).toBe('"a\\"b\\\\c"');
    expect(jcsCanonical('tab\there')).toBe('"tab\\there"');
    expect(jcsCanonical('')).toBe('""');
    expect(jcsCanonical(String.fromCharCode(1))).toBe('"\\u0001"');
  });

  it('rejects undefined, functions, symbols, bigint, and non-plain objects', () => {
    expect(() => jcsCanonical(undefined)).toThrow(/JCS_VALUE_INVALID/);
    expect(() => jcsCanonical(() => 0)).toThrow(/JCS_VALUE_INVALID/);
    expect(() => jcsCanonical(Symbol('x'))).toThrow(/JCS_VALUE_INVALID/);
    expect(() => jcsCanonical(10n)).toThrow(/JCS_VALUE_INVALID/);
    expect(() => jcsCanonical(new Date())).toThrow(/non-plain object/);
    expect(() => jcsCanonical(new Map())).toThrow(/non-plain object/);
  });

  it('rejects an object property whose value is undefined', () => {
    expect(() => jcsCanonical({a: undefined})).toThrow(/undefined value at key/);
  });

  it('produces a stable 64-hex SHA-256 that ignores insertion order', () => {
    const h1 = sha256Jcs({a: 1, b: 2});
    const h2 = sha256Jcs({b: 2, a: 1});
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });
});
