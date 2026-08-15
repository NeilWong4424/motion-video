import {join} from 'node:path';

import {renderMedia, selectComposition} from '@remotion/renderer';

import type {RenderPlan} from '../../contracts/render-plan.js';
import type {RepoContext} from '../project/paths.js';
import {bundleRuntime} from './bundle-runtime.js';

export type RenderProfileKind = 'preview' | 'final';

/**
 * Render a project composition at a given profile to a silent MP4. Uses the
 * plan's explicit profile (preview 960px CRF28 / final source-size CRF18). The
 * renderer never downloads assets and has no hidden profile defaults.
 */
export async function renderProfile(
  context: RepoContext,
  plan: RenderPlan,
  renderPlanHash: string,
  kind: RenderProfileKind,
  outputPath: string,
): Promise<void> {
  const profile = plan.profiles[kind];
  const serveUrl = await bundleRuntime(context, `${renderPlanHash}:${kind}`);

  const composition = await selectComposition({
    serveUrl,
    id: plan.projectId,
    inputProps: {plan},
  });

  // The composition is always authored at the true canvas size; the preview
  // profile downscales the OUTPUT via Remotion's `scale`, never by shrinking the
  // canvas (which would leave 1920-space coordinates in a 960-wide frame and
  // push content off-screen). scale = profile.width / canvas.width.
  const outputScale = profile.width / plan.canvas.width;

  await renderMedia({
    composition: {
      ...composition,
      width: plan.canvas.width,
      height: plan.canvas.height,
      durationInFrames: plan.durationInFrames,
      fps: plan.canvas.fps,
    },
    serveUrl,
    codec: 'h264',
    crf: profile.crf,
    scale: outputScale,
    outputLocation: outputPath,
    inputProps: {plan},
    muted: true,
    overwrite: false,
  });
}

export function previewOutputPath(outputDir: string): string {
  return join(outputDir, 'preview.mp4');
}

export function finalOutputPath(outputDir: string): string {
  return join(outputDir, 'master-silent.mp4');
}
