import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

import {generateMusicPrompt} from '../src/engine/audio/audio-prompt-generator.js';
import {AudioBriefArtifactSchema} from '../src/contracts/audio.js';

// audio:prompt -- --brief <local-json> [--out <dir>]
// Deterministically generates MUSIC_PROMPT.md from a validated AudioBrief.
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function rejectUrl(value) {
  if (value && /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    console.error('URL_INPUT_FORBIDDEN');
    process.exit(1);
  }
}

const briefPath = arg('--brief');
if (!briefPath) {
  console.error('AUDIO_PROMPT_BRIEF_REQUIRED');
  process.exit(1);
}
rejectUrl(briefPath);

const brief = AudioBriefArtifactSchema.parse(JSON.parse(readFileSync(briefPath, 'utf8')));
const result = generateMusicPrompt(brief);

const outDir = arg('--out') ?? dirname(briefPath);
const outPath = join(outDir, 'MUSIC_PROMPT.md');
writeFileSync(outPath, result.markdown);
console.log(outPath);
console.log(`promptContentHash ${result.promptContentHash}`);
