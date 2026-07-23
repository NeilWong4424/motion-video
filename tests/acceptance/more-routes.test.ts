import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {anchorRepoRoot, type RepoRootAnchor} from '../../src/engine/ledger/index.js';
import {jcsCanonical} from '../../src/engine/ledger/jcs.js';
import {sha256Hex} from '../../src/engine/ledger/hash.js';
import {acceptArtifact, writeCandidate, routeRule} from '../../src/engine/acceptance/index.js';

let root: string;
let anchor: RepoRootAnchor;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'more-routes-'));
  anchor = anchorRepoRoot(root);
});
afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

const H = (c: string) => c.repeat(64);

function candidatePath(filename: string): string {
  return `projects/world-cup/.workflow/candidates/request-0001/candidate-0001/${filename}`;
}

/** Build a candidate for a route using its rule's parents (non-null filled with H). */
function candidateForRoute(routeId: string, parentHashes: Record<string, string | null>): {path: string; bytes: string} {
  const rule = routeRule(routeId)!;
  const path = candidatePath(rule.candidateFilename!);
  const bytes = jcsCanonical({
    schemaVersion: rule.expectedSchemaVersion,
    artifactKind: rule.artifactKind,
    artifactPath: path,
    projectId: 'world-cup',
    revisionId: null,
    semanticProducer: rule.semanticProducer,
    expectedSchemaVersion: rule.expectedSchemaVersion,
    acceptanceContext: {acceptanceRouteId: routeId, artifactKind: rule.artifactKind, successState: rule.successState},
    expectedParentBindings: rule.expectedParents.map((p) => ({
      name: p.name,
      contentHash: p.name in parentHashes ? parentHashes[p.name]! : p.nullable ? null : H('a'),
    })),
    body: 'content',
  });
  return {path, bytes};
}

function stageAndAccept(routeId: string, parentHashes: Record<string, string | null> = {}) {
  const {path, bytes} = candidateForRoute(routeId, parentHashes);
  writeCandidate(anchor, {
    actionId: 'action-0001',
    decisionEventHash: H('d'),
    acceptanceRouteId: routeId,
    ledgerDerivedCandidatePath: path,
    bytes,
  });
  return acceptArtifact(anchor, {
    acceptanceRouteId: routeId,
    projectId: 'world-cup',
    revisionId: null,
    candidatePath: path,
    capturedByteHash: sha256Hex(bytes),
    capturedByteLength: Buffer.byteLength(bytes, 'utf8'),
    promptBinding: {promptPath: 'agent/prompts/x.md', promptHash: H('b')},
    producerDecisionHash: H('c'),
  });
}

describe('newly-wired role routes accept with correct parents', () => {
  it('initial-research (non-null localAssetManifestHash) -> FACT_CHECK', () => {
    const r = stageAndAccept('initial-research', {localAssetManifestHash: H('a')});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.acceptance.successState).toBe('FACT_CHECK');
  });

  it('initial-treatment (briefHash + registry) -> MOTION_SPEC', () => {
    const r = stageAndAccept('initial-treatment', {
      briefHash: H('1'),
      researchFindingsHash: null,
      localAssetManifestHash: null,
      catalogRegistrySnapshotHash: H('2'),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.acceptance.successState).toBe('MOTION_SPEC');
      expect(r.acceptance.observedParentBindings[0]).toEqual({name: 'briefHash', contentHash: H('1')});
    }
  });

  it('initial-motion-spec (six-parent tuple) -> VALIDATE', () => {
    const r = stageAndAccept('initial-motion-spec', {
      briefHash: H('1'),
      treatmentHash: H('2'),
      researchFindingsHash: null,
      localAssetManifestHash: null,
      capabilityRegistrySnapshotHash: H('3'),
      capabilityReceiptSetHash: H('4'),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.acceptance.successState).toBe('VALIDATE');
  });

  it('refuses a required non-null parent that is null', () => {
    const r = stageAndAccept('initial-research', {localAssetManifestHash: null});
    expect(r).toMatchObject({ok: false, code: 'ACCEPTANCE_PARENTS_INVALID'});
  });

  it('refuses a candidate whose filename does not match the route path form', () => {
    // Write a treatment candidate but at a brief filename path.
    const rule = routeRule('initial-treatment')!;
    const wrongPath = candidatePath('brief.spec.json');
    const bytes = jcsCanonical({
      schemaVersion: rule.expectedSchemaVersion,
      artifactKind: rule.artifactKind,
      artifactPath: wrongPath,
      projectId: 'world-cup',
      revisionId: null,
      semanticProducer: rule.semanticProducer,
      expectedSchemaVersion: rule.expectedSchemaVersion,
      acceptanceContext: {acceptanceRouteId: 'initial-treatment', artifactKind: rule.artifactKind, successState: rule.successState},
      expectedParentBindings: rule.expectedParents.map((p) => ({name: p.name, contentHash: p.nullable ? null : H('a')})),
    });
    writeCandidate(anchor, {
      actionId: 'action-0001',
      decisionEventHash: H('d'),
      acceptanceRouteId: 'initial-treatment',
      ledgerDerivedCandidatePath: wrongPath,
      bytes,
    });
    const r = acceptArtifact(anchor, {
      acceptanceRouteId: 'initial-treatment',
      projectId: 'world-cup',
      revisionId: null,
      candidatePath: wrongPath,
      capturedByteHash: sha256Hex(bytes),
      capturedByteLength: Buffer.byteLength(bytes, 'utf8'),
      promptBinding: null,
      producerDecisionHash: H('c'),
    });
    expect(r).toMatchObject({ok: false, code: 'ACCEPTANCE_PATH_FILENAME'});
  });

  it('still refuses genuinely unwired routes (audio-brief, project-policy, reviews)', () => {
    for (const routeId of ['audio-brief', 'project-policy', 'creative-review', 'initial-local-assets']) {
      const rule = routeRule(routeId)!;
      const r = acceptArtifact(anchor, {
        acceptanceRouteId: routeId,
        projectId: 'world-cup',
        revisionId: null,
        candidatePath: candidatePath(rule.candidateFilename ?? 'x.json'),
        capturedByteHash: H('0'),
        capturedByteLength: 1,
        promptBinding: null,
        producerDecisionHash: null,
      });
      expect(r).toMatchObject({ok: false, code: 'ACCEPTANCE_ROUTE_NOT_IMPLEMENTED'});
    }
  });
});
