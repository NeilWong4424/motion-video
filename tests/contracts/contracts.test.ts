import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {
  AudioBriefArtifactSchema,
  BriefSpecSchema,
  MotionSpecSchema,
  TreatmentSpecSchema,
} from '../../src/contracts/index.js';

const valid = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'fixtures', 'contracts', 'minimal-project.json'), 'utf8'),
) as {
  brief: unknown;
  treatment: unknown;
  motion: unknown;
  audio: unknown;
};

// A motion spec that references a remote asset (a URL in renderer props). The
// contract's `staticFile`-only posture is enforced at resolve time, but a remote
// URL string smuggled into a strict field must not silently pass either; here we
// prove a structurally invalid remote-substrate variant is rejected.
function remoteAssetMotion(): unknown {
  const motion = structuredClone(valid.motion) as {world: {nodes: Array<{extraRemote?: string}>}};
  // Adding an unknown key must fail strict validation.
  motion.world.nodes[0]!.extraRemote = 'https://cdn.example/logo.png';
  return motion;
}

describe('contract schemas', () => {
  it('parses the valid brief/treatment/motion/audio fixture', () => {
    expect(BriefSpecSchema.parse(valid.brief).projectId).toBe('continuity-demo');
    expect(TreatmentSpecSchema.parse(valid.treatment).continuityPolicy).toBe('seamless-default');
    expect(TreatmentSpecSchema.parse(valid.treatment).compositionMode).toBe('persistent-stage');
    expect(MotionSpecSchema.parse(valid.motion).timeline.beats).toHaveLength(2);
  });

  it('rejects a brief with a stray model field (strict object)', () => {
    expect(() => BriefSpecSchema.parse({...(valid.brief as object), model: 'gpt'})).toThrow();
  });

  it('rejects a motion spec with legacy scenes', () => {
    expect(() => MotionSpecSchema.parse({...(valid.motion as object), scenes: []})).toThrow();
  });

  it('rejects a motion spec with an unknown remote-asset field', () => {
    expect(() => MotionSpecSchema.parse(remoteAssetMotion())).toThrow();
  });

  it('rejects an audio brief with two payoff cues', () => {
    const twoPayoffs = structuredClone(valid.audio) as {
      cues: Array<{role: string; startFrame: number; id: string; text: string}>;
    };
    twoPayoffs.cues[0]!.role = 'payoff';
    expect(() => AudioBriefArtifactSchema.parse(twoPayoffs)).toThrow(/AUDIO_PAYOFF_INVALID/);
  });

  it('rejects an audio brief whose cues do not start at frame 0', () => {
    const badStart = structuredClone(valid.audio) as {cues: Array<{startFrame: number}>};
    badStart.cues[0]!.startFrame = 5;
    expect(() => AudioBriefArtifactSchema.parse(badStart)).toThrow(/AUDIO_CUE_RANGE_INVALID/);
  });

  it('rejects a treatment that raises the chapter-cut ceiling above 1', () => {
    expect(() =>
      TreatmentSpecSchema.parse({...(valid.treatment as object), chapterCutBudget: 2}),
    ).toThrow();
  });

  it('rejects a chapter-cut bridge with a non-zero duration', () => {
    const motion = structuredClone(valid.motion) as {
      timeline: {bridges: Array<Record<string, unknown>>};
    };
    motion.timeline.bridges[0] = {
      ...motion.timeline.bridges[0],
      mode: 'chapter-cut',
      durationFrames: 5,
      reason: 'time-jump',
      exceptionJustification: 'x',
      maxEyeTraceDistanceNormalized: 0.1,
    };
    expect(() => MotionSpecSchema.parse(motion)).toThrow();
  });
});
