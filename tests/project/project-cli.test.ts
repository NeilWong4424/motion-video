import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {createTestRepoContext} from '../helpers/create-test-repo-context.js';
import {runMotionCli} from '../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'fixtures', 'contracts', 'minimal-project.json'), 'utf8'),
) as {brief: object; treatment: object; motion: object};

function writeValidSource(projectRoot: string, projectId: string): void {
  const withId = (obj: object) => ({...obj, projectId});
  writeFileSync(join(projectRoot, 'brief.spec.json'), JSON.stringify(withId(fixture.brief)));
  writeFileSync(join(projectRoot, 'treatment.json'), JSON.stringify(withId(fixture.treatment)));
  writeFileSync(join(projectRoot, 'motion.spec.json'), JSON.stringify(withId(fixture.motion)));
}

describe('motion new / snapshot CLI', () => {
  it('creates a draft project with a null revision pointer', async () => {
    const context = createTestRepoContext();
    const code = await runMotionCli(['new', 'launch-film'], context);
    expect(code).toBe(0);

    const projectRoot = join(context.repoRoot, 'projects', 'launch-film');
    expect(existsSync(join(projectRoot, 'project.json'))).toBe(true);
    const project = JSON.parse(readFileSync(join(projectRoot, 'project.json'), 'utf8')) as {
      currentRevisionId: string | null;
      projectId: string;
    };
    expect(project.currentRevisionId).toBeNull();
    expect(project.projectId).toBe('launch-film');
    // No phantom revision directory.
    expect(existsSync(join(projectRoot, 'revisions', 'rev-0001'))).toBe(false);
  });

  it('refuses to recreate an existing project', async () => {
    const context = createTestRepoContext();
    await runMotionCli(['new', 'launch-film'], context);
    const code = await runMotionCli(['new', 'launch-film'], context);
    expect(code).toBe(1);
  });

  it('snapshots valid source to rev-0001 and refuses a second snapshot', async () => {
    const context = createTestRepoContext();
    await runMotionCli(['new', 'launch-film'], context);
    const projectRoot = join(context.repoRoot, 'projects', 'launch-film');
    writeValidSource(projectRoot, 'launch-film');

    const code = await runMotionCli(['snapshot', 'launch-film'], context);
    expect(code).toBe(0);

    const revisionDir = join(projectRoot, 'revisions', 'rev-0001');
    expect(existsSync(join(revisionDir, 'revision.record.json'))).toBe(true);
    expect(existsSync(join(revisionDir, 'brief.spec.json'))).toBe(true);
    expect(existsSync(join(revisionDir, 'source-hashes.json'))).toBe(true);

    const project = JSON.parse(readFileSync(join(projectRoot, 'project.json'), 'utf8')) as {
      currentRevisionId: string | null;
    };
    expect(project.currentRevisionId).toBe('rev-0001');

    // Even after editing source, a second snapshot must fail.
    writeValidSource(projectRoot, 'launch-film');
    const second = await runMotionCli(['snapshot', 'launch-film'], context);
    expect(second).toBe(1);
  });

  it('rejects an unknown --workspace-root option', async () => {
    const context = createTestRepoContext();
    const code = await runMotionCli(['new', 'launch-film', '--workspace-root', '/tmp/evil'], context);
    expect(code).toBe(1);
  });

  it('rejects a URL-like project id', async () => {
    const context = createTestRepoContext();
    const code = await runMotionCli(['new', 'https://evil.example/x'], context);
    expect(code).toBe(1);
  });
});
