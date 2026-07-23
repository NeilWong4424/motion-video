import {RenderManifestArtifactSchema, type RenderManifestArtifact} from '../../contracts/manifest.js';
import type {RenderPlan} from '../../contracts/render-plan.js';

export type RenderManifestInput = {
  plan: RenderPlan;
  sourceHashes: {brief: string; treatment: string; motion: string};
  resolvedMotionHash: string;
  renderPlanHash: string;
  pnpmVersion: string;
  profileKind: 'preview' | 'final';
  outputSha256: string;
};

/**
 * Build the immutable render manifest. It records identities/hashes/versions
 * only — no timestamp, username, absolute path or secret.
 */
export function createRenderManifest(input: RenderManifestInput): RenderManifestArtifact {
  const profile = input.plan.profiles[input.profileKind];
  const manifest: RenderManifestArtifact = {
    schemaVersion: 'render-manifest@1',
    projectId: input.plan.projectId,
    revisionId: input.plan.revisionId,
    sourceHashes: input.sourceHashes,
    resolvedMotionHash: input.resolvedMotionHash,
    renderPlanHash: input.renderPlanHash,
    nodeVersion: input.plan.build.nodeVersion,
    pnpmVersion: input.pnpmVersion,
    remotionVersion: input.plan.build.remotionVersion,
    width: profile.width,
    height: profile.height,
    fps: input.plan.canvas.fps,
    frameCount: input.plan.durationInFrames,
    codec: 'h264',
    crf: profile.crf,
    seed: input.plan.seed,
    outputSha256: input.outputSha256,
  };
  return RenderManifestArtifactSchema.parse(manifest);
}
