/**
 * Artifact acceptance (Part 1 governance).
 *
 * First slice: the two self-contained primitives from artifact-acceptance.md —
 * the ArtifactCandidateBudget streaming lexer (refuse-before-write) and the trusted
 * host candidate writer (Ledger-derived path, exclusive create, receipt). The route
 * matrix, schema/parent verification, prompt provenance, and the acceptance →
 * success-state continuation are later slices.
 */

export {
  ARTIFACT_CANDIDATE_BUDGET,
  REVIEW_CANDIDATE_BUDGET,
  enforceCandidateBudget,
  type CandidateBudget,
  type BudgetResult,
} from './candidate-budget.js';

export {
  writeCandidate,
  budgetForRoute,
  assertLedgerDerivedCandidatePath,
  type TrustedCandidateWriteRequest,
  type CandidateWriteReceipt,
} from './candidate-writer.js';

export {
  ROUTE_RULES,
  routeRule,
  type RouteRule,
  type ParentSpec,
  type AcceptedArtifactKind,
  type SemanticProducer,
} from './route-matrix.js';

export {
  acceptArtifact,
  type AcceptanceInput,
  type AcceptanceResult,
  type ArtifactAcceptance,
  type ObservedParent,
  type PromptBinding,
} from './acceptance.js';
