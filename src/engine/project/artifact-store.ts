import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, join} from 'node:path';

import type {z} from 'zod';

import {ArtifactEnvelopeSchema, artifactHashProjection, type ArtifactEnvelope} from '../../contracts/artifact.js';
import {canonicalJson} from '../canonical-json.js';
import {sha256Canonical} from '../hash.js';
import type {Producer} from '../../contracts/common.js';

export type ArtifactWrite<T> = {
  targetPath: string;
  schemaVersion: string;
  projectId: string;
  revisionId: string;
  producer: Producer;
  parentHashes: string[];
  payloadSchema: z.ZodTypeAny;
  payload: T;
};

function fsyncDir(dir: string): void {
  // Best-effort parent-directory durability. On some platforms opening a
  // directory for fsync is not permitted; ignore that specific failure.
  let fd: number | undefined;
  try {
    fd = openSync(dir, 'r');
    fsyncSync(fd);
  } catch {
    // Directory fsync unsupported on this platform; the file rename remains atomic.
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/**
 * Validate a payload, compute canonical bytes/hash, and atomically write the
 * artifact envelope. Idempotent when identical bytes already exist at the
 * target; different bytes at the same target fail ARTIFACT_COLLISION.
 */
export async function writeArtifact<T>(input: ArtifactWrite<T>): Promise<ArtifactEnvelope<T>> {
  const payload = input.payloadSchema.parse(input.payload) as T;

  const projection = artifactHashProjection<T>({
    schemaVersion: input.schemaVersion,
    projectId: input.projectId,
    revisionId: input.revisionId,
    producer: input.producer,
    parentHashes: input.parentHashes,
    contentHash: '',
    payload,
  });
  const contentHash = sha256Canonical(projection);

  const envelope: ArtifactEnvelope<T> = {
    schemaVersion: input.schemaVersion,
    projectId: input.projectId,
    revisionId: input.revisionId,
    producer: input.producer,
    parentHashes: input.parentHashes,
    contentHash,
    payload,
  };

  // Validate the full envelope shape.
  ArtifactEnvelopeSchema(input.payloadSchema).parse(envelope);

  const bytes = `${canonicalJson(envelope)}\n`;

  if (existsSync(input.targetPath)) {
    const existing = readFileSync(input.targetPath, 'utf8');
    if (existing === bytes) return envelope;
    throw new Error(`ARTIFACT_COLLISION: ${input.targetPath}`);
  }

  const dir = dirname(input.targetPath);
  mkdirSync(dir, {recursive: true});
  // A scratch filename only; never part of any hashed/rendered output.
  const tmp = join(dir, `.${randomUUID()}.tmp`);
  const fd = openSync(tmp, 'w');
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, input.targetPath);
  fsyncDir(dir);

  return envelope;
}
