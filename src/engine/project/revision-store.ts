import {existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

import {z} from 'zod';

import {RevisionRecordSchema, type RevisionRecord} from '../../contracts/revision.js';
import type {BriefSpec} from '../../contracts/brief.js';
import type {TreatmentSpec} from '../../contracts/treatment.js';
import type {MotionSpec} from '../../contracts/motion-spec.js';
import {Sha256Schema, type Producer} from '../../contracts/common.js';
import {writeArtifact} from './artifact-store.js';
import {writeCanonicalFileSync} from './atomic-write.js';
import {sha256Canonical} from '../hash.js';
import type {ProjectPaths} from './paths.js';

export type SourceSet = {brief: BriefSpec; treatment: TreatmentSpec; motion: MotionSpec};

export type RevisionWrite = {
  paths: ProjectPaths;
  revisionId: string;
  producer: Producer;
  record: RevisionRecord;
  source: SourceSet;
};

const TOOL_PRODUCER: Producer = {kind: 'tool', id: 'revision-engine', version: '1.0.0'};

const RevisionManifestPayloadSchema = z.strictObject({
  revisionId: z.string().regex(/^rev-[a-z0-9-]+$/),
  sourceHashes: z.strictObject({brief: Sha256Schema, treatment: Sha256Schema, motion: Sha256Schema}),
});

export function sourceHashes(source: SourceSet): {brief: string; treatment: string; motion: string} {
  return {
    brief: sha256Canonical(source.brief),
    treatment: sha256Canonical(source.treatment),
    motion: sha256Canonical(source.motion),
  };
}

/**
 * Persist an immutable revision: revision.record.json, immutable copies of
 * brief/treatment/motion, source-hashes.json and revision.manifest.json. This
 * function is persistence only; it performs no patch validation.
 */
export async function writeRevisionRecord(input: RevisionWrite): Promise<RevisionRecord> {
  const record = RevisionRecordSchema.parse(input.record);
  const dir = join(input.paths.revisions, input.revisionId);
  if (existsSync(dir)) {
    throw new Error('REVISION_EXISTS');
  }
  mkdirSync(dir, {recursive: true});

  const hashes = sourceHashes(input.source);

  writeCanonicalFileSync(join(dir, 'brief.spec.json'), input.source.brief);
  writeCanonicalFileSync(join(dir, 'treatment.json'), input.source.treatment);
  writeCanonicalFileSync(join(dir, 'motion.spec.json'), input.source.motion);
  writeCanonicalFileSync(join(dir, 'source-hashes.json'), hashes);

  await writeArtifact({
    targetPath: join(dir, 'revision.record.json'),
    schemaVersion: 'revision-record@1',
    projectId: input.source.brief.projectId,
    revisionId: input.revisionId,
    producer: input.producer,
    parentHashes: [],
    payloadSchema: RevisionRecordSchema,
    payload: record,
  });

  await writeArtifact({
    targetPath: join(dir, 'revision.manifest.json'),
    schemaVersion: 'revision-manifest@1',
    projectId: input.source.brief.projectId,
    revisionId: input.revisionId,
    producer: TOOL_PRODUCER,
    parentHashes: [hashes.brief, hashes.treatment, hashes.motion],
    payloadSchema: RevisionManifestPayloadSchema,
    payload: {revisionId: input.revisionId, sourceHashes: hashes},
  });

  return record;
}
