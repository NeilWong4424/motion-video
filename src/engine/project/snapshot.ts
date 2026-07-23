import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {ProjectFileSchema} from '../../contracts/manifest.js';
import type {Producer} from '../../contracts/common.js';
import {loadSourceArtifacts} from './load-project.js';
import {writeRevisionRecord, sourceHashes} from './revision-store.js';
import {writeCanonicalFileSync} from './atomic-write.js';
import type {ProjectPaths} from './paths.js';

const INITIAL_REVISION = 'rev-0001';
const HOST_PRODUCER: Producer = {kind: 'host', id: 'claude-code', version: '1.0.0'};

/**
 * Initialization-only snapshot. Requires a null current revision pointer,
 * validates all source, assigns rev-0001, writes the immutable snapshot and
 * only then updates the pointer. Fails INITIAL_SNAPSHOT_ALREADY_EXISTS if a
 * revision already exists.
 */
export async function snapshotProject(paths: ProjectPaths): Promise<string> {
  const projectFile = ProjectFileSchema.parse(
    JSON.parse(readFileSync(join(paths.source, 'project.json'), 'utf8')),
  );
  if (projectFile.currentRevisionId !== null) {
    throw new Error('INITIAL_SNAPSHOT_ALREADY_EXISTS');
  }
  if (existsSync(join(paths.revisions, INITIAL_REVISION))) {
    throw new Error('INITIAL_SNAPSHOT_ALREADY_EXISTS');
  }

  const source = await loadSourceArtifacts(paths);
  const hashes = sourceHashes({brief: source.brief, treatment: source.treatment, motion: source.motion});

  await writeRevisionRecord({
    paths,
    revisionId: INITIAL_REVISION,
    producer: HOST_PRODUCER,
    record: {
      schemaVersion: 'revision-record@1',
      kind: 'initial-snapshot',
      revisionId: INITIAL_REVISION,
      beforeSourceHashes: null,
      afterSourceHashes: hashes,
    },
    source: {brief: source.brief, treatment: source.treatment, motion: source.motion},
  });

  // Update the pointer only after all immutable files succeed.
  writeCanonicalFileSync(join(paths.source, 'project.json'), {
    ...projectFile,
    currentRevisionId: INITIAL_REVISION,
    status: 'snapshotted',
  });

  return INITIAL_REVISION;
}
