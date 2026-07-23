import {z} from 'zod';

import {ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';
import {PreviewApprovalPolicySchema} from './approval.js';

/** The editable project pointer file. */
export const ProjectFileSchema = z.strictObject({
  schemaVersion: z.literal('project@1'),
  projectId: ProjectIdSchema,
  currentRevisionId: z.union([RevisionIdSchema, z.null()]),
  previewApproval: PreviewApprovalPolicySchema,
  status: z.enum(['draft', 'snapshotted', 'approved', 'delivered', 'stopped']),
});
export type ProjectFile = z.infer<typeof ProjectFileSchema>;

export const RenderManifestArtifactSchema = z.strictObject({
  schemaVersion: z.literal('render-manifest@1'),
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  sourceHashes: z.strictObject({brief: Sha256Schema, treatment: Sha256Schema, motion: Sha256Schema}),
  resolvedMotionHash: Sha256Schema,
  renderPlanHash: Sha256Schema,
  nodeVersion: z.string().min(1),
  pnpmVersion: z.string().min(1),
  remotionVersion: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  frameCount: z.number().int().positive(),
  codec: z.literal('h264'),
  crf: z.number().int().min(0).max(51),
  seed: z.string().min(1),
  outputSha256: Sha256Schema,
});
export type RenderManifestArtifact = z.infer<typeof RenderManifestArtifactSchema>;

export const DeliveryManifestSchema = z
  .strictObject({
    schemaVersion: z.literal('delivery-manifest@1'),
    projectId: ProjectIdSchema,
    revisionId: RevisionIdSchema,
    renderPlanHash: Sha256Schema,
    audioStatus: z.enum(['not-provided', 'mixed']),
    audioBriefHash: Sha256Schema,
    promptAttemptHash: Sha256Schema,
    mixAttemptHash: Sha256Schema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.audioStatus === 'mixed' && value.mixAttemptHash === undefined) {
      ctx.addIssue({code: 'custom', message: 'DELIVERY_MIX_HASH_REQUIRED', path: ['mixAttemptHash']});
    }
    if (value.audioStatus === 'not-provided' && value.mixAttemptHash !== undefined) {
      ctx.addIssue({code: 'custom', message: 'DELIVERY_MIX_HASH_FORBIDDEN', path: ['mixAttemptHash']});
    }
  });
export type DeliveryManifest = z.infer<typeof DeliveryManifestSchema>;
