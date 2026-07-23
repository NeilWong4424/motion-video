import {describe, expect, it} from 'vitest';

import {canonicalJson} from '../../src/engine/canonical-json.js';
import {sha256Canonical, sha256Hex} from '../../src/engine/hash.js';

describe('canonicalJson', () => {
  it('orders object keys lexicographically', () => {
    expect(canonicalJson({b: 2, a: 1})).toBe('{"a":1,"b":2}');
  });

  it('orders nested keys recursively', () => {
    expect(canonicalJson({z: {b: 2, a: 1}, a: [3, {d: 4, c: 5}]})).toBe(
      '{"a":[3,{"c":5,"d":4}],"z":{"a":1,"b":2}}',
    );
  });

  it('normalizes negative zero to zero', () => {
    expect(canonicalJson({a: -0})).toBe('{"a":0}');
  });

  it('preserves dense array order', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });

  it('rejects NaN and Infinity', () => {
    expect(() => canonicalJson({a: Number.NaN})).toThrow(/CANONICAL_NUMBER_INVALID/);
    expect(() => canonicalJson({a: Number.POSITIVE_INFINITY})).toThrow(/CANONICAL_NUMBER_INVALID/);
  });

  it('rejects undefined, holes, functions, symbols and bigint', () => {
    expect(() => canonicalJson({a: undefined})).toThrow(/CANONICAL_VALUE_INVALID/);
    const sparse: unknown[] = [];
    sparse[1] = 1; // index 0 is a hole
    expect(() => canonicalJson(sparse)).toThrow(/CANONICAL_VALUE_INVALID/);
    expect(() => canonicalJson({a: () => 1})).toThrow(/CANONICAL_VALUE_INVALID/);
    expect(() => canonicalJson({a: Symbol('x')})).toThrow(/CANONICAL_VALUE_INVALID/);
    expect(() => canonicalJson({a: 1n})).toThrow(/CANONICAL_VALUE_INVALID/);
  });

  it('escapes strings as JSON', () => {
    expect(canonicalJson({a: 'he said "hi"\n'})).toBe('{"a":"he said \\"hi\\"\\n"}');
  });
});

describe('sha256Canonical', () => {
  it('is invariant to key order', () => {
    expect(sha256Canonical({b: 2, a: 1})).toBe(sha256Canonical({a: 1, b: 2}));
  });

  it('produces a lowercase 64-hex digest', () => {
    expect(sha256Canonical({a: 1})).toMatch(/^[a-f0-9]{64}$/);
  });

  it('sha256Hex hashes exact bytes', () => {
    // Known SHA-256 of the empty string.
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
