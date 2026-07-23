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
  root = mkdtempSync(join(tmpdir(), 'accept-'));
  anchor = anchorRepoRoot(root);
});

afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

const CANDIDATE_PATH =
  'projects/world-cup/.workflow/candidates/request-0001/candidate-0001/brief.spec.json';

/** A minimal, well-formed initial-brief candidate matching the route rule. */
function briefCandidate(overrides: Record<string, unknown> = {}): string {
  return jcsCanonical({
    schemaVersion: 'brief@1',
    artifactKind: 'brief',
    artifactPath: CANDIDATE_PATH,
    projectId: 'world-cup',
    revisionId: null,
    semanticProducer: 'brief-planner',
    expectedSchemaVersion: 'brief@1',
    acceptanceContext: {acceptanceRouteId: 'initial-brief', artifactKind: 'brief', successState: 'TREATMENT'},
    expectedParentBindings: [
      {name: 'researchFindingsHash', contentHash: null},
      {name: 'localAssetManifestHash', contentHash: null},
    ],
    title: 'World Cup format explainer',
    ...overrides,
  });
}

function stage(bytes: string): {hash: string; length: number} {
  writeCandidate(anchor, {
    actionId: 'action-0001',
    decisionEventHash: 'a'.repeat(64),
    acceptanceRouteId: 'initial-brief',
    ledgerDerivedCandidatePath: CANDIDATE_PATH,
    bytes,
  });
  return {hash: sha256Hex(bytes), length: Buffer.byteLength(bytes, 'utf8')};
}

function baseInput(cap: {hash: string; length: number}) {
  return {
    acceptanceRouteId: 'initial-brief',
    projectId: 'world-cup',
    revisionId: null,
    candidatePath: CANDIDATE_PATH,
    capturedByteHash: cap.hash,
    capturedByteLength: cap.length,
    promptBinding: {promptPath: 'agent/prompts/brief-planner.md', promptHash: 'b'.repeat(64)},
    producerDecisionHash: 'c'.repeat(64),
  };
}

describe('acceptArtifact — initial-brief happy path', () => {
  it('accepts a well-formed candidate and emits ArtifactAcceptance@1', () => {
    const bytes = briefCandidate();
    const cap = stage(bytes);
    const result = acceptArtifact(anchor, baseInput(cap));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const a = result.acceptance;
      expect(a.schemaVersion).toBe('artifact-acceptance@1');
      expect(a.contentHash).toBe(cap.hash);
      expect(a.contentHash).toBe(a.candidateByteHash);
      expect(a.successState).toBe('TREATMENT');
      expect(a.producerPromptPath).toBe('agent/prompts/brief-planner.md');
      expect(a.observedParentBindings).toEqual([
        {name: 'researchFindingsHash', contentHash: null},
        {name: 'localAssetManifestHash', contentHash: null},
      ]);
    }
  });
});

describe('acceptArtifact — refusals (never repairs)', () => {
  it('refuses a byte-hash mismatch (candidate changed since capture)', () => {
    const bytes = briefCandidate();
    stage(bytes);
    const result = acceptArtifact(anchor, {...baseInput({hash: 'f'.repeat(64), length: bytes.length})});
    expect(result).toMatchObject({ok: false, code: 'ACCEPTANCE_HASH_MISMATCH'});
  });

  it('refuses a schema-version mismatch', () => {
    const bytes = briefCandidate({schemaVersion: 'brief@2', expectedSchemaVersion: 'brief@2'});
    const cap = stage(bytes);
    const result = acceptArtifact(anchor, baseInput(cap));
    expect(result).toMatchObject({ok: false, code: 'ACCEPTANCE_SCHEMA_MISMATCH'});
  });

  it('refuses a wrong producer', () => {
    const bytes = briefCandidate({semanticProducer: 'creative-direction'});
    const cap = stage(bytes);
    expect(acceptArtifact(anchor, baseInput(cap))).toMatchObject({
      ok: false,
      code: 'ACCEPTANCE_PRODUCER_MISMATCH',
    });
  });

  it('refuses a parent tuple with the wrong order/names', () => {
    const bytes = briefCandidate({
      expectedParentBindings: [
        {name: 'localAssetManifestHash', contentHash: null},
        {name: 'researchFindingsHash', contentHash: null},
      ],
    });
    const cap = stage(bytes);
    expect(acceptArtifact(anchor, baseInput(cap))).toMatchObject({
      ok: false,
      code: 'ACCEPTANCE_PARENTS_INVALID',
    });
  });

  it('refuses a non-null value for a non-nullable parent shape (wrong count)', () => {
    const bytes = briefCandidate({expectedParentBindings: [{name: 'researchFindingsHash', contentHash: null}]});
    const cap = stage(bytes);
    expect(acceptArtifact(anchor, baseInput(cap))).toMatchObject({
      ok: false,
      code: 'ACCEPTANCE_PARENTS_INVALID',
    });
  });

  it('refuses a context/successState mismatch', () => {
    const bytes = briefCandidate({
      acceptanceContext: {acceptanceRouteId: 'initial-brief', artifactKind: 'brief', successState: 'VALIDATE'},
    });
    const cap = stage(bytes);
    expect(acceptArtifact(anchor, baseInput(cap))).toMatchObject({
      ok: false,
      code: 'ACCEPTANCE_CONTEXT_MISMATCH',
    });
  });

  it('refuses an unwired route loudly rather than guessing', () => {
    const bytes = briefCandidate();
    stage(bytes);
    const result = acceptArtifact(anchor, {...baseInput({hash: sha256Hex(bytes), length: bytes.length}), acceptanceRouteId: 'initial-treatment'});
    expect(result).toMatchObject({ok: false, code: 'ACCEPTANCE_ROUTE_NOT_IMPLEMENTED'});
  });

  it('route matrix resolves all 19 routes', () => {
    const ids = [
      'initial-local-assets', 'source-update-local-assets', 'initial-research', 'source-update-research',
      'initial-brief', 'rebuild-brief', 'initial-treatment', 'rebuild-treatment', 'initial-motion-spec',
      'rebuild-motion-spec', 'initial-capability-gap', 'rebuild-capability-gap', 'bounded-patch',
      'rebuild-patch', 'creative-review', 'motion-review', 'audio-brief', 'initial-capability-receipt',
      'rebuild-capability-receipt', 'project-policy',
    ];
    for (const id of ids) expect(routeRule(id)).not.toBeNull();
    expect(routeRule('nope')).toBeNull();
  });
});
