import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {createRenderRepoContext} from '../helpers/create-test-repo-context.js';
import {runMotionCli} from '../../src/cli/index.js';

const fixtureMotion = readFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'),
  'utf8',
);

function writeSource(projectRoot: string, id: string): void {
  const motion = JSON.parse(fixtureMotion) as {projectId: string};
  motion.projectId = id;
  writeFileSync(join(projectRoot, 'motion.spec.json'), JSON.stringify(motion));

  const brief = JSON.parse(readFileSync(join(projectRoot, 'brief.spec.json'), 'utf8')) as {
    projectId: string;
    durationSeconds: number;
  };
  brief.projectId = id;
  brief.durationSeconds = 15;
  writeFileSync(join(projectRoot, 'brief.spec.json'), JSON.stringify(brief));

  const treatment = JSON.parse(readFileSync(join(projectRoot, 'treatment.json'), 'utf8')) as {
    projectId: string;
    transitionVocabulary: string[];
  };
  treatment.projectId = id;
  treatment.transitionVocabulary = ['shared-element', 'camera-navigation'];
  writeFileSync(join(projectRoot, 'treatment.json'), JSON.stringify(treatment));
}

describe('CLI pipeline (validate/resolve/inspect)', () => {
  it('validates, snapshots, resolves and inspects a project without a render', async () => {
    const context = createRenderRepoContext();
    await runMotionCli(['new', 'pipe-demo'], context);
    const projectRoot = join(context.repoRoot, 'projects', 'pipe-demo');
    writeSource(projectRoot, 'pipe-demo');

    expect(await runMotionCli(['validate', 'pipe-demo'], context)).toBe(0);
    expect(await runMotionCli(['snapshot', 'pipe-demo'], context)).toBe(0);
    expect(await runMotionCli(['resolve', 'pipe-demo'], context)).toBe(0);

    // resolve wrote the immutable resolved + plan artifacts.
    const outRev = join(context.repoRoot, 'out', 'pipe-demo', 'rev-0001');
    expect(existsSync(outRev)).toBe(true);

    expect(await runMotionCli(['inspect', 'pipe-demo'], context)).toBe(0);
  });

  it('resolve refuses source edited after snapshot', async () => {
    const context = createRenderRepoContext();
    await runMotionCli(['new', 'stale-demo'], context);
    const projectRoot = join(context.repoRoot, 'projects', 'stale-demo');
    writeSource(projectRoot, 'stale-demo');
    await runMotionCli(['snapshot', 'stale-demo'], context);

    // Edit source after snapshot.
    const brief = JSON.parse(readFileSync(join(projectRoot, 'brief.spec.json'), 'utf8')) as {goal: string};
    brief.goal = 'edited after snapshot';
    writeFileSync(join(projectRoot, 'brief.spec.json'), JSON.stringify(brief));

    expect(await runMotionCli(['resolve', 'stale-demo'], context)).toBe(1);
  });
});
