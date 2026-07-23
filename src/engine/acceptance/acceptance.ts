/**
 * artifact-validation-and-hashing — the acceptance verifier.
 *
 * Per `agent/contracts/artifact-acceptance.md`, acceptance owns only MECHANICAL
 * validation: it reloads the exact candidate bytes through the anchored no-follow
 * read protocol, rehashes them, independently re-runs the candidate budget, verifies
 * schema version / artifact kind / producer / project, verifies the exact ordered
 * parent tuple, binds prompt provenance from the pre-run delegation decision, and
 * emits ArtifactAcceptance@1 whose contentHash === candidateByteHash. It never
 * normalizes prose, reorders arrays, repairs a schema, or makes a creative decision.
 *
 * Build scope: the `initial-brief` route is wired end-to-end. Other routes resolve
 * in the matrix but acceptance refuses them with ACCEPTANCE_ROUTE_NOT_IMPLEMENTED,
 * so an unwired route can never be silently accepted.
 */

import {readFileUnderRoot, type RepoRootAnchor} from '../ledger/fs-safe.js';
import {sha256Hex} from '../ledger/hash.js';
import {enforceCandidateBudget} from './candidate-budget.js';
import {budgetForRoute} from './candidate-writer.js';
import {routeRule, type RouteRule} from './route-matrix.js';

/** Routes whose acceptance is fully wired in this build. */
const WIRED_ROUTES = new Set(['initial-brief']);

/** A parent binding as observed on the candidate (name → hash-or-null). */
export type ObservedParent = {name: string; contentHash: string | null};

/** The pre-run delegation decision's prompt binding (role routes) or null. */
export type PromptBinding = {promptPath: string; promptHash: string} | null;

export type AcceptanceInput = {
  acceptanceRouteId: string;
  projectId: string;
  revisionId: string | null;
  candidatePath: string;
  /** Byte hash + length the Ledger captured at candidate-ready. */
  capturedByteHash: string;
  capturedByteLength: number;
  /** Prompt binding from the decision recorded BEFORE the role ran. */
  promptBinding: PromptBinding;
  /** Producer decision hash from the pending action, or null for deterministic/user producers. */
  producerDecisionHash: string | null;
};

export type ArtifactAcceptance = {
  schemaVersion: 'artifact-acceptance@1';
  contractVersion: 'artifact-acceptance@1';
  artifactPath: string;
  projectId: string;
  revisionId: string | null;
  artifactKind: string;
  semanticProducer: string;
  expectedSchemaVersion: string;
  acceptanceRouteId: string;
  successState: string;
  candidateByteHash: string;
  contentHash: string;
  byteLength: number;
  producerDecisionHash: string | null;
  producerPromptPath: string | null;
  producerPromptHash: string | null;
  observedParentBindings: ObservedParent[];
};

export type AcceptanceResult =
  | {ok: true; acceptance: ArtifactAcceptance}
  | {ok: false; code: string; detail: string};

function reject(code: string, detail: string): AcceptanceResult {
  return {ok: false, code, detail};
}

/**
 * Read the ordered parent tuple off a parsed candidate. The candidate carries
 * `expectedParentBindings` as an ordered array of {name, contentHash}. We verify the
 * names/order/nullability match the route rule exactly.
 */
function verifyParents(
  rule: RouteRule,
  candidate: Record<string, unknown>,
): {ok: true; observed: ObservedParent[]} | {ok: false; detail: string} {
  const raw = candidate['expectedParentBindings'];
  if (!Array.isArray(raw)) return {ok: false, detail: 'expectedParentBindings missing or not an array'};
  if (raw.length !== rule.expectedParents.length) {
    return {ok: false, detail: `parent count ${raw.length} != ${rule.expectedParents.length}`};
  }
  const observed: ObservedParent[] = [];
  for (let i = 0; i < rule.expectedParents.length; i++) {
    const spec = rule.expectedParents[i]!;
    const entry = raw[i] as {name?: unknown; contentHash?: unknown} | undefined;
    if (!entry || entry.name !== spec.name) {
      return {ok: false, detail: `parent[${i}] name mismatch: expected ${spec.name}`};
    }
    const hash = entry.contentHash;
    if (hash === null) {
      if (!spec.nullable) return {ok: false, detail: `parent ${spec.name} may not be null`};
      observed.push({name: spec.name, contentHash: null});
    } else if (typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)) {
      observed.push({name: spec.name, contentHash: hash});
    } else {
      return {ok: false, detail: `parent ${spec.name} has a non-hash value`};
    }
  }
  return {ok: true, observed};
}

/**
 * Accept a candidate for its route. Returns a typed result; a verification failure
 * is `ok:false` (not a throw), matching acceptance's refuse-don't-repair contract.
 */
