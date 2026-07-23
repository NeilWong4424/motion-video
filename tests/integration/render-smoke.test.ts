import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';
import sharp from 'sharp';

import {createRenderRepoContext} from '../helpers/create-test-repo-context.js';
import {runMotionCli} from '../../src/cli/index.js';
import {resolveProjectPaths} from '../../src/engine/project/paths.js';
import {findCurrentPlan} from '../../src/engine/renderer/resolve-project.js';
import {renderStills} from '../../src/engine/renderer/render-stills.js';
import {renderFinal} from '../../src/engine/renderer/render-final.js';

const fixtureMotion = readFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'),
  'utf8',
);

async function prepareResolved(id: string) {
  const context = createRenderRepoContext();
  await runMotionCli(['new', id], context);
  const projectRoot = join(context.repoRoot, 'projects', id);
  const motion = JSON.parse(fixtureMotion) as {projectId: string};
  motion.projectId = id;
  writeFileSync(join(projectRoot, 'motion.spec.json'), JSON.stringify(motion));
  const brief = JSON.parse(readFileSync(join(projectRoot, 'brief.spec.json'), 'utf8')) as {projectId: string; durationSeconds: number};
  brief.projectId = id;
  brief.durationSeconds = 15;
  writeFileSync(join(projectRoot, 'brief.spec.json'), JSON.stringify(brief));
  const treatment = JSON.parse(readFileSync(join(projectRoot, 'treatment.json'), 'utf8')) as {projectId: string; transitionVocabulary: string[]};
  treatment.projectId = id;
  treatment.transitionVocabulary = ['shared-element', 'camera-navigation'];
  writeFileSync(join(projectRoot, 'treatment.json'), JSON.stringify(treatment));
  await runMotionCli(['snapshot', id], context);
  await runMotionCli(['resolve', id], context);
  const paths = resolveProjectPaths(context, id);
  const current = findCurrentPlan(paths, 'rev-0001')!;
  return {context, current};
}

describe('render smoke (real Remotion)', () => {
  it('renders a still with visible content at source dimensions', async () => {
    const {context, current} = await prepareResolved('still-demo');
    const [pngPath] = await renderStills(context, current.plan, current.hash, current.dir, [{frame: 60, label: 'hook'}]);
    expect(existsSync(pngPath!)).toBe(true);

    const meta = await sharp(pngPath!).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);

    // The hero text region contains bright pixels.
    const region = await sharp(pngPath!).extract({left: 700, top: 400, width: 500, height: 200}).stats();
    expect(region.channels[0]!.max).toBeGreaterThan(120);
  }, 240_000);

  it('renderFinal refuses before the gate artifacts exist', async () => {
    const {context, current} = await prepareResolved('gate-demo');
    await expect(
      renderFinal(context, current.plan, current.hash, current.dir, 'a'.repeat(64)),
    ).rejects.toThrow(/FINAL_GATE_INCOMPLETE/);
  }, 120_000);
});
