import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import type {SemanticPatch} from '../../contracts/revision.js';
import {SemanticPatchSchema} from '../../contracts/revision.js';
import type {Producer} from '../../contracts/common.js';
import {loadSourceArtifacts} from '../project/load-project.js';
import {writeRevisionRecord, sourceHashes} from '../project/revision-store.js';
import {writeArtifact} from '../project/artifact-store.js';
import {writeCanonicalFileSync} from '../project/atomic-write.js';
import {sha256Canonical} from '../hash.js';
import {ProjectFileSchema} from '../../contracts/manifest.js';
import {applySemanticPatch} from './apply-semantic-patch.js';
import type {SemanticLockTarget} from '../../contracts/revision.js';
import type {ProjectPaths} from '../project/paths.js';
import type {Diagnostic} from '../../contracts/diagnostic.js';

const PRODUCER: Producer = {kind: 'tool', id: 'revision-engine', version: '1.0.0'};

export type CommitRevisionResult =
  | {ok: true; revisionId: string}
  | {ok: false; diagnostics: Diagnostic[]};

function nextRevisionId(paths: ProjectPaths): string {
  const existing = existsSync(paths.revisions)
    ? readdirSync(paths.revisions, {withFileTypes: true})
        .filter((d) => d.isDirectory() && /^rev-\d+$/.test(d.name))
        .map((d) => Number.parseInt(d.name.slice(4), 10))
    : [];
  const n = (existing.length === 0 ? 0 : Math.max(...existing)) + 1;
  return `rev-${String(n).padStart(4, '0')}`;
}

/** Read the active locks recorded on the current revision (locks.json), if any. */
function activeLocks(paths: ProjectPaths, currentRevisionId: string): SemanticLockTarget[] {
  const path = join(paths.revisions, currentRevisionId, 'locks.json');
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8')) as SemanticLockTarget[];
}

/**
 * Apply a validated SemanticPatch and atomically commit a new revision. Until
 * commit succeeds, current source/pointer are unchanged. Recomputes locks from
 * the applied operations (set-lock/remove-lock) for the new revision.
 */
export async function commitRevision(paths: ProjectPaths, patch: SemanticPatch): Promise<CommitRevisionResult> {
  const parsed = SemanticPatchSchema.parse(patch);
  const project = ProjectFileSchema.parse(JSON.parse(readFileSync(join(paths.source, 'project.json'), 'utf8')));
  if (!project.currentRevisionId) {
    return {ok: false, diagnostics: [{code: 'SOURCE_NOT_SNAPSHOTTED', severity: 'error'}]};
  }

  const before = await loadSourceArtifacts(paths);
  const source = {brief: before.brief, treatment: before.treatment, motion: before.motion};
  const beforeHashes = sourceHashes(source);

  const result = applySemanticPatch({
    source,
    patch: parsed,
    activeLocks: activeLocks(paths, project.currentRevisionId),
  });
  if (!result.ok) {
    return {ok: false, diagnostics: result.diagnostics};
  }

  const revisionId = nextRevisionId(paths);
  const afterHashes = sourceHashes(result.next);

  // Write the new immutable revision snapshot.
  await writeRevisionRecord({
    paths,
    revisionId,
    producer: PRODUCER,
    record: {
      schemaVersion: 'revision-record@1',
      kind: 'semantic-patch',
      revisionId,
      baseRevisionId: project.currentRevisionId,
      patchHash: sha256Canonical(parsed),
      beforeSourceHashes: beforeHashes,
      afterSourceHashes: afterHashes,
    },
    source: result.next,
  });

  // Persist the validated patch and updated locks alongside the revision.
  await writeArtifact({
    targetPath: join(paths.revisions, revisionId, 'revision.patch.json'),
    schemaVersion: 'semantic-patch@1',
    projectId: project.projectId,
    revisionId,
    producer: PRODUCER,
    parentHashes: [beforeHashes.brief, beforeHashes.treatment, beforeHashes.motion],
    payloadSchema: SemanticPatchSchema,
    payload: parsed,
  });

  const updatedLocks = computeLocks(activeLocks(paths, project.currentRevisionId), parsed);
  writeCanonicalFileSync(join(paths.revisions, revisionId, 'locks.json'), updatedLocks);

  // Update the editable source files and the pointer only after all immutable
  // writes succeed.
  writeCanonicalFileSync(join(paths.source, 'brief.spec.json'), result.next.brief);
  writeCanonicalFileSync(join(paths.source, 'treatment.json'), result.next.treatment);
  writeCanonicalFileSync(join(paths.source, 'motion.spec.json'), result.next.motion);
  writeCanonicalFileSync(join(paths.source, 'project.json'), {...project, currentRevisionId: revisionId});

  return {ok: true, revisionId};
}

function computeLocks(current: readonly SemanticLockTarget[], patch: SemanticPatch): SemanticLockTarget[] {
  const key = (t: SemanticLockTarget) => `${t.entity}:${t.id}${t.field ? `:${t.field}` : ''}`;
  const map = new Map(current.map((l) => [key(l), l]));
  for (const op of patch.operations) {
    if (op.op === 'set-lock') map.set(key(op.target), op.target);
    if (op.op === 'remove-lock') map.delete(key(op.target));
  }
  return [...map.values()];
}
