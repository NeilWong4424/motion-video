import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

const runtimeDir = join(import.meta.dirname, '..', '..', 'src', 'engine', 'runtime');

function runtimeSources(): string[] {
  return readdirSync(runtimeDir)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => readFileSync(join(runtimeDir, f), 'utf8'));
}

describe('runtime architecture', () => {
  it('mounts no per-beat Scene/Sequence host', () => {
    const sources = runtimeSources();
    for (const src of sources) {
      // Strip line and block comments so documentation mentioning the *absence*
      // of a SceneHost does not trip the check; only real code counts.
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      // No SceneHost component and no Remotion <Sequence> full-frame beat mount.
      expect(code).not.toMatch(/\bSceneHost\b/);
      expect(code).not.toMatch(/<\s*Sequence\b/);
      expect(code).not.toMatch(/\bimport\b[^;]*\bSequence\b/);
    }
  });

  it('does not use Date.now, Math.random or fetch in the runtime graph', () => {
    for (const src of runtimeSources()) {
      expect(src).not.toMatch(/\bDate\.now\s*\(/);
      expect(src).not.toMatch(/\bMath\.random\s*\(/);
      expect(src).not.toMatch(/(?<![.\w])fetch\s*\(/);
    }
  });
});
