import {z} from 'zod';

import {ProjectIdSchema, Sha256Schema} from './common.js';

/** Ordered narrative intention for one Beat. */
export const BeatIntentionSchema = z.strictObject({
  id: z.string().min(1),
  objective: z.string().min(1),
  message: z.string().min(1),
  // Director's-brain fields (optional, back-compatible). See
  // agent/contracts/premium-quality-contract.md. `audienceTakeaway` is the felt
  // outcome the beat delivers; focal/continuity intent name the hero and the
  // live carry across the boundary.
  focalIntent: z.string().min(1).optional(),
  liveContinuityIntent: z.string().min(1).optional(),
  audienceTakeaway: z.string().min(1).optional(),
});

/** Camera rationale bound to one adjacent Beat-intention pair. */
export const AdjacentIntentionPairSchema = z.strictObject({
  fromBeatIntentionId: z.string().min(1),
  toBeatIntentionId: z.string().min(1),
  cameraRationale: z.string().min(1),
});

/**
 * TreatmentSpec: narrative strategy, visual thesis, motion profile, style pack,
 * beat intentions and transition vocabulary. `continuityPolicy` is fixed to
 * `seamless-default`; `compositionMode` describes framing/register and cannot
 * weaken the continuity policy. The schema-level V1 chapter-cut ceiling is one.
 * The treatment contains no pixels, React or CSS.
 */
export const TreatmentSpecSchema = z.strictObject({
  schemaVersion: z.literal('treatment@1'),
  projectId: ProjectIdSchema,
  briefHash: Sha256Schema,
  message: z.string().min(1),
  narrativeArc: z.string().min(1),
  continuityPolicy: z.literal('seamless-default'),
  compositionMode: z.enum(['persistent-stage', 'continuous-world', 'held-shot']),
  motionProfile: z.enum(['calm', 'editorial', 'energetic', 'playful']),
  stylePackId: z.string().min(1),
  visualThesis: z.string().min(1),
  copyStrategy: z.string().min(1),
  transitionVocabulary: z.array(z.string().min(1)).min(1).max(3),
  signatureTransition: z.string().min(1).optional(),
  chapterCutBudget: z.union([z.literal(0), z.literal(1)]),
  beatIntentions: z.array(BeatIntentionSchema).min(1),
  adjacentIntentionPairs: z.array(AdjacentIntentionPairSchema),
  // Director's-brain fields (optional, back-compatible): the felt journey across
  // the film and the premium reference bar it is authored to / graded against.
  emotionalArc: z.string().min(1).optional(),
  premiumTarget: z.string().min(1).optional(),
});

export type TreatmentSpec = z.infer<typeof TreatmentSpecSchema>;
