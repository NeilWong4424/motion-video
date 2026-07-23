import {readFileSync} from 'node:fs';

import type {RenderPlan} from '../../contracts/render-plan.js';
import type {RepoContext} from '../project/paths.js';
import {sha256Hex} from '../hash.js';
import {renderProfile, finalOutputPath} from './render-preview.js';
import {assertFinalRenderGate} from './assert-final-render-gate.js';

/**
 * Render the final silent master at source dimensions. Calls the gate guard
 * before opening any output file; rejects with FINAL_GATE_* if QC, both reviews
 * and the approval are not present and bound to the exact plan/preview.
 */
export async function renderFinal(
  context: RepoContext,
  plan: RenderPlan,
  renderPlanHash: string,
  outputDir: string,
  previewHash: string,
): Promise<string> {
  const gate = assertFinalRenderGate(outputDir, renderPlanHash, previewHash);
  if (!gate.ok) {
    throw new Error(`${gate.code}: ${gate.reason}`);
  }
  const output = finalOutputPath(outputDir);
  await renderProfile(context, plan, renderPlanHash, 'final', output);
  return output;
}

export function fileSha256(path: string): string {
  return sha256Hex(readFileSync(path));
}
