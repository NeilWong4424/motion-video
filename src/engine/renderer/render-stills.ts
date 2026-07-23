import {join} from 'node:path';

import {renderStill, selectComposition} from '@remotion/renderer';

import type {RenderPlan} from '../../contracts/render-plan.js';
import type {RepoContext} from '../project/paths.js';
import {bundleRuntime} from './bundle-runtime.js';

export type StillRequest = {frame: number; label: string};

/**
 * Render deterministic stills at exact integer frames in [0, duration). File
 * names are `<frame>-<label>.png`.
 */
export async function renderStills(
  context: RepoContext,
  plan: RenderPlan,
  renderPlanHash: string,
  outputDir: string,
  stills: readonly StillRequest[],
): Promise<string[]> {
  for (const still of stills) {
    if (!Number.isInteger(still.frame) || still.frame < 0 || still.frame >= plan.durationInFrames) {
      throw new Error(`STILL_FRAME_OUT_OF_RANGE: ${still.frame}`);
    }
  }
  const serveUrl = await bundleRuntime(context, `${renderPlanHash}:stills`);
  const composition = await selectComposition({serveUrl, id: plan.projectId, inputProps: {plan}});

  const paths: string[] = [];
  for (const still of stills) {
    const output = join(outputDir, `${still.frame}-${still.label}.png`);
    await renderStill({
      composition: {
        ...composition,
        width: plan.canvas.width,
        height: plan.canvas.height,
        durationInFrames: plan.durationInFrames,
        fps: plan.canvas.fps,
      },
      serveUrl,
      frame: still.frame,
      output,
      inputProps: {plan},
      overwrite: true,
    });
    paths.push(output);
  }
  return paths;
}
