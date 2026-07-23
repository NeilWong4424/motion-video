import {z} from 'zod';

/** Lowercase kebab-case project identifier. */
export const ProjectIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'PROJECT_ID_INVALID');

/** Lowercase 64-char hex SHA-256. */
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'SHA256_INVALID');

/** Revision identifier such as `rev-0001`. */
export const RevisionIdSchema = z.string().regex(/^rev-[a-z0-9-]+$/, 'REVISION_ID_INVALID');

/** Strict producer provenance object. */
export const ProducerSchema = z
  .strictObject({
    kind: z.enum(['host', 'tool']),
    id: z.enum([
      'codex',
      'claude-code',
      'human',
      'resolver',
      'compiler',
      'renderer',
      'qc',
      'revision-engine',
      'audio-tool',
      'delivery-tool',
    ]),
    version: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const isHostId = new Set(['codex', 'claude-code', 'human']).has(value.id);
    if ((value.kind === 'host') !== isHostId) {
      ctx.addIssue({code: 'custom', message: 'PRODUCER_KIND_MISMATCH'});
    }
  });

export type Producer = z.infer<typeof ProducerSchema>;

/** Canvas of one supported master format and fps. */
export const CanvasSchema = z
  .strictObject({
    width: z.union([z.literal(1920), z.literal(1080)]),
    height: z.union([z.literal(1080), z.literal(1920)]),
    fps: z.union([
      z.literal(24),
      z.literal(25),
      z.literal(30),
      z.literal(50),
      z.literal(60),
    ]),
  })
  .refine(
    (v) => new Set(['1920x1080', '1080x1920', '1080x1080']).has(`${v.width}x${v.height}`),
    'CANVAS_FORMAT_UNSUPPORTED',
  );

export type Canvas = z.infer<typeof CanvasSchema>;

/** A reference to a point within a named timeline segment; progress is 0..1. */
export const SegmentRefSchema = z.strictObject({
  segmentId: z.string().min(1),
  progress: z.number().min(0).max(1),
});
export type SegmentRef = z.infer<typeof SegmentRefSchema>;

export const SegmentRangeSchema = z.strictObject({
  from: SegmentRefSchema,
  to: SegmentRefSchema,
});
export type SegmentRange = z.infer<typeof SegmentRangeSchema>;

/** Canvas-normalized point; each component is 0..1. */
export const NormalizedPointSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type NormalizedPoint = z.infer<typeof NormalizedPointSchema>;

/** A single source keyframe on a track. */
export const KeyframeSchema = <T extends z.ZodType>(value: T) =>
  z.strictObject({
    at: SegmentRefSchema,
    value,
    interpolation: z.enum(['hold', 'linear', 'ease']),
    easing: z.string().min(1).optional(),
  });

export const NodeKindSchema = z.enum([
  'text',
  'shape',
  'path',
  'image',
  'ui',
  'chart',
  'logo',
  'group',
]);
export type NodeKind = z.infer<typeof NodeKindSchema>;
