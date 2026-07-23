import {z} from 'zod';

import {ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';

const ReviewIssueSchema = z.strictObject({
  id: z.string().min(1),
  code: z.string().min(1),
  severity: z.enum(['blocking', 'major', 'minor']),
  summary: z.string().min(1),
  evidencePath: z.string().min(1).optional(),
});

const ReviewBaseShape = {
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  renderPlanHash: Sha256Schema,
  reviewedPreviewHash: Sha256Schema,
  decision: z.enum(['ship', 'fix', 'rebuild']),
  complete: z.boolean(),
  issues: z.array(ReviewIssueSchema),
};

export const CreativeReviewSchema = z.strictObject({
  schemaVersion: z.literal('creative-review@1'),
  reviewerRole: z.literal('creative'),
  ...ReviewBaseShape,
});
export type CreativeReview = z.infer<typeof CreativeReviewSchema>;

export const MotionReviewSchema = z.strictObject({
  schemaVersion: z.literal('motion-review@1'),
  reviewerRole: z.literal('motion'),
  ...ReviewBaseShape,
  playbackObservations: z.strictObject({
    eyeKnowsWhereToLook: z.boolean(),
    messageUnderstood: z.boolean(),
    motionMotivated: z.boolean(),
    causallyConnected: z.boolean(),
    feelsLikeFilmNotSlides: z.boolean(),
  }),
});
export type MotionReview = z.infer<typeof MotionReviewSchema>;

export const TechnicalQCReportSchema = z.strictObject({
  schemaVersion: z.literal('technical-qc@1'),
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  renderPlanHash: Sha256Schema,
  reviewedPreviewHash: Sha256Schema,
  decision: z.enum(['pass', 'fail']),
  diagnostics: z.array(
    z.strictObject({
      code: z.string().min(1),
      severity: z.enum(['error', 'warning', 'info']),
      evidence: z.string().optional(),
    }),
  ),
});
export type TechnicalQCReport = z.infer<typeof TechnicalQCReportSchema>;