export function acceptArtifact(anchor: RepoRootAnchor, input: AcceptanceInput): AcceptanceResult {
  const rule = routeRule(input.acceptanceRouteId);
  if (!rule) return reject('ACCEPTANCE_ROUTE_UNKNOWN', input.acceptanceRouteId);
  if (!WIRED_ROUTES.has(input.acceptanceRouteId)) {
    return reject('ACCEPTANCE_ROUTE_NOT_IMPLEMENTED', input.acceptanceRouteId);
  }

  // 1. Reload the exact candidate bytes through the anchored no-follow read path.
  let bytes: string;
  try {
    bytes = readFileUnderRoot(anchor, input.candidatePath);
  } catch (err) {
    return reject('ACCEPTANCE_READ_FAILED', (err as Error).message);
  }

  // 2. Rehash and verify against the Ledger capture and actual EOF length.
  const contentHash = sha256Hex(bytes);
  const byteLength = Buffer.byteLength(bytes, 'utf8');
  if (contentHash !== input.capturedByteHash) {
    return reject('ACCEPTANCE_HASH_MISMATCH', `${contentHash} != ${input.capturedByteHash}`);
  }
  if (byteLength !== input.capturedByteLength) {
    return reject('ACCEPTANCE_LENGTH_MISMATCH', `${byteLength} != ${input.capturedByteLength}`);
  }

  // 3. Independently re-run the applicable candidate budget from the reloaded bytes.
  const budget = budgetForRoute(input.acceptanceRouteId);
  const budgetResult = enforceCandidateBudget(bytes, budget);
  if (!budgetResult.ok) {
    return reject('ACCEPTANCE_BUDGET_REFUSED', `${budgetResult.code} ${budgetResult.detail}`);
  }

  // 4. Parse (bytes are already budget-verified) and check identity fields.
  let candidate: Record<string, unknown>;
  try {
    candidate = JSON.parse(bytes) as Record<string, unknown>;
  } catch (err) {
    return reject('ACCEPTANCE_PARSE_FAILED', (err as Error).message);
  }
  if (candidate['schemaVersion'] !== rule.expectedSchemaVersion) {
    return reject('ACCEPTANCE_SCHEMA_MISMATCH', `${String(candidate['schemaVersion'])} != ${rule.expectedSchemaVersion}`);
  }
  if (candidate['artifactKind'] !== rule.artifactKind) {
    return reject('ACCEPTANCE_KIND_MISMATCH', String(candidate['artifactKind']));
  }
  if (candidate['semanticProducer'] !== rule.semanticProducer) {
    return reject('ACCEPTANCE_PRODUCER_MISMATCH', String(candidate['semanticProducer']));
  }
  if (candidate['projectId'] !== input.projectId) {
    return reject('ACCEPTANCE_PROJECT_MISMATCH', String(candidate['projectId']));
  }
  const candRevision = candidate['revisionId'] ?? null;
  if (candRevision !== input.revisionId) {
    return reject('ACCEPTANCE_REVISION_MISMATCH', `${String(candRevision)} != ${String(input.revisionId)}`);
  }
  if (candidate['artifactPath'] !== input.candidatePath) {
    return reject('ACCEPTANCE_PATH_MISMATCH', String(candidate['artifactPath']));
  }
  // acceptanceContext.acceptanceRouteId + successState must match the rule.
  const ctx = candidate['acceptanceContext'] as {acceptanceRouteId?: unknown; successState?: unknown} | undefined;
  if (!ctx || ctx.acceptanceRouteId !== input.acceptanceRouteId || ctx.successState !== rule.successState) {
    return reject('ACCEPTANCE_CONTEXT_MISMATCH', JSON.stringify(ctx));
  }

  // 5. Verify the exact ordered parent tuple.
  const parents = verifyParents(rule, candidate);
  if (!parents.ok) return reject('ACCEPTANCE_PARENTS_INVALID', parents.detail);

  // 6. Emit ArtifactAcceptance@1. contentHash === candidateByteHash; never inserted
  //    back into the semantic artifact.
  const acceptance: ArtifactAcceptance = {
    schemaVersion: 'artifact-acceptance@1',
    contractVersion: 'artifact-acceptance@1',
    artifactPath: input.candidatePath,
    projectId: input.projectId,
    revisionId: input.revisionId,
    artifactKind: rule.artifactKind,
    semanticProducer: rule.semanticProducer,
    expectedSchemaVersion: rule.expectedSchemaVersion,
    acceptanceRouteId: input.acceptanceRouteId,
    successState: rule.successState,
    candidateByteHash: input.capturedByteHash,
    contentHash,
    byteLength,
    producerDecisionHash: input.producerDecisionHash,
    producerPromptPath: input.promptBinding?.promptPath ?? null,
    producerPromptHash: input.promptBinding?.promptHash ?? null,
    observedParentBindings: parents.observed,
  };
  return {ok: true, acceptance};
}
