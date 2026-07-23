import {z} from 'zod';

import {ProducerSchema, ProjectIdSchema, RevisionIdSchema, Sha256Schema} from './common.js';

/**
 * Strict artifact envelope wrapping a validated payload with provenance,
 * parent hashes and a canonical content hash. The `contentHash` is computed
 * over `{schemaVersion, projectId, revisionId, producer, parentHashes, payload}`
 * with `contentHash` omitted, so the hash is never self-referential.
 */
export const ArtifactEnvelopeSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.strictObject({
    schemaVersion: z.string().min(1),
    projectId: ProjectIdSchema,
    revisionId: RevisionIdSchema,
    producer: ProducerSchema,
    parentHashes: z.array(Sha256Schema),
    contentHash: Sha256Schema,
    payload,
  });

export type ArtifactEnvelope<T> = {
  schemaVersion: string;
  projectId: string;
  revisionId: string;
  producer: z.infer<typeof ProducerSchema>;
  parentHashes: string[];
  contentHash: string;
  payload: T;
};

/** The projection an artifact's contentHash is computed over (contentHash omitted). */
export type ArtifactHashInput<T> = Omit<ArtifactEnvelope<T>, 'contentHash'>;

export function artifactHashProjection<T>(envelope: ArtifactEnvelope<T>): ArtifactHashInput<T> {
  return {
    schemaVersion: envelope.schemaVersion,
    projectId: envelope.projectId,
    revisionId: envelope.revisionId,
    producer: envelope.producer,
    parentHashes: envelope.parentHashes,
    payload: envelope.payload,
  };
}
