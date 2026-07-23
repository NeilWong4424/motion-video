import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {createTestRepoContext} from '../helpers/create-test-repo-context.js';
import {runMotionCli} from '../../src/cli/index.js';
import {sha256Canonical} from '../../src/engine/hash.js';

const fixture = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'fixtures', 'contracts', 'minimal-project.json'), 'utf8'),
) as {brief: object; treatment: object; motion: object};

function writeSource(root: string, id: string) {
  const withId = (o: object) => ({...o, projectId: id});
  writeFileSync(join(root, 'brief.spec.json'), JSON.stringify(withId(fixture.brief)));
  writeFileSync(join(root, 'treatment.json'), JSON.stringify(withId(fixture.treatment)));
  writeFileSync(join(root, 'motion.spec.json'), JSON.stringify(withId(fixture.motion)));
}

describe('motion revise --apply', () => {
  it('applies a bounded patch as rev-0002 and updates the pointer', async () => {
    const context = createTestRepoContext();
    await runMotionCli(['new', 'rev-demo'], context);
    const root = join(context.repoRoot, 'projects', 'rev-demo');
    writeSource(root, 'rev-demo');
    await runMotionCli(['snapshot', 'rev-demo'], context);

    const source = {
      brief: {...fixture.brief, projectId: 'rev-demo'},
      treatment: {...fixture.treatment, projectId: 'rev-demo'},
      motion: {...fixture.motion, projectId: 'rev-demo'},
    };
    const patch = {
      mode: 'bounded',
      baseRevisionId: 'rev-0001',
      expectedSourceHashes: {
        brief: sha256Canonical(source.brief),
        treatment: sha256Canonical(source.treatment),
        motion: sha256Canonical(source.motion),
      },
      operations: [{op: 'replace-copy', nodeId: 'hero', value: 'Revised'}],
      declaredImpactSet: [{entity: 'node', id: 'hero'}],
      reason: 'change the hero copy',
      sourceUserInstruction: 'rename hero to Revised',
    };
    const patchPath = join(root, 'patch.json');
    writeFileSync(patchPath, JSON.stringify(patch));

    const code = await runMotionCli(['revise', 'rev-demo', '--patch', patchPath, '--apply'], context);
    expect(code).toBe(0);

    expect(existsSync(join(root, 'revisions', 'rev-0002'))).toBe(true);
    const project = JSON.parse(readFileSync(join(root, 'project.json'), 'utf8')) as {currentRevisionId: string};
    expect(project.currentRevisionId).toBe('rev-0002');

    // The editable source now carries the revised copy.
    const motion = JSON.parse(readFileSync(join(root, 'motion.spec.json'), 'utf8')) as {
      world: {nodes: Array<{id: string; renderer: {props: {text?: string}}}>};
    };
    const hero = motion.world.nodes.find((n) => n.id === 'hero')!;
    expect(hero.renderer.props.text).toBe('Revised');
  });

  it('a dry run (no --apply) validates without creating a revision', async () => {
    const context = createTestRepoContext();
    await runMotionCli(['new', 'dry-demo'], context);
    const root = join(context.repoRoot, 'projects', 'dry-demo');
    writeSource(root, 'dry-demo');
    await runMotionCli(['snapshot', 'dry-demo'], context);

    const patch = {
      mode: 'bounded', baseRevisionId: 'rev-0001',
      expectedSourceHashes: {brief: 'a'.repeat(64), treatment: 'b'.repeat(64), motion: 'c'.repeat(64)},
      operations: [], declaredImpactSet: [], reason: 'noop', sourceUserInstruction: 'noop',
    };
    const patchPath = join(root, 'patch.json');
    writeFileSync(patchPath, JSON.stringify(patch));

    expect(await runMotionCli(['revise', 'dry-demo', '--patch', patchPath], context)).toBe(0);
    expect(existsSync(join(root, 'revisions', 'rev-0002'))).toBe(false);
  });
});
