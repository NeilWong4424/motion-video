import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

import {describe, expect, it} from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const forbidden = [
  'next',
  '@remotion/player',
  'openai',
  '@anthropic-ai/sdk',
  '@ai-sdk/openai',
  '@ai-sdk/anthropic',
  'better-sqlite3',
  'bullmq',
  'redis',
  'pg',
  'axios',
  'undici',
];

describe('dependency boundary', () => {
  const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const allDeps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})};

  it('declares none of the forbidden platform/model/database dependencies', () => {
    for (const name of forbidden) {
      expect(allDeps, `forbidden dependency present: ${name}`).not.toHaveProperty(name);
    }
  });

  it('pins exact versions (no ranges) for every dependency', () => {
    for (const [name, version] of Object.entries(allDeps)) {
      expect(/^[0-9]+\.[0-9]+\.[0-9]+/.test(version), `${name}@${version} is not exact`).toBe(true);
    }
  });

  it('exposes no api/license/env secret script or field', () => {
    const raw = readFileSync(resolve(repoRoot, 'package.json'), 'utf8');
    expect(raw).not.toMatch(/apiKey|licenseKey|publicLicenseKey/);
  });
});
