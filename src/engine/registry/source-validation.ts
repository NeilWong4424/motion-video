/**
 * canonical-source-hashing-and-validation — the VALIDATE-stage cross-artifact check.
 *
 * Per `agent/contracts/engine-interface.md`, the source validator is a LATER
 * cross-artifact check (not the first identity producer). It verifies an already
 * accepted source set is coherent and emits a no-self-hash ValidationReceipt plus
 * exactly one disposition-specific continuation:
 *   - initial-source-set          → SNAPSHOT
 *   - accepted-rebuild-candidates  → APPLY_SEMANTIC_REVISION
 *   - committed-current-revision   → RESOLVE
 *
 * Build scope: the `initial-source-set` disposition is implemented (Brief +
 * Treatment + MotionSpec accepted, no current revision → SNAPSHOT). The other two
 * dispositions are refused loudly (they depend on the revision/commit machinery
 * built in a later slice). The validator checks cross-parent consistency: the
 * Treatment must bind the exact accepted Brief hash, and the MotionSpec must bind the
 * exact accepted Brief + Treatment + registry-snapshot hashes.
 */

import {sha256Jcs} from '../ledger/hash.js';

export type ValidationDisposition =
  | 'initial-source-set'
  | 'accepted-rebuild-candidates'
  | 'committed-current-revision';

/** The accepted source identities the validator cross-checks (initial-source-set). */
export type InitialSourceSet = {
  disposition: 'initial-source-set';
  currentRevisionId: null;
  briefHash: string;
  treatmentHash: string;
  motionSpecHash: string;
  catalogRegistrySnapshotHash: string;
  capabilityRegistrySnapshotHash: string;
  capabilityReceiptSetHash: string;
  /** Parent bindings observed on each accepted artifact (from its acceptance). */
  treatmentObservedBriefHash: string;
  motionObservedBriefHash: string;
  motionObservedTreatmentHash: string;
  motionObservedCapabilityRegistryHash: string;
};

export type ValidationReceipt = {
  schemaVersion: 'validation-receipt@1';
  disposition: ValidationDisposition;
  revisionId: string | null;
  validatedSourceHashes: {
    briefHash: string;
    treatmentHash: string;
    motionSpecHash: string;
    catalogRegistrySnapshotHash: string;
    capabilityRegistrySnapshotHash: string;
    capabilityReceiptSetHash: string;
  };
  continuationState: string;
};

export type ValidationOk = {
  ok: true;
  disposition: ValidationDisposition;
  continuationState: string;
  receipt: ValidationReceipt;
  validationReceiptHash: string;
};
export type ValidationFail = {ok: false; code: string; detail: string};
export type ValidationResult = ValidationOk | ValidationFail;

const HASH_RE = /^[a-f0-9]{64}$/;

function fail(code: string, detail: string): ValidationFail {
  return {ok: false, code, detail};
}

/**
 * Validate an initial source set. All identities must be well-formed hashes, the
 * cross-parent bindings must be exactly consistent, and there must be no current
 * revision. On success the disposition continuation is SNAPSHOT.
 */
export function validateInitialSourceSet(set: InitialSourceSet): ValidationResult {
  if (set.disposition !== 'initial-source-set') {
    return fail('VALIDATION_DISPOSITION_NOT_IMPLEMENTED', String(set.disposition));
  }
  if (set.currentRevisionId !== null) {
    return fail('VALIDATION_UNEXPECTED_REVISION', 'initial set requires currentRevisionId=null');
  }

  const hashes: Array<[string, string]> = [
    ['briefHash', set.briefHash],
    ['treatmentHash', set.treatmentHash],
    ['motionSpecHash', set.motionSpecHash],
    ['catalogRegistrySnapshotHash', set.catalogRegistrySnapshotHash],
    ['capabilityRegistrySnapshotHash', set.capabilityRegistrySnapshotHash],
    ['capabilityReceiptSetHash', set.capabilityReceiptSetHash],
  ];
  for (const [name, h] of hashes) {
    if (!HASH_RE.test(h)) return fail('VALIDATION_BAD_HASH', `${name}=${h}`);
  }

  // Cross-parent consistency: the Treatment binds the exact accepted Brief, and the
  // MotionSpec binds the exact accepted Brief + Treatment + capability registry.
  if (set.treatmentObservedBriefHash !== set.briefHash) {
    return fail('VALIDATION_TREATMENT_BRIEF_MISMATCH', `${set.treatmentObservedBriefHash} != ${set.briefHash}`);
  }
  if (set.motionObservedBriefHash !== set.briefHash) {
    return fail('VALIDATION_MOTION_BRIEF_MISMATCH', `${set.motionObservedBriefHash} != ${set.briefHash}`);
  }
  if (set.motionObservedTreatmentHash !== set.treatmentHash) {
    return fail('VALIDATION_MOTION_TREATMENT_MISMATCH', `${set.motionObservedTreatmentHash} != ${set.treatmentHash}`);
  }
  if (set.motionObservedCapabilityRegistryHash !== set.capabilityRegistrySnapshotHash) {
    return fail(
      'VALIDATION_MOTION_REGISTRY_MISMATCH',
      `${set.motionObservedCapabilityRegistryHash} != ${set.capabilityRegistrySnapshotHash}`,
    );
  }

  const receipt: ValidationReceipt = {
    schemaVersion: 'validation-receipt@1',
    disposition: 'initial-source-set',
    revisionId: null,
    validatedSourceHashes: {
      briefHash: set.briefHash,
      treatmentHash: set.treatmentHash,
      motionSpecHash: set.motionSpecHash,
      catalogRegistrySnapshotHash: set.catalogRegistrySnapshotHash,
      capabilityRegistrySnapshotHash: set.capabilityRegistrySnapshotHash,
      capabilityReceiptSetHash: set.capabilityReceiptSetHash,
    },
    continuationState: 'SNAPSHOT',
  };
  return {
    ok: true,
    disposition: 'initial-source-set',
    continuationState: 'SNAPSHOT',
    receipt,
    // validationReceiptHash is SHA-256 over the JCS bytes of the no-self-hash receipt.
    validationReceiptHash: sha256Jcs(receipt),
  };
}
