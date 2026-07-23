import {z} from 'zod';

import {RevisionIdSchema, SegmentRangeSchema, Sha256Schema} from './common.js';
import {BriefSpecSchema} from './brief.js';
import {TreatmentSpecSchema} from './treatment.js';
import {MotionSpecSchema} from './motion-spec.js';

/** Semantic lock/impact target addressed by stable ID, never array index. */
export const SemanticLockTargetSchema = z.discriminatedUnion('entity', [
  z.strictObject({entity: z.literal('brief'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('treatment'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('beat'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('bridge'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('node'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('camera'), id: z.literal('main-camera'), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('motion-cue'), id: z.string().min(1), field: z.string().min(1).optional()}),
  z.strictObject({entity: z.literal('token'), id: z.string().min(1), field: z.string().min(1).optional()}),
]);
export type SemanticLockTarget = z.infer<typeof SemanticLockTargetSchema>;

const EffectEntrySchema = z.strictObject({
  id: z.string().min(1),
  version: z.string().min(1),
  range: SegmentRangeSchema,
  props: z.unknown(),
});

export const PatchOperationSchema = z.discriminatedUnion('op', [
  z.strictObject({op: z.literal('replace-copy'), nodeId: z.string().min(1), value: z.string()}),
  z.strictObject({op: z.literal('set-token'), token: z.string().min(1), value: z.union([z.string(), z.number()])}),
  z.strictObject({op: z.literal('retime-beat'), beatId: z.string().min(1), durationFrames: z.number().int().positive()}),
  z.strictObject({op: z.literal('retime-bridge'), bridgeId: z.string().min(1), durationFrames: z.number().int().nonnegative()}),
  z.strictObject({
    op: z.literal('set-node-state'),
    nodeId: z.string().min(1),
    track: z.enum(['geometry', 'style', 'content', 'visibility']),
    keyframes: z.array(z.unknown()),
  }),
  z.strictObject({op: z.literal('swap-renderer'), nodeId: z.string().min(1), rendererId: z.string().min(1), version: z.string().min(1), props: z.unknown()}),
  z.strictObject({op: z.literal('set-effects'), nodeId: z.string().min(1), effects: z.array(EffectEntrySchema)}),
  z.strictObject({op: z.literal('set-continuity-bridge'), bridgeId: z.string().min(1), value: z.unknown()}),
  z.strictObject({op: z.literal('replace-brief'), value: BriefSpecSchema}),
  z.strictObject({op: z.literal('replace-treatment'), value: TreatmentSpecSchema}),
  z.strictObject({op: z.literal('replace-motion-spec'), value: MotionSpecSchema}),
  z.strictObject({op: z.literal('set-lock'), target: SemanticLockTargetSchema}),
  z.strictObject({op: z.literal('remove-lock'), target: SemanticLockTargetSchema}),
]);
export type PatchOperation = z.infer<typeof PatchOperationSchema>;

const SemanticPatchBaseShape = {
  baseRevisionId: RevisionIdSchema,
  expectedSourceHashes: z.strictObject({
    brief: Sha256Schema,
    treatment: Sha256Schema,
    motion: Sha256Schema,
  }),
  operations: z.array(PatchOperationSchema),
  declaredImpactSet: z.array(SemanticLockTargetSchema),
  reason: z.string().min(1),
  sourceUserInstruction: z.string().min(1),
};

export const SemanticPatchSchema = z
  .discriminatedUnion('mode', [
    z.strictObject({...SemanticPatchBaseShape, mode: z.literal('bounded')}),
    z.strictObject({
      ...SemanticPatchBaseShape,
      mode: z.literal('rebuild'),
      triggeringReviewIssueIds: z.array(z.string().min(1)).min(1),
    }),
  ])
  .superRefine((value, ctx) => {
    const whole = new Set(['replace-brief', 'replace-treatment', 'replace-motion-spec']);
    const hasWhole = value.operations.some((o) => whole.has(o.op));
    if (hasWhole && value.mode !== 'rebuild') {
      ctx.addIssue({code: 'custom', message: 'WHOLE_REPLACEMENT_REQUIRES_REBUILD', path: ['operations']});
    }
  });
export type SemanticPatch = z.infer<typeof SemanticPatchSchema>;

/** Immutable revision record: initial snapshot or semantic patch. */
export const RevisionRecordSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    schemaVersion: z.literal('revision-record@1'),
    kind: z.literal('initial-snapshot'),
    revisionId: RevisionIdSchema,
    beforeSourceHashes: z.null(),
    afterSourceHashes: z.strictObject({brief: Sha256Schema, treatment: Sha256Schema, motion: Sha256Schema}),
  }),
  z.strictObject({
    schemaVersion: z.literal('revision-record@1'),
    kind: z.literal('semantic-patch'),
    revisionId: RevisionIdSchema,
    baseRevisionId: RevisionIdSchema,
    patchHash: Sha256Schema,
    beforeSourceHashes: z.strictObject({brief: Sha256Schema, treatment: Sha256Schema, motion: Sha256Schema}),
    afterSourceHashes: z.strictObject({brief: Sha256Schema, treatment: Sha256Schema, motion: Sha256Schema}),
  }),
]);
export type RevisionRecord = z.infer<typeof RevisionRecordSchema>;
