import {z} from 'zod';

import {ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';

/**
 * Single owner of MotionMusicCue, AudioBriefArtifact, AlignAndMuxInput and
 * AudioAlignmentManifest. Task 15 imports these and must not redeclare them.
 */

export const MotionMusicCueSchema = z.strictObject({
  id: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  role: z.enum(['intro', 'build', 'riser', 'payoff', 'sustain', 'outro']),
  text: z.string().min(1),
});
export type MotionMusicCue = z.infer<typeof MotionMusicCueSchema>;

export const AudioBriefArtifactSchema = z
  .strictObject({
    schemaVersion: z.literal('audio-brief@1'),
    projectId: ProjectIdSchema,
    revisionId: RevisionIdSchema,
    renderPlanHash: Sha256Schema,
    fps: z.number().int().positive(),
    durationFrames: z.number().int().positive(),
    style: z.string().min(1),
    instrumentation: z.array(z.string().min(1)),
    tempoBpm: z.number().positive().optional(),
    key: z.string().min(1).optional(),
    hook: z.string().min(1),
    cues: z.array(MotionMusicCueSchema).min(1),
    dynamics: z.string().min(1).optional(),
    stinger: z.string().min(1).optional(),
    exclude: z.array(z.string().min(1)).optional(),
    sfxNotes: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, ctx) => {
    // Exactly one payoff cue.
    const payoffs = value.cues.filter((c) => c.role === 'payoff');
    if (payoffs.length !== 1) {
      ctx.addIssue({code: 'custom', message: 'AUDIO_PAYOFF_INVALID', path: ['cues']});
    }
    // Cues start at frame 0 and are strictly increasing.
    if (value.cues.length > 0 && value.cues[0]!.startFrame !== 0) {
      ctx.addIssue({code: 'custom', message: 'AUDIO_CUE_RANGE_INVALID', path: ['cues', 0]});
    }
    for (let i = 1; i < value.cues.length; i++) {
      if (value.cues[i]!.startFrame <= value.cues[i - 1]!.startFrame) {
        ctx.addIssue({code: 'custom', message: 'AUDIO_CUE_RANGE_INVALID', path: ['cues', i]});
      }
    }
  });
export type AudioBriefArtifact = z.infer<typeof AudioBriefArtifactSchema>;

export const AudioAlignmentManifestSchema = z.strictObject({
  schemaVersion: z.literal('audio-alignment@1'),
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  renderPlanHash: Sha256Schema,
  audioBriefHash: Sha256Schema,
  mixOptionsHash: Sha256Schema,
  mixAttemptHash: Sha256Schema,
  audioToolImplementationHash: Sha256Schema,
  ffmpegVersion: z.string().min(1),
  approvalArtifactHash: Sha256Schema,
  renderManifestArtifactHash: Sha256Schema,
  sourceLabel: z.string().min(1),
  sourceMusicSha256: Sha256Schema,
  silentVideoSha256: Sha256Schema,
  cutPayoffFrame: z.number().int().nonnegative(),
  cutPayoffSeconds: z.number().nonnegative(),
  trackPayoffSeconds: z.number().nonnegative(),
  appliedOffsetSeconds: z.number(),
  trimStartSeconds: z.number().nonnegative(),
  delayMilliseconds: z.number().nonnegative(),
  musicGainDb: z.number(),
  videoDurationSeconds: z.number().positive(),
  mixedAudioDurationSeconds: z.number().positive(),
  measuredMaxVolumeDb: z.number(),
  videoStreamMd5Before: z.string().min(1),
  videoStreamMd5After: z.string().min(1),
  videoCopied: z.literal(true),
  outputSha256: Sha256Schema,
});
export type AudioAlignmentManifest = z.infer<typeof AudioAlignmentManifestSchema>;

/** Non-persisted input to the align-and-mux tool (contains local paths). */
export type AlignAndMuxInput = {
  brief: AudioBriefArtifact;
  renderPlanHash: string;
  approvalArtifactHash: string;
  renderManifestArtifactHash: string;
  silentVideoPath: string;
  musicPath: string;
  sourceLabel: string;
  trackPayoffSeconds: number;
  musicGainDb: number;
  outputPath: string;
  manifestPath: string;
};
