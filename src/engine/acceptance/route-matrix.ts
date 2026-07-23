/**
 * Closed acceptance route matrix, from `agent/contracts/artifact-acceptance.md`.
 *
 * Each route binds acceptanceRouteId ↔ artifactKind ↔ semanticProducer ↔ schema ↔
 * unique immutable path form ↔ ordered parent-tuple ↔ successState as one
 * inseparable rule. This module encodes that matrix as validated data plus a
 * resolver, so an acceptance verifier can look a route up and check every field.
 *
 * Build scope: the table below is the complete 19-route matrix (data). The
 * VERIFIER currently implements the `initial-brief` route end-to-end; other routes
 * are present as data and are resolvable, but the verifier refuses to accept a route
 * it has not yet wired rather than guess (see acceptance.ts).
 */

export type AcceptedArtifactKind =
  | 'local-asset-manifest'
  | 'research-findings'
  | 'brief'
  | 'treatment'
  | 'motion-spec'
  | 'capability-gap'
  | 'semantic-patch'
  | 'creative-review'
  | 'motion-review'
  | 'audio-brief'
  | 'capability-implementation-receipt'
  | 'project-policy';

export type SemanticProducer =
  | 'local-source-ingress'
  | 'researcher'
  | 'brief-planner'
  | 'creative-direction'
  | 'motion-planner'
  | 'revision-interpreter'
  | 'creative-reviewer'
  | 'motion-reviewer'
  | 'sound-designer'
  | 'project-local-capability-implementation-and-registration'
  | 'user';

/** A parent binding name and whether it is nullable in this artifact's tuple. */
export type ParentSpec = {name: string; nullable: boolean};

export type RouteRule = {
  acceptanceRouteId: string;
  artifactKind: AcceptedArtifactKind;
  semanticProducer: SemanticProducer;
  expectedSchemaVersion: string;
  /** Ordered parent tuple (names + nullability), exactly as the contract's union. */
  expectedParents: ParentSpec[];
  /** The single success-state continuation this acceptance applies. */
  successState: string;
  /** Which candidate-path family this route uses. */
  pathFamily: 'request-candidate' | 'revision-candidate' | 'review' | 'capability-receipt';
  /** The exact terminal filename for request/revision candidate routes. */
  candidateFilename: string | null;
};

const P = (name: string, nullable = false): ParentSpec => ({name, nullable});

