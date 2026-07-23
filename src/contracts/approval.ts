import {z} from 'zod';

import {ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';

/**
 * PreviewApproval binds an explicit human/host approval to the exact current
 * revision, RenderPlan and reviewed preview, plus the two completed review
 * hashes. Approval is invalid if any bound artifact changes.
 */
export const PreviewApprovalSchema = z.strictObject({
  schemaVersion: z.literal('preview-approval@1'),
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  renderPlanHash: Sha256Schema,
  reviewedPreviewHash: Sha256Schema,
  technicalQcHash: Sha256Schema,
  creativeReviewHash: Sha256Schema,
  motionReviewHash: Sha256Schema,
  decision: z.literal('approved'),
  actor: z.enum(['human', 'codex', 'claude-code']),
  reason: z.string().min(1),
});
export type PreviewApproval = z.infer<typeof PreviewApprovalSchema>;

/** Project-level preview-approval policy. */
export const PreviewApprovalPolicySchema = z.discriminatedUnion('mode', [
  z.strictObject({mode: z.literal('human')}),
  z.strictObject({mode: z.literal('host-allowed'), allowedHosts: z.array(z.enum(['codex', 'claude-code'])).min(1)}),
]);
export type PreviewApprovalPolicy = z.infer<typeof PreviewApprovalPolicySchema>;
