import {mkdtempSync, writeFileSync, rmSync, mkdirSync, copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import sharp from 'sharp';

import {ingestAsset} from '../../src/engine/project/asset-store.js';

let root: string;
let assetRoot: string;
const svgFixtures = join(import.meta.dirname, '..', 'fixtures', 'assets');

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'asset-store-'));
  assetRoot = join(root, 'project', 'assets', 'images');
  mkdirSync(assetRoot, {recursive: true});
  // A real 64x48 red PNG.
  const png = await sharp({create: {width: 64, height: 48, channels: 3, background: {r: 255, g: 0, b: 0}}}).png().toBuffer();
  writeFileSync(join(assetRoot, 'logo.png'), png);
  copyFileSync(join(svgFixtures, 'safe-logo.svg'), join(assetRoot, 'safe.svg'));
  copyFileSync(join(svgFixtures, 'unsafe-logo.svg'), join(assetRoot, 'unsafe.svg'));
});

afterAll(() => {
  rmSync(root, {recursive: true, force: true});
});

function input(file: string, overrides: Record<string, unknown> = {}) {
  return {
    assetId: file,
    absolutePath: join(assetRoot, file),
    projectAssetRoot: assetRoot,
    relativePath: `assets/images/${file}`,
    sourceDeclaration: 'user-supplied',
    licenseStatus: 'user-owned' as const,
    ...overrides,
  };
}

describe('ingestAsset', () => {
  it('accepts a local PNG and records dimensions + hash', async () => {
    const result = await ingestAsset(input('logo.png'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.mime).toBe('image/png');
      expect(result.record.width).toBe(64);
      expect(result.record.height).toBe(48);
      expect(result.record.sha256).toMatch(/^[a-f0-9]{64}$/);
      // Absolute path is never exposed.
      expect(JSON.stringify(result.record)).not.toContain(assetRoot);
    }
  });

  it('accepts a sanitized SVG', async () => {
    const result = await ingestAsset(input('safe.svg'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.mime).toBe('image/svg+xml');
      expect(result.sanitizedSvg).toBeDefined();
    }
  });

  it('rejects an unsafe SVG', async () => {
    const result = await ingestAsset(input('unsafe.svg'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('ASSET_SVG_UNSAFE');
  });

  it('rejects a URL-like source declaration', async () => {
    const result = await ingestAsset(input('logo.png', {relativePath: 'https://evil/x.png'}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('ASSET_URL_FORBIDDEN');
  });

  it('rejects a file outside the project asset root', async () => {
    const outside = join(root, 'outside.png');
    const png = await sharp({create: {width: 4, height: 4, channels: 3, background: {r: 0, g: 0, b: 0}}}).png().toBuffer();
    writeFileSync(outside, png);
    const result = await ingestAsset(input('x', {absolutePath: outside}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('ASSET_PATH_ESCAPE');
  });
});
