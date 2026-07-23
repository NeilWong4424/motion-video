import {describe, expect, it} from 'vitest';

import {
  ARTIFACT_CANDIDATE_BUDGET,
  REVIEW_CANDIDATE_BUDGET,
  enforceCandidateBudget,
  type CandidateBudget,
} from '../../src/engine/acceptance/candidate-budget.js';

const B = ARTIFACT_CANDIDATE_BUDGET;

function tiny(overrides: Partial<CandidateBudget>): CandidateBudget {
  return {...ARTIFACT_CANDIDATE_BUDGET, ...overrides};
}

describe('enforceCandidateBudget — valid documents', () => {
  it('accepts a well-formed object', () => {
    const r = enforceCandidateBudget('{"a":1,"b":[true,false,null],"c":"hi"}', B);
    expect(r.ok).toBe(true);
  });

  it('accepts nested structures and reports byte length', () => {
    const text = '{"x":{"y":{"z":[1,2,3]}}}';
    const r = enforceCandidateBudget(text, B);
    expect(r).toMatchObject({ok: true, byteLength: text.length});
  });

  it('accepts a bare scalar top-level value', () => {
    expect(enforceCandidateBudget('42', B).ok).toBe(true);
    expect(enforceCandidateBudget('"hello"', B).ok).toBe(true);
    expect(enforceCandidateBudget('true', B).ok).toBe(true);
  });

  it('accepts unicode strings and counts scalars', () => {
    expect(enforceCandidateBudget('{"k":"héllo 世界"}', B).ok).toBe(true);
  });
});

describe('enforceCandidateBudget — malformed structure', () => {
  it('rejects trailing content after the top-level value', () => {
    expect(enforceCandidateBudget('{} {}', B)).toMatchObject({ok: false, code: 'JSON_TRAILING'});
  });

  it('rejects unbalanced containers', () => {
    expect(enforceCandidateBudget('{"a":1', B)).toMatchObject({ok: false, code: 'JSON_UNBALANCED'});
    expect(enforceCandidateBudget('[1,2', B)).toMatchObject({ok: false, code: 'JSON_UNBALANCED'});
    expect(enforceCandidateBudget('{]', B)).toMatchObject({ok: false});
  });

  it('rejects a non-string object key', () => {
    expect(enforceCandidateBudget('{1:2}', B)).toMatchObject({ok: false, code: 'JSON_OBJECT'});
  });

  it('rejects a duplicate object key', () => {
    expect(enforceCandidateBudget('{"a":1,"a":2}', B)).toMatchObject({ok: false, code: 'JSON_DUPLICATE_KEY'});
  });

  it('rejects an unterminated / bad string', () => {
    expect(enforceCandidateBudget('{"a":"x', B)).toMatchObject({ok: false});
    expect(enforceCandidateBudget('"\\q"', B)).toMatchObject({ok: false, code: 'JSON_STRING'});
  });

  it('rejects an empty document', () => {
    expect(enforceCandidateBudget('   ', B)).toMatchObject({ok: false, code: 'JSON_EMPTY'});
  });

  it('rejects a key without a value', () => {
    expect(enforceCandidateBudget('{"a"}', B)).toMatchObject({ok: false});
  });
});

describe('enforceCandidateBudget — limit breaches', () => {
  it('BUDGET_BYTES when over the byte cap', () => {
    const budget = tiny({maxUtf8Bytes: 4});
    expect(enforceCandidateBudget('"abcdef"', budget)).toMatchObject({ok: false, code: 'BUDGET_BYTES'});
  });

  it('BUDGET_DEPTH when nesting is too deep', () => {
    const budget = tiny({maxJsonDepth: 2});
    expect(enforceCandidateBudget('[[[1]]]', budget)).toMatchObject({ok: false, code: 'BUDGET_DEPTH'});
    expect(enforceCandidateBudget('[[1]]', budget).ok).toBe(true);
  });

  it('BUDGET_ARRAY_MEMBERS when an array has too many elements', () => {
    const budget = tiny({maxArrayMembersPerArray: 2});
    expect(enforceCandidateBudget('[1,2,3]', budget)).toMatchObject({ok: false, code: 'BUDGET_ARRAY_MEMBERS'});
    expect(enforceCandidateBudget('[1,2]', budget).ok).toBe(true);
  });

  it('BUDGET_OBJECT_MEMBERS when an object has too many members', () => {
    const budget = tiny({maxObjectMembersPerObject: 1});
    expect(enforceCandidateBudget('{"a":1,"b":2}', budget)).toMatchObject({
      ok: false,
      code: 'BUDGET_OBJECT_MEMBERS',
    });
    expect(enforceCandidateBudget('{"a":1}', budget).ok).toBe(true);
  });

  it('BUDGET_STRING_PER_VALUE when one string is too long', () => {
    const budget = tiny({maxStringUnicodeScalarsPerValue: 3});
    expect(enforceCandidateBudget('"abcd"', budget)).toMatchObject({
      ok: false,
      code: 'BUDGET_STRING_PER_VALUE',
    });
    expect(enforceCandidateBudget('"abc"', budget).ok).toBe(true);
  });

  it('BUDGET_STRING_TOTAL across all strings', () => {
    const budget = tiny({maxStringUnicodeScalarsTotal: 4});
    expect(enforceCandidateBudget('["ab","ab","ab"]', budget)).toMatchObject({
      ok: false,
      code: 'BUDGET_STRING_TOTAL',
    });
  });

  it('BUDGET_TOKENS when too many tokens', () => {
    const budget = tiny({maxJsonTokens: 3});
    expect(enforceCandidateBudget('[1,2,3,4]', budget)).toMatchObject({ok: false, code: 'BUDGET_TOKENS'});
  });
});

describe('surrogate handling', () => {
  it('accepts a valid surrogate pair as one scalar', () => {
    // U+1F600 grinning face
    const text = JSON.stringify({k: '\u{1F600}'});
    const budget = tiny({maxStringUnicodeScalarsPerValue: 1});
    expect(enforceCandidateBudget(text, budget).ok).toBe(true);
  });

  it('rejects an unpaired surrogate', () => {
    const text = '{"k":"\\ud800"}';
    expect(enforceCandidateBudget(text, B)).toMatchObject({ok: false, code: 'JSON_STRING_SURROGATE'});
  });
});

describe('profiles are literal constants', () => {
  it('exposes the two exact budget profiles', () => {
    expect(ARTIFACT_CANDIDATE_BUDGET.maxUtf8Bytes).toBe(8388608);
    expect(REVIEW_CANDIDATE_BUDGET.maxUtf8Bytes).toBe(4194304);
    expect(ARTIFACT_CANDIDATE_BUDGET.profile).toBe('artifact-candidate-budget@1');
    expect(REVIEW_CANDIDATE_BUDGET.profile).toBe('review-candidate-budget@1');
  });
});
