import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {createTestRepoContext} from '../helpers/create-test-repo-context.js';
import {createProject} from '../../src/engine/project/create-project.js';
import {resolveProjectPaths} from '../../src/engine/project/paths.js';
import {writeRevisionRecord} from '../../src/engine/project/revision-store.js';
import {loadSourceArtifacts} from '../../src/engine/project/load-project.js';

describe('project paths', () => {
  it('resolves a project root under projects/', () => {
    const context = createTestRepoContext();
    expect(resolveProjectPaths(context, 'launch-film').root).toBe(
      join(context.repoRoot, 'projects', 'launch-film'),
    );
  });

  it('rejects a traversal project id', () => {
    const context = createTestRepoContext();
    expect(() => resolveProjectPaths(context, '../escape')).toThrow(/PROJECT_ID_INVALID/);
  });
});

describe('project creation and revision immutability', () => {
  it('creates a project and refuses to recreate it', async () => {
    const context = createTestRepoContext();
    await createProject(context, 'launch-film');
    await expect(createProject(context, 'launch-film')).rejects.toThrow(/PROJECT_EXISTS/);
  });

  it('writes an immutable revision and refuses to overwrite it', async () => {
    const context = createTestRepoContext();
    const paths = await createProject(context, 'launch-film');
    const source = await loadSourceArtifacts(paths);

    const first = {
      paths,
      revisionId: 'rev-0001',
      producer: {kind: 'host', id: 'claude-code', version: '1.0.0'} as const,
      record: {
        schemaVersion: 'revision-record@1' as const,
        kind: 'initial-snapshot' as const,
        revisionId: 'rev-0001',
        beforeSourceHashes: null,
        afterSourceHashes: {
          brief: 'a'.repeat(64),
          treatment: 'b'.repeat(64),
          motion: 'c'.repeat(64),
        },
      },
      source: {brief: source.brief, treatment: source.treatment, motion: source.motion},
    };

    await writeRevisionRecord(first);
    const revisionRecordPath = join(paths.revisions, 'rev-0001', 'revision.record.json');
    const bytes = readFileSync(revisionRecordPath, 'utf8');

    await expect(writeRevisionRecord(first)).rejects.toThrow(/REVISION_EXISTS/);
    expect(readFileSync(revisionRecordPath, 'utf8')).toBe(bytes);
  });
});