/** The complete closed route matrix. */
export const ROUTE_RULES: readonly RouteRule[] = [
  {
    acceptanceRouteId: 'initial-local-assets',
    artifactKind: 'local-asset-manifest',
    semanticProducer: 'local-source-ingress',
    expectedSchemaVersion: 'local-asset-manifest@1',
    expectedParents: [P('previousLocalAssetManifestHash', true)],
    successState: 'FACT_CHECK',
    pathFamily: 'request-candidate',
    candidateFilename: 'assets.manifest.json',
  },
  {
    acceptanceRouteId: 'source-update-local-assets',
    artifactKind: 'local-asset-manifest',
    semanticProducer: 'local-source-ingress',
    expectedSchemaVersion: 'local-asset-manifest@1',
    expectedParents: [P('previousLocalAssetManifestHash', true)],
    successState: 'REVISION_SOURCE_UPDATE',
    pathFamily: 'request-candidate',
    candidateFilename: 'assets.manifest.json',
  },
  {
    acceptanceRouteId: 'initial-research',
    artifactKind: 'research-findings',
    semanticProducer: 'researcher',
    expectedSchemaVersion: 'research-findings@1',
    expectedParents: [P('localAssetManifestHash')],
    successState: 'FACT_CHECK',
    pathFamily: 'request-candidate',
    candidateFilename: 'research.findings.json',
  },
  {
    acceptanceRouteId: 'source-update-research',
    artifactKind: 'research-findings',
    semanticProducer: 'researcher',
    expectedSchemaVersion: 'research-findings@1',
    expectedParents: [P('localAssetManifestHash')],
    successState: 'REVISION_SOURCE_UPDATE',
    pathFamily: 'request-candidate',
    candidateFilename: 'research.findings.json',
  },
  {
    acceptanceRouteId: 'initial-brief',
    artifactKind: 'brief',
    semanticProducer: 'brief-planner',
    expectedSchemaVersion: 'brief@1',
    expectedParents: [P('researchFindingsHash', true), P('localAssetManifestHash', true)],
    successState: 'TREATMENT',
    pathFamily: 'request-candidate',
    candidateFilename: 'brief.spec.json',
  },
  {
    acceptanceRouteId: 'rebuild-brief',
    artifactKind: 'brief',
    semanticProducer: 'brief-planner',
    expectedSchemaVersion: 'brief@1',
    expectedParents: [P('researchFindingsHash', true), P('localAssetManifestHash', true)],
    successState: 'REBUILD_AUTHORING',
    pathFamily: 'revision-candidate',
    candidateFilename: 'brief.spec.json',
  },
  {
    acceptanceRouteId: 'initial-treatment',
    artifactKind: 'treatment',
    semanticProducer: 'creative-direction',
    expectedSchemaVersion: 'treatment@1',
    expectedParents: [
      P('briefHash'),
      P('researchFindingsHash', true),
      P('localAssetManifestHash', true),
      P('catalogRegistrySnapshotHash'),
    ],
    successState: 'MOTION_SPEC',
    pathFamily: 'request-candidate',
    candidateFilename: 'treatment.json',
  },
  {
    acceptanceRouteId: 'rebuild-treatment',
    artifactKind: 'treatment',
    semanticProducer: 'creative-direction',
    expectedSchemaVersion: 'treatment@1',
    expectedParents: [
      P('briefHash'),
      P('researchFindingsHash', true),
      P('localAssetManifestHash', true),
      P('catalogRegistrySnapshotHash'),
    ],
    successState: 'REBUILD_AUTHORING',
    pathFamily: 'revision-candidate',
    candidateFilename: 'treatment.json',
  },
  {
    acceptanceRouteId: 'initial-motion-spec',
    artifactKind: 'motion-spec',
    semanticProducer: 'motion-planner',
    expectedSchemaVersion: 'motion-spec@1',
    expectedParents: [
      P('briefHash'),
      P('treatmentHash'),
      P('researchFindingsHash', true),
      P('localAssetManifestHash', true),
      P('capabilityRegistrySnapshotHash'),
      P('capabilityReceiptSetHash'),
    ],
    successState: 'VALIDATE',
    pathFamily: 'request-candidate',
    candidateFilename: 'motion.spec.json',
  },
  {
    acceptanceRouteId: 'rebuild-motion-spec',
    artifactKind: 'motion-spec',
    semanticProducer: 'motion-planner',
    expectedSchemaVersion: 'motion-spec@1',
    expectedParents: [
      P('briefHash'),
      P('treatmentHash'),
      P('researchFindingsHash', true),
      P('localAssetManifestHash', true),
      P('capabilityRegistrySnapshotHash'),
      P('capabilityReceiptSetHash'),
    ],
    successState: 'VALIDATE',
    pathFamily: 'revision-candidate',
    candidateFilename: 'motion.spec.json',
  },
  {
    acceptanceRouteId: 'initial-capability-gap',
    artifactKind: 'capability-gap',
    semanticProducer: 'motion-planner',
    expectedSchemaVersion: 'capability-gap@1',
    expectedParents: [
      P('briefHash'),
      P('treatmentHash'),
      P('localAssetManifestHash', true),
      P('capabilityRegistrySnapshotHash'),
      P('capabilityReceiptSetHash'),
    ],
    successState: 'CAPABILITY_GAP',
    pathFamily: 'request-candidate',
    candidateFilename: 'capability-gap.json',
  },
  {
    acceptanceRouteId: 'rebuild-capability-gap',
    artifactKind: 'capability-gap',
    semanticProducer: 'motion-planner',
    expectedSchemaVersion: 'capability-gap@1',
    expectedParents: [
      P('briefHash'),
      P('treatmentHash'),
      P('localAssetManifestHash', true),
      P('capabilityRegistrySnapshotHash'),
      P('capabilityReceiptSetHash'),
    ],
    successState: 'CAPABILITY_GAP',
    pathFamily: 'revision-candidate',
    candidateFilename: 'capability-gap.json',
  },
  {
    acceptanceRouteId: 'bounded-patch',
    artifactKind: 'semantic-patch',
    semanticProducer: 'revision-interpreter',
    expectedSchemaVersion: 'semantic-patch@1',
    expectedParents: [
      P('revisionManifestHash'),
      P('briefHash'),
      P('treatmentHash'),
      P('motionSpecHash'),
      P('lockSetHash'),
      P('stagedLocalAssetManifestHash', true),
      P('stagedResearchFindingsHash', true),
    ],
    successState: 'APPLY_SEMANTIC_REVISION',
    pathFamily: 'request-candidate',
    candidateFilename: 'revision.patch.json',
  },
  {
    acceptanceRouteId: 'rebuild-patch',
    artifactKind: 'semantic-patch',
    semanticProducer: 'revision-interpreter',
    expectedSchemaVersion: 'semantic-patch@1',
    expectedParents: [
      P('revisionManifestHash'),
      P('briefHash'),
      P('treatmentHash'),
      P('motionSpecHash'),
      P('lockSetHash'),
      P('stagedLocalAssetManifestHash', true),
      P('stagedResearchFindingsHash', true),
    ],
    successState: 'REBUILD_AUTHORING',
    pathFamily: 'request-candidate',
    candidateFilename: 'revision.patch.json',
  },
  {
    acceptanceRouteId: 'creative-review',
    artifactKind: 'creative-review',
    semanticProducer: 'creative-reviewer',
    expectedSchemaVersion: 'creative-review@1',
    expectedParents: [
      P('revisionManifestHash'),
      P('motionSpecHash'),
      P('renderPlanHash'),
      P('previewHash'),
      P('sampledEvidenceManifestHash'),
      P('technicalQcHash'),
    ],
    successState: 'CREATIVE_AND_MOTION_REVIEW',
    pathFamily: 'review',
    candidateFilename: 'review.json',
  },
  {
    acceptanceRouteId: 'motion-review',
    artifactKind: 'motion-review',
    semanticProducer: 'motion-reviewer',
    expectedSchemaVersion: 'motion-review@1',
    expectedParents: [
      P('revisionManifestHash'),
      P('motionSpecHash'),
      P('renderPlanHash'),
      P('previewHash'),
      P('sampledEvidenceManifestHash'),
      P('technicalQcHash'),
    ],
    successState: 'CREATIVE_AND_MOTION_REVIEW',
    pathFamily: 'review',
    candidateFilename: 'review.json',
  },
  {
    acceptanceRouteId: 'audio-brief',
    artifactKind: 'audio-brief',
    semanticProducer: 'sound-designer',
    expectedSchemaVersion: 'audio-brief@1',
    expectedParents: [
      P('previewApprovalHash'),
      P('renderManifestHash'),
      P('silentMasterHash'),
      P('technicalQcHash'),
      P('creativeReviewHash'),
      P('motionReviewHash'),
    ],
    successState: 'AUDIO_PROMPT',
    pathFamily: 'request-candidate',
    candidateFilename: 'audio-brief.json',
  },
  {
    acceptanceRouteId: 'initial-capability-receipt',
    artifactKind: 'capability-implementation-receipt',
    semanticProducer: 'project-local-capability-implementation-and-registration',
    expectedSchemaVersion: 'capability-implementation-receipt@1',
    expectedParents: [
      P('gapContentHash'),
      P('routeDecisionHash'),
      P('advisoryResultReceiptHash'),
      P('implementationAuthorizationHash'),
    ],
    successState: 'MOTION_SPEC',
    pathFamily: 'capability-receipt',
    candidateFilename: 'implementation-receipt.json',
  },
  {
    acceptanceRouteId: 'rebuild-capability-receipt',
    artifactKind: 'capability-implementation-receipt',
    semanticProducer: 'project-local-capability-implementation-and-registration',
    expectedSchemaVersion: 'capability-implementation-receipt@1',
    expectedParents: [
      P('gapContentHash'),
      P('routeDecisionHash'),
      P('advisoryResultReceiptHash'),
      P('implementationAuthorizationHash'),
    ],
    successState: 'REBUILD_AUTHORING',
    pathFamily: 'capability-receipt',
    candidateFilename: 'implementation-receipt.json',
  },
  {
    acceptanceRouteId: 'project-policy',
    artifactKind: 'project-policy',
    semanticProducer: 'user',
    expectedSchemaVersion: 'project-policy@1',
    expectedParents: [P('previousProjectPolicyHash', true)],
    successState: 'PREVIEW_GATE',
    pathFamily: 'request-candidate',
    candidateFilename: 'project.policy.json',
  },
];

const RULE_BY_ID = new Map<string, RouteRule>(ROUTE_RULES.map((r) => [r.acceptanceRouteId, r]));

/** Resolve a route rule by acceptanceRouteId; null when the id is not in the matrix. */
export function routeRule(acceptanceRouteId: string): RouteRule | null {
  return RULE_BY_ID.get(acceptanceRouteId) ?? null;
}
