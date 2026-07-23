import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {anchorRepoRoot, type RepoRootAnchor} from '../../src/engine/ledger/index.js';
import {sha256Hex} from '../../src/engine/ledger/hash.js';
import {jcsCanonical} from '../../src/engine/ledger/jcs.js';
import {
  assertLedgerDerivedCandidatePath,
  budgetForRoute,
  writeCandidate,
} from '../../src/engine/acceptance/candidate-writer.js';

let root: string;
let anchor: RepoRootAnchor;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'cand-writer-'));
  anchor = anchorRepoRoot(root);
});

afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

const BRIEF_PATH =
  'projects/world-cup/.workflow/candidates/request-0001/candidate-0001/brief.spec.json';

function briefBytes(): string {
  // Canonical (JCS) bytes, no trailing newline.
  return jcsCanonical({schemaVersion: 'brief@1', projectId: 'world-cup', title: 'World Cup format'});
}

describe('writeCandidate', () => {
  it('persists exact canonical bytes and returns a matching receipt', () => {
    const bytes = briefBytes();
    const receipt = writeCandidate(anchor, {
      actionId: 'action-0001',
      decisionEventHash: 'a'.repeat(64),
      acceptanceRouteId: 'initial-brief',
      ledgerDerivedCandidatePath: BRIEF_PATH,
      bytes,
    });
    expect(receipt.writer).toBe('trusted-host-candidate-writer@1');
    expect(receipt.candidatePath).toBe(BRIEF_PATH);
    expect(receipt.candidateByteHash).toBe(sha256Hex(bytes));
    expect(receipt.candidateByteLength).toBe(Buffer.byteLength(bytes, 'utf8'));

    // On-disk bytes are exact, with NO trailing newline.
    const onDisk = readFileSync(join(root, BRIEF_PATH), 'utf8');
    expect(onDisk).toBe(bytes);
    expect(onDisk.endsWith('\n')).toBe(false);
  });

  it('refuses to reuse a candidate path (exclusive create)', () => {
    const bytes = briefBytes();
    const req = {
      actionId: 'action-0001',
      decisionEventHash: 'a'.repeat(64),
      acceptanceRouteId: 'initial-brief',
      ledgerDerivedCandidatePath: BRIEF_PATH,
      bytes,
    };
    writeCandidate(anchor, req);
    expect(() => writeCandidate(anchor, req)).toThrow();
  });

  it('refuses bytes that breach the budget before writing anything', () => {
    // Malformed JSON is refused by the budget lexer.
    expect(() =>
      writeCandidate(anchor, {
        actionId: 'action-0001',
        decisionEventHash: 'a'.repeat(64),
        acceptanceRouteId: 'initial-brief',
        ledgerDerivedCandidatePath: BRIEF_PATH,
        bytes: '{"a":',
      }),
    ).toThrow(/CANDIDATE_BUDGET_REFUSED/);
  });

  it('refuses a path with traversal or an absolute prefix', () => {
    expect(() => assertLedgerDerivedCandidatePath('../evil.json', 'initial-brief')).toThrow(
      /CANDIDATE_PATH_INVALID/,
    );
    expect(() => assertLedgerDerivedCandidatePath('/etc/passwd', 'initial-brief')).toThrow(
      /CANDIDATE_PATH_INVALID/,
    );
    expect(() =>
      assertLedgerDerivedCandidatePath('C:/Windows/x.json', 'initial-brief'),
    ).toThrow(/CANDIDATE_PATH_INVALID/);
  });

  it('refuses a candidate path with the wrong shape for its route', () => {
    // A review route requires the out/ reviews path shape.
    expect(() => assertLedgerDerivedCandidatePath(BRIEF_PATH, 'creative-review')).toThrow(
      /CANDIDATE_PATH_SHAPE/,
    );
    // An artifact route requires the candidates path shape.
    expect(() =>
      assertLedgerDerivedCandidatePath(
        'out/world-cup/rev-0001/deadbeef/reviews/creative/review-attempt-0001/review.json',
        'initial-brief',
      ),
    ).toThrow(/CANDIDATE_PATH_SHAPE/);
  });

  it('selects the review budget for review routes', () => {
    expect(budgetForRoute('creative-review').profile).toBe('review-candidate-budget@1');
    expect(budgetForRoute('motion-review').profile).toBe('review-candidate-budget@1');
    expect(budgetForRoute('initial-brief').profile).toBe('artifact-candidate-budget@1');
  });

  it('accepts a well-formed review candidate at the review path', () => {
    const reviewPath =
      'out/world-cup/rev-0001/deadbeef/reviews/creative/review-attempt-0001/review.json';
    const bytes = jcsCanonical({schemaVersion: 'creative-review@1', disposition: 'ship'});
    const receipt = writeCandidate(anchor, {
      actionId: 'action-0002',
      decisionEventHash: 'b'.repeat(64),
      acceptanceRouteId: 'creative-review',
      ledgerDerivedCandidatePath: reviewPath,
      bytes,
    });
    expect(receipt.candidatePath).toBe(reviewPath);
  });
});
