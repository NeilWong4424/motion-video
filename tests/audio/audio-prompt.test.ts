import {describe, expect, it} from 'vitest';

import {formatSeconds, sanitizeText} from '../../src/engine/audio/format.js';
import {generateMusicPrompt} from '../../src/engine/audio/audio-prompt-generator.js';
import {AudioBriefArtifactSchema, type AudioBriefArtifact} from '../../src/contracts/audio.js';

function brief(overrides: Partial<AudioBriefArtifact> = {}): AudioBriefArtifact {
  return AudioBriefArtifactSchema.parse({
    schemaVersion: 'audio-brief@1',
    projectId: 'golden-continuity',
    revisionId: 'rev-0001',
    renderPlanHash: 'a'.repeat(64),
    fps: 30,
    durationFrames: 600,
    style: 'warm editorial underscore',
    instrumentation: ['felt piano', 'sub bass'],
    hook: 'a rising two-note motif',
    cues: [
      {id: 'c-intro', startFrame: 0, role: 'intro', text: 'soft entrance'},
      {id: 'c-payoff', startFrame: 450, role: 'payoff', text: 'hit the downbeat as the chart resolves'},
    ],
    ...overrides,
  });
}

describe('formatSeconds', () => {
  it('formats with exact three decimals via integer round-half-up', () => {
    expect(formatSeconds(0, 30)).toBe('0.000');
    expect(formatSeconds(450, 30)).toBe('15.000');
    expect(formatSeconds(1, 30)).toBe('0.033');
    expect(formatSeconds(45, 30)).toBe('1.500');
  });

  it('rejects invalid input', () => {
    expect(() => formatSeconds(-1, 30)).toThrow(/AUDIO_FORMAT_INPUT_INVALID/);
    expect(() => formatSeconds(1, 0)).toThrow(/AUDIO_FORMAT_INPUT_INVALID/);
  });
});

describe('sanitizeText', () => {
  it('collapses whitespace, converts backticks and trims', () => {
    expect(sanitizeText('  a\n\n`b`\tc  ')).toBe("a 'b' c");
  });

  it('rejects control chars and empty results', () => {
    expect(() => sanitizeText('ab')).toThrow(/AUDIO_TEXT_INVALID/);
    expect(() => sanitizeText('   ')).toThrow(/AUDIO_TEXT_EMPTY/);
  });
});

describe('generateMusicPrompt', () => {
  it('produces a deterministic LF MUSIC_PROMPT.md bound to the brief', () => {
    const a = generateMusicPrompt(brief());
    const b = generateMusicPrompt(brief());
    expect(a.markdown).toBe(b.markdown);
    expect(a.markdown).not.toContain('\r');
    expect(a.markdown).toContain('# Music Prompt');
    expect(a.markdown).toContain('payoff @ frame 450 (15.000s)');
    expect(a.promptContentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes the prompt hash when the brief changes', () => {
    const a = generateMusicPrompt(brief());
    const b = generateMusicPrompt(brief({style: 'cold minimal pulse'}));
    expect(a.promptContentHash).not.toBe(b.promptContentHash);
  });

  it('does not leak an injected fence from free text', () => {
    const result = generateMusicPrompt(brief({style: '```\n# Injected heading'}));
    // Backticks are converted to apostrophes and the newline is collapsed, so
    // no active fence is introduced and the block stays a single fenced region.
    expect(result.markdown).not.toContain('```\n# Injected heading');
    const fenceCount = (result.markdown.match(/```/g) ?? []).length;
    expect(fenceCount).toBe(2);
    // The style line stays on one line inside the fence.
    expect(result.markdown).toContain("Style: ''' # Injected heading");
  });
});
