import {DeliveryManifestSchema, type DeliveryManifest} from '../../contracts/manifest.js';

export type DeliveryInput = {
  projectId: string;
  revisionId: string;
  renderPlanHash: string;
  audioBriefHash: string;
  promptAttemptHash: string;
} & ({audioStatus: 'not-provided'} | {audioStatus: 'mixed'; mixAttemptHash: string});

/**
 * Build a delivery manifest. `not-provided` is a valid delivery state; `mixed`
 * requires a selected mixAttemptHash. The manifest's own content hash determines
 * its filename, so a changed status/take creates a new manifest.
 */
export function packageDelivery(input: DeliveryInput): DeliveryManifest {
  const base = {
    schemaVersion: 'delivery-manifest@1' as const,
    projectId: input.projectId,
    revisionId: input.revisionId,
    renderPlanHash: input.renderPlanHash,
    audioBriefHash: input.audioBriefHash,
    promptAttemptHash: input.promptAttemptHash,
  };
  const manifest =
    input.audioStatus === 'mixed'
      ? {...base, audioStatus: 'mixed' as const, mixAttemptHash: input.mixAttemptHash}
      : {...base, audioStatus: 'not-provided' as const};
  return DeliveryManifestSchema.parse(manifest);
}
