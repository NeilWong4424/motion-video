import {SemanticPatchSchema, type SemanticPatch, type SemanticLockTarget} from '../../contracts/revision.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';
import {sha256Canonical} from '../hash.js';
import {applyOperations, type SourceSet} from './apply-operations.js';
import {semanticDiff, targetKey} from './semantic-diff.js';

export type ApplyPatchInput = {
  source: SourceSet;
  patch: SemanticPatch;
  activeLocks: readonly SemanticLockTarget[];
};

export type ApplyPatchResult =
  | {ok: true; next: SourceSet; diff: SemanticLockTarget[]}
  | {ok: false; diagnostics: Diagnostic[]};

/**
 * Validate and apply a SemanticPatch. Rechecks expected source hashes, applies
 * operations, computes the actual semantic diff, enforces active locks against
 * that diff, and requires every changed entity to appear in the declared impact
 * set. Whole-artifact replacements are legal only in rebuild mode.
 */
export function applySemanticPatch(input: ApplyPatchInput): ApplyPatchResult {
  const diagnostics: Diagnostic[] = [];
  const patch = SemanticPatchSchema.parse(input.patch);

  // Expected source hashes must match the current source.
  const current = {
    brief: sha256Canonical(input.source.brief),
    treatment: sha256Canonical(input.source.treatment),
    motion: sha256Canonical(input.source.motion),
  };
  if (
    current.brief !== patch.expectedSourceHashes.brief ||
    current.treatment !== patch.expectedSourceHashes.treatment ||
    current.motion !== patch.expectedSourceHashes.motion
  ) {
    return {ok: false, diagnostics: [errorDiagnostic('PATCH_BASE_HASH_MISMATCH')]};
  }

  let next: SourceSet;
  try {
    next = applyOperations(input.source, patch.operations);
  } catch (error) {
    return {ok: false, diagnostics: [errorDiagnostic('PATCH_OPERATION_FAILED', {evidence: String(error)})]};
  }

  const diff = semanticDiff(input.source, next);

  // Lock enforcement against the ACTUAL diff. A locked entity that changed and is
  // not being explicitly unlocked in this patch is a violation.
  const removedLocks = new Set(
    patch.operations.filter((o) => o.op === 'remove-lock').map((o) => targetKey(o.target)),
  );
  const lockedKeys = new Set(input.activeLocks.map(targetKey));
  for (const change of diff) {
    const key = targetKey(change);
    // A lock on the entity (with or without a field) blocks any change to it.
    const entityLocked = [...lockedKeys].some(
      (lk) => lk === key || lk.startsWith(`${change.entity}:${change.id}`),
    );
    if (entityLocked && !removedLocks.has(key) && !removedLocks.has(`${change.entity}:${change.id}`)) {
      diagnostics.push(errorDiagnostic('SEMANTIC_LOCK_VIOLATION', {evidence: key}));
    }
  }

  // Impact-set completeness: every changed entity must be declared.
  const declared = new Set(input.patch.declaredImpactSet.map(targetKey));
  for (const change of diff) {
    const key = targetKey(change);
    const declaredForEntity = [...declared].some(
      (d) => d === key || d === `${change.entity}:${change.id}`,
    );
    if (!declaredForEntity) {
      diagnostics.push(errorDiagnostic('IMPACT_SET_INCOMPLETE', {evidence: key}));
    }
  }

  if (diagnostics.length > 0) {
    return {ok: false, diagnostics};
  }

  return {ok: true, next, diff};
}
