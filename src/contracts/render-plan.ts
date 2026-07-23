import {z} from 'zod';

import {CanvasSchema, ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';
import {HandoffCheckSchema, ResolvedNodeSchema} from './resolved-motion.js';

export const EngineBuildIdentitySchema = z.strictObject({
  runtimeImplementationHash: Sha256Schema,
  renderToolingImplementationHash: Sha256Schema,
  lockfileHash: Sha256Schema,
  nodeVersion: z.string().min(1),
  reactVersion: z.string().min(1),
  remotionVersion: z.string().min(1),
});
export type EngineBuildIdentity = z.infer<typeof EngineBuildIdentitySchema>;

const OutputProfileSchema = z.strictObject({
  kind: z.enum(['preview', 'final']),
  longEdge: z.number().int().positive().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  codec: z.literal('h264'),
  crf: z.number().int().min(0).max(51),
  silent: z.literal(true),
});

const RenderAssetSchema = z.strictObject({
  assetId: z.string().min(1),
  sha256: Sha256Schema,
  staticFilePath: z.string().min(1),
  mime: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const RenderPlanSchema = z.strictObject({
  schemaVersion: z.literal('render-plan@1'),
  projectId: ProjectIdSchema,
  revisionId: RevisionIdSchema,
  resolvedMotionHash: Sha256Schema,
  canvas: CanvasSchema,
  durationInFrames: z.number().int().positive(),
  seed: z.string().min(1),
  build: EngineBuildIdentitySchema,
  profiles: z.strictObject({preview: OutputProfileSchema, final: OutputProfileSchema}),
  nodes: z.array(
    ResolvedNodeSchema.extend({
      key: z.string().min(1),
      layer: z.enum(['world', 'screen']),
    }),
  ),
  camera: z.strictObject({
    id: z.literal('main-camera'),
    samples: z.array(
      z.strictObject({frame: z.number().int().nonnegative(), x: z.number(), y: z.number(), zoom: z.number()}),
    ),
  }),
  assets: z.array(RenderAssetSchema),
  handoffChecks: z.array(HandoffCheckSchema),
});
export type RenderPlan = z.infer<typeof RenderPlanSchema>;
