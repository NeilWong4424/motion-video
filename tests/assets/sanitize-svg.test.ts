import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {sanitizeSvg} from '../../src/engine/project/sanitize-svg.js';

const fixtures = join(import.meta.dirname, '..', 'fixtures', 'assets');

describe('sanitizeSvg', () => {
  it('accepts a safe local SVG', () => {
    const result = sanitizeSvg(readFileSync(join(fixtures, 'safe-logo.svg'), 'utf8'));
    expect(result.ok).toBe(true);
  });

  it('rejects an unsafe SVG with script/image/onload', () => {
    const result = sanitizeSvg(readFileSync(join(fixtures, 'unsafe-logo.svg'), 'utf8'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('ASSET_SVG_UNSAFE');
  });

  it('rejects external CSS url()', () => {
    const svg = '<svg viewBox="0 0 10 10"><rect style="fill:url(https://x/y.png)"/></svg>';
    expect(sanitizeSvg(svg).ok).toBe(false);
  });

  it('rejects a data: URL payload', () => {
    const svg = '<svg viewBox="0 0 10 10"><image href="data:image/png;base64,AAAA"/></svg>';
    expect(sanitizeSvg(svg).ok).toBe(false);
  });

  it('requires a finite viewBox', () => {
    expect(sanitizeSvg('<svg><rect/></svg>').ok).toBe(false);
    expect(sanitizeSvg('<svg viewBox="0 0 x 10"><rect/></svg>').ok).toBe(false);
  });
});
