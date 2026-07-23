import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {sha256Hex} from '../hash.js';
import type {RepoContext} from './paths.js';

export type FontEntry = {
  fontId: string;
  family: string;
  staticFilePath: string;
  sha256: string;
};

// The packaged local fonts. Render-time downloads and system fallback are
// forbidden; a missing packaged file fails the manifest.
const PACKAGED_FONTS: Array<{fontId: string; family: string; file: string}> = [
  {fontId: 'noto-sans-sc', family: 'Noto Sans SC Variable', file: 'fonts/NotoSansSC.woff2'},
  {fontId: 'noto-sans-tc', family: 'Noto Sans TC Variable', file: 'fonts/NotoSansTC.woff2'},
];

export function buildFontManifest(context: RepoContext): FontEntry[] {
  return PACKAGED_FONTS.map((font) => {
    const abs = join(context.repoRoot, 'public', font.file);
    if (!existsSync(abs)) {
      throw new Error(`FONT_FILE_MISSING: ${font.file}`);
    }
    return {
      fontId: font.fontId,
      family: font.family,
      staticFilePath: font.file,
      sha256: sha256Hex(readFileSync(abs)),
    };
  });
}

export function fontFamilyFor(fontId: string): string {
  const found = PACKAGED_FONTS.find((f) => f.fontId === fontId);
  if (!found) throw new Error(`FONT_UNKNOWN: ${fontId}`);
  return found.family;
}
