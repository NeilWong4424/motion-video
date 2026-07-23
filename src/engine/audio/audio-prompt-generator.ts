import {AudioBriefArtifactSchema, type AudioBriefArtifact} from '../../contracts/audio.js';
import {sha256Canonical, sha256Hex} from '../hash.js';
import {formatSeconds, sanitizeText} from './format.js';

export type MusicPromptResult = {
  markdown: string;
  promptContentHash: string;
  audioBriefHash: string;
};

const TEMPLATE_ID = 'music-prompt-document@1.0.0';
const COMPILER_ID = 'audio-prompt-compiler@1.0.0';
const COMPILER_CONTRACT = 'audio-prompt-projection/1';

/**
 * Deterministically project a validated AudioBriefArtifact into MUSIC_PROMPT.md.
 * The AudioBrief bytes are the only semantic source; all free text is
 * sanitized so no field can inject Markdown or a fence. LF endings only.
 */
export function generateMusicPrompt(brief: AudioBriefArtifact): MusicPromptResult {
  const validated = AudioBriefArtifactSchema.parse(brief);
  const audioBriefHash = sha256Canonical(validated);

  const durationSeconds = formatSeconds(validated.durationFrames, validated.fps);
  const style = sanitizeText(validated.style);
  const instrumentation = sanitizeText(validated.instrumentation.join(', '));
  const hook = sanitizeText(validated.hook);
  const dynamics = sanitizeText(validated.dynamics ?? 'natural build to the payoff, gentle resolve');
  const exclude = sanitizeText((validated.exclude ?? ['vocals', 'sfx']).join(', '));
  const sfxNotes = sanitizeText((validated.sfxNotes ?? ['none']).join('; '));

  const cueLines = validated.cues
    .map((c) => `- ${c.role} @ frame ${c.startFrame} (${formatSeconds(c.startFrame, validated.fps)}s): ${sanitizeText(c.text)}`)
    .join('\n');

  const payoff = validated.cues.find((c) => c.role === 'payoff')!;
  const payoffTiming = `frame ${payoff.startFrame} (${formatSeconds(payoff.startFrame, validated.fps)}s): ${sanitizeText(payoff.text)}`;

  const promptBlock = [
    `Create an instrumental cue only, exactly ${durationSeconds} seconds long.`,
    '',
    `Style: ${style}`,
    `Instrumentation: ${instrumentation}`,
    `Hook or signature idea: ${hook}`,
    'Cue structure, timed to the locked picture:',
    cueLines,
    `Dynamic contour: ${dynamics}`,
    `Single visual payoff alignment: ${payoffTiming}`,
    '',
    `Avoid: ${exclude}`,
    'Do not include vocals, spoken words, dialogue, automatic or synthetic voice, or sound effects. Keep the cue continuous and support the locked visual timing without changing its duration.',
  ].join('\n');

  if ([...promptBlock].length > 4000) {
    throw new Error('AUDIO_PROMPT_TOO_LONG');
  }

  const markdown = [
    '# Music Prompt',
    '',
    `- Template: \`${TEMPLATE_ID}\``,
    `- Compiler: \`${COMPILER_ID}\``,
    `- Compiler contract: \`${COMPILER_CONTRACT}\``,
    '',
    '## PASTE THIS INTO THE MUSIC GENERATOR',
    '',
    '```text',
    promptBlock,
    '```',
    '',
    '## Cut binding — do not paste',
    '',
    `- Cut binding: project \`${validated.projectId}\`, revision \`${validated.revisionId}\`, RenderPlan \`${validated.renderPlanHash}\``,
    `- Parent binding: AudioBrief \`${audioBriefHash}\``,
    `- Timing: \`${validated.fps}\` fps, \`${validated.durationFrames}\` frames, duration \`${durationSeconds}\` seconds`,
    `- Payoff: frame \`${payoff.startFrame}\` (\`${formatSeconds(payoff.startFrame, validated.fps)}s\`)`,
    `- Manual SFX production notes: \`${sfxNotes}\``,
    '',
  ].join('\n');

  return {markdown, promptContentHash: sha256Hex(markdown), audioBriefHash};
}
