import {describe, expect, it} from 'vitest';

import {
  projectDurableSafeText,
  redactCredentials,
  substituteSuppliedLocators,
  tokenizeStrongLocators,
  isDurableSafeText,
} from '../../src/engine/ledger/redaction.js';

describe('pass 1: supplied-locator substitution', () => {
  it('replaces exact locators with stable tokens, longest match wins', () => {
    const out = substituteSuppliedLocators('use /a/b and /a/b/c now', [
      {locatorId: 'loc1', value: '/a/b'},
      {locatorId: 'loc2', value: '/a/b/c'},
    ]);
    expect(out).toBe('use [[locator:loc1]] and [[locator:loc2]] now');
  });

  it('breaks equal-length ties by ascending locator id', () => {
    const out = substituteSuppliedLocators('xxxx', [
      {locatorId: 'loc-b', value: 'xxxx'},
      {locatorId: 'loc-a', value: 'xxxx'},
    ]);
    expect(out).toBe('[[locator:loc-a]]');
  });

  it('is a no-op with no locators', () => {
    expect(substituteSuppliedLocators('hello', [])).toBe('hello');
  });
});

describe('pass 2: strong-prefix locator tokenization', () => {
  it('redacts unix, relative, home, unc, and drive paths', () => {
    expect(tokenizeStrongLocators('open /etc/passwd')).toBe('open [[redacted-locator:0]]');
    expect(tokenizeStrongLocators('see ./x and ../y and ~/z')).toBe(
      'see [[redacted-locator:0]] and [[redacted-locator:1]] and [[redacted-locator:2]]',
    );
    expect(tokenizeStrongLocators('unc //host/share')).toBe('unc [[redacted-locator:0]]');
    expect(tokenizeStrongLocators('win C:\\Users\\x')).toBe('win [[redacted-locator:0]]');
    expect(tokenizeStrongLocators('win2 C:/Users/x')).toBe('win2 [[redacted-locator:0]]');
  });

  it('redacts windows drive-relative and reserved device names', () => {
    expect(tokenizeStrongLocators('rel C:foo')).toBe('rel [[redacted-locator:0]]');
    expect(tokenizeStrongLocators('dev CON and NUL.txt and com1.log')).toBe(
      'dev [[redacted-locator:0]] and [[redacted-locator:1]] and [[redacted-locator:2]]',
    );
  });

  it('redacts uri, file:, and data: forms', () => {
    expect(tokenizeStrongLocators('http://example.com/x')).toBe('[[redacted-locator:0]]');
    expect(tokenizeStrongLocators('file:///tmp/x')).toBe('[[redacted-locator:0]]');
    // Comma is a delimiter, so the locator token is `data:text/plain`; `,hi` is prose.
    expect(tokenizeStrongLocators('data:text/plain,hi')).toBe('[[redacted-locator:0]],hi');
    expect(tokenizeStrongLocators('data:text/plain;base64')).toBe('[[redacted-locator:0]];base64');
  });

  it('reuses the first ordinal for identical tokens', () => {
    expect(tokenizeStrongLocators('/a /a /b')).toBe(
      '[[redacted-locator:0]] [[redacted-locator:0]] [[redacted-locator:1]]',
    );
  });

  it('preserves ordinary slash and colon prose byte-exact', () => {
    expect(tokenizeStrongLocators('UI/UX and 24/7')).toBe('UI/UX and 24/7');
    expect(tokenizeStrongLocators('CTA: click here')).toBe('CTA: click here');
    expect(tokenizeStrongLocators('a world cup format explainer')).toBe('a world cup format explainer');
  });

  it('leaves already-projected tokens untouched (idempotence)', () => {
    const once = tokenizeStrongLocators('/etc/passwd');
    expect(tokenizeStrongLocators(once)).toBe(once);
  });
});

describe('pass 3: credential redaction', () => {
  it('redacts a whole PEM private-key block', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----';
    expect(redactCredentials(`key ${pem} end`)).toBe('key [[redacted-secret:0]] end');
  });

  it('refuses an unterminated PEM begin marker', () => {
    expect(() => redactCredentials('-----BEGIN PRIVATE KEY-----\nMIIB')).toThrow(
      /LEDGER_REDACTION_PEM_UNTERMINATED/,
    );
  });

  it('redacts authorization Bearer/Basic values but keeps the scheme', () => {
    expect(redactCredentials('Authorization: Bearer abc.def-123')).toContain('Bearer [[redacted-secret:0]]');
    expect(redactCredentials('Basic QWxhZGRpbg==')).toBe('Basic [[redacted-secret:0]]');
  });

  it('redacts labeled keys and preserves label/separator', () => {
    expect(redactCredentials('api_key=SECRETVALUE1')).toBe('api_key=[[redacted-secret:0]]');
    expect(redactCredentials('password: hunter2value')).toBe('password: [[redacted-secret:0]]');
    expect(redactCredentials('MY_TOKEN=abcdef123456')).toBe('MY_TOKEN=[[redacted-secret:0]]');
    expect(redactCredentials('"clientSecret": "s3cr3tstring"')).toContain('[[redacted-secret:0]]');
  });

  it('redacts CLI credential flags', () => {
    expect(redactCredentials('--api-key=ABCdef123456')).toBe('--api-key=[[redacted-secret:0]]');
    expect(redactCredentials('--token supersecretvalue')).toBe('--token [[redacted-secret:0]]');
  });

  it('does not treat an empty CLI flag value as a secret', () => {
    // `--token` at end of input with no value is ordinary incomplete prose.
    expect(redactCredentials('--token')).toBe('--token');
  });

  it('redacts provider-prefixed tokens and AKIA ids', () => {
    expect(redactCredentials('sk-ABC123def456')).toBe('[[redacted-secret:0]]');
    expect(redactCredentials('github_pat_XYZ789abc')).toBe('[[redacted-secret:0]]');
    expect(redactCredentials('AKIAABCDEFGHIJKLMNOP')).toBe('[[redacted-secret:0]]');
  });

  it('redacts a generic high-complexity 32+ token', () => {
    const tok = 'Ab1' + 'x'.repeat(40); // has upper, lower, digit, length>=32
    expect(redactCredentials(`val ${tok}`)).toBe('val [[redacted-secret:0]]');
  });

  it('leaves ordinary words and short tokens alone', () => {
    expect(redactCredentials('world cup format explainer')).toBe('world cup format explainer');
    expect(redactCredentials('CTA: click')).toBe('CTA: click');
  });
});

describe('full transform', () => {
  it('is idempotent across all passes', () => {
    const input = 'render /home/user/clip.mov with api_key=Abc123Def456 and CTA: go';
    const once = projectDurableSafeText(input);
    const twice = projectDurableSafeText(once);
    expect(twice).toBe(once);
    expect(isDurableSafeText(once)).toBe(true);
  });

  it('keeps a plain instruction unchanged', () => {
    const input = 'make a video about world cup format explainer';
    expect(projectDurableSafeText(input)).toBe(input);
    expect(isDurableSafeText(input)).toBe(true);
  });
});
