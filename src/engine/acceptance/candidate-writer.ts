/**
 * Trusted host candidate writer — the opaque byte sink for role/reviewer output.
 *
 * Per `agent/contracts/artifact-acceptance.md`, roles never open a filesystem path;
 * they supply canonical candidate bytes and the host writer persists them at a
 * Ledger-DERIVED path (never a caller/model-chosen one), returning a
 * CandidateWriteReceipt. This module is that writer's mechanical core.
 *
 * Sequence:
 *   1. enforce the applicable ArtifactCandidateBudget over the exact bytes
 *      (refuse before any filesystem mutation);
 *   2. exclusively create the file at the Ledger-derived path (no follow, no reuse);
 *   3. reopen through the anchored path and rehash the persisted bytes;
 *   4. return the receipt binding action/route/path/hash/length.
 *
 * Filesystem safety reuses the ledger's portable anchored primitives, including the
 * documented win32 reduced-guarantee vs POSIX openat/O_NOFOLLOW.
 */

import {createExclusiveFile, readFileUnderRoot, type RepoRootAnchor} from '../ledger/fs-safe.js';
import {sha256Hex} from '../ledger/hash.js';
import {
  ARTIFACT_CANDIDATE_BUDGET,
  REVIEW_CANDIDATE_BUDGET,
  enforceCandidateBudget,
  type CandidateBudget,
} from './candidate-budget.js';

/** Acceptance route IDs that use the review budget rather than the artifact budget. */
const REVIEW_ROUTES = new Set(['creative-review', 'motion-review']);

export type TrustedCandidateWriteRequest = {
  actionId: string;
  decisionEventHash: string;
  acceptanceRouteId: string;
  /** The exact Ledger-derived candidate path (repository-relative, POSIX). */
  ledgerDerivedCandidatePath: string;
  /** Canonical candidate bytes as a UTF-8 string. */
  bytes: string;
};

export type CandidateWriteReceipt = {
  actionId: string;
  acceptanceRouteId: string;
  candidatePath: string;
  candidateByteHash: string;
  candidateByteLength: number;
  writer: 'trusted-host-candidate-writer@1';
};

export function budgetForRoute(acceptanceRouteId: string): CandidateBudget {
  return REVIEW_ROUTES.has(acceptanceRouteId) ? REVIEW_CANDIDATE_BUDGET : ARTIFACT_CANDIDATE_BUDGET;
}

/**
 * Validate that a candidate path is within the exact allowed candidate/review
 * allocation shape. The writer never composes this path itself — it is Ledger-
 * derived — but it still refuses a path that does not match the allowed forms, so a
 * mis-derived path cannot slip through.
 */
export function assertLedgerDerivedCandidatePath(path: string, acceptanceRouteId: string): void {
  if (path.includes('..') || path.includes('\\') || path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    throw new Error(`CANDIDATE_PATH_INVALID: ${path}`);
  }
  const isReview = REVIEW_ROUTES.has(acceptanceRouteId);
  const okReview = /^out\/[^/]+\/[^/]+\/[^/]+\/reviews\/(creative|motion)\/[^/]+\/review\.json$/.test(path);
  const okCandidate = /^projects\/[^/]+\/\.workflow\/candidates\/[^/]+\/[^/]+\/[^/]+$/.test(path);
  if (isReview ? !okReview : !okCandidate) {
    throw new Error(`CANDIDATE_PATH_SHAPE: ${path} for ${acceptanceRouteId}`);
  }
}

/**
 * Persist a candidate. Enforces the budget, exclusively creates the file at the
 * Ledger-derived path, reopens + rehashes, and returns the receipt. Throws (no
 * receipt) on any budget breach, path shape mismatch, pre-existing file, or
 * hash/length mismatch after reopen.
 */
export function writeCandidate(
  anchor: RepoRootAnchor,
  request: TrustedCandidateWriteRequest,
): CandidateWriteReceipt {
  assertLedgerDerivedCandidatePath(request.ledgerDerivedCandidatePath, request.acceptanceRouteId);

  // 1. Enforce budget over the exact bytes BEFORE any filesystem mutation.
  const budget = budgetForRoute(request.acceptanceRouteId);
  const budgetResult = enforceCandidateBudget(request.bytes, budget);
  if (!budgetResult.ok) {
    throw new Error(`CANDIDATE_BUDGET_REFUSED: ${budgetResult.code} ${budgetResult.detail}`);
  }

  const expectedHash = sha256Hex(request.bytes);
  const expectedLength = Buffer.byteLength(request.bytes, 'utf8');

  // 2. Exclusive create (no follow, no reuse). Candidate bytes have NO trailing
  //    newline, per the canonical byte law — createExclusiveFile writes exact bytes.
  createExclusiveFile(anchor, request.ledgerDerivedCandidatePath, request.bytes);

  // 3. Reopen through the anchored path and rehash the persisted bytes.
  const reloaded = readFileUnderRoot(anchor, request.ledgerDerivedCandidatePath);
  const actualHash = sha256Hex(reloaded);
  const actualLength = Buffer.byteLength(reloaded, 'utf8');
  if (actualHash !== expectedHash || actualLength !== expectedLength) {
    throw new Error('CANDIDATE_REOPEN_MISMATCH');
  }

  // 4. Receipt.
  return {
    actionId: request.actionId,
    acceptanceRouteId: request.acceptanceRouteId,
    candidatePath: request.ledgerDerivedCandidatePath,
    candidateByteHash: actualHash,
    candidateByteLength: actualLength,
    writer: 'trusted-host-candidate-writer@1',
  };
}
