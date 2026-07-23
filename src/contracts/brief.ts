import {z} from 'zod';

import {CanvasSchema, ProjectIdSchema} from './common.js';

/** A verified fact with its local source label. */
export const BriefFactSchema = z.strictObject({
  id: z.string().min(1),
  statement: z.string().min(1),
  sourceLabel: z.string().min(1),
});

/**
 * BriefSpec: goal, audience, facts, message, CTA, format, supplied assets,
 * constraints and assumptions. It contains no style, coordinates, model
 * metadata or external-processing policy.
 */
export const BriefSpecSchema = z.strictObject({
  schemaVersion: z.literal('brief@1'),
  projectId: ProjectIdSchema,
  title: z.string().min(1),
  language: z.enum(['zh-CN', 'zh-TW', 'en', 'mixed']),
  goal: z.string().min(1),
  audience: z.string().min(1),
  message: z.string().min(1),
  cta: z.string().min(1).optional(),
  canvas: CanvasSchema,
  durationSeconds: z.number().int().min(5).max(60),
  facts: z.array(BriefFactSchema),
  suppliedAssetIds: z.array(z.string().min(1)),
  constraints: z.array(z.string().min(1)),
  prohibitedContent: z.array(z.string().min(1)),
  assumptions: z.array(z.string().min(1)),
});

export type BriefSpec = z.infer<typeof BriefSpecSchema>;
