import {mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {
  anchorRepoRoot,
  buildNextEvent,
  reduce,
  type LedgerEvent,
  type LedgerEventBindingProjection,
  type RepoRootAnchor,
} from '../../src/engine/ledger/index.js';
import {sha256Jcs} from '../../src/engine/ledger/hash.js';
import {projectDurableInstructionText} from '../../src/engine/ledger/redaction.js';
import {snapshotCoreRegistry, validateInitialSourceSet, type InitialSourceSet} from '../../src/engine/registry/index.js';

const realRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('snapshotCoreRegistry — against the real checked-in registry', () => {
  it('validates catalog/core-registry.json and emits a stable hash', () => {
    const anchor = anchorRepoRoot(realRepoRoot);
    const result = snapshotCoreRegistry(anchor);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.registrySnapshotHash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.capabilityIds).toHaveLength(10);
      expect(result.capabilityIds).toContain('core.camera.global-2d');
    }
  });

  it('is deterministic (same hash on repeated snapshot)', () => {
    const anchor = anchorRepoRoot(realRepoRoot);
    const a = snapshotCoreRegistry(anchor);
    const b = snapshotCoreRegistry(anchor);
    expect(a.ok && b.ok && a.registrySnapshotHash === b.registrySnapshotHash).toBe(true);
  });
});

describe('snapshotCoreRegistry — refusals on a tampered copy', () => {
  let root: string;
  let anchor: RepoRootAnchor;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'reg-'));
    anchor = anchorRepoRoot(root);
    mkdirSync(join(root, 'catalog'), {recursive: true});
  });
  afterEach(() => rmSync(root, {recursive: true, force: true}));

  function writeRegistry(mutate: (r: Record<string, unknown>) => void): void {
    const raw = JSON.parse(readFileSync(join(realRepoRoot, 'catalog', 'core-registry.json'), 'utf8')) as Record<string, unknown>;
    mutate(raw);
    writeFileSync(join(root, 'catalog', 'core-registry.json'), JSON.stringify(raw));
  }

  it('refuses an unknown core capability id', () => {
    writeRegistry((r) => {
      (r.capabilities as Array<Record<string, unknown>>)[0]!.id = 'core.effect.not-real';
    });
    expect(snapshotCoreRegistry(anchor)).toMatchObject({ok: false, code: 'REGISTRY_UNKNOWN_CORE_ID'});
  });

  it('refuses a missing core capability', () => {
    writeRegistry((r) => {
      (r.capabilities as unknown[]).pop();
    });
    expect(snapshotCoreRegistry(anchor)).toMatchObject({ok: false, code: 'REGISTRY_MISSING_CORE_ID'});
  });

  it('refuses a bad SemVer', () => {
    writeRegistry((r) => {
      (r.capabilities as Array<Record<string, unknown>>)[0]!.version = 'v1.0';
    });
    expect(snapshotCoreRegistry(anchor)).toMatchObject({ok: false, code: 'REGISTRY_SEMVER'});
  });

  it('refuses a non-core scope', () => {
    writeRegistry((r) => {
      r.scope = 'project';
    });
    expect(snapshotCoreRegistry(anchor)).toMatchObject({ok: false, code: 'REGISTRY_SCOPE_NOT_CORE'});
  });

  it('refuses a non-null parent on a core snapshot', () => {
    writeRegistry((r) => {
      r.parentSnapshotHash = 'a'.repeat(64);
    });
    expect(snapshotCoreRegistry(anchor)).toMatchObject({ok: false, code: 'REGISTRY_CORE_HAS_PARENT'});
  });
});

describe('validateInitialSourceSet', () => {
  const H = (c: string) => c.repeat(64);
  const registrySnapshot = H('9');

  function baseSet(overrides: Partial<InitialSourceSet> = {}): InitialSourceSet {
    return {
      disposition: 'initial-source-set',
      currentRevisionId: null,
      briefHash: H('1'),
      treatmentHash: H('2'),
      motionSpecHash: H('3'),
      catalogRegistrySnapshotHash: H('4'),
      capabilityRegistrySnapshotHash: registrySnapshot,
      capabilityReceiptSetHash: H('5'),
      treatmentObservedBriefHash: H('1'),
      motionObservedBriefHash: H('1'),
      motionObservedTreatmentHash: H('2'),
      motionObservedCapabilityRegistryHash: registrySnapshot,
      ...overrides,
    };
  }

  it('accepts a coherent initial source set and continues to SNAPSHOT', () => {
    const r = validateInitialSourceSet(baseSet());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.continuationState).toBe('SNAPSHOT');
      expect(r.receipt.disposition).toBe('initial-source-set');
      expect(r.validationReceiptHash).toBe(sha256Jcs(r.receipt));
    }
  });

  it('refuses when the treatment does not bind the accepted brief', () => {
    const r = validateInitialSourceSet(baseSet({treatmentObservedBriefHash: H('f')}));
    expect(r).toMatchObject({ok: false, code: 'VALIDATION_TREATMENT_BRIEF_MISMATCH'});
  });

  it('refuses when the motion-spec does not bind the accepted treatment', () => {
    const r = validateInitialSourceSet(baseSet({motionObservedTreatmentHash: H('f')}));
    expect(r).toMatchObject({ok: false, code: 'VALIDATION_MOTION_TREATMENT_MISMATCH'});
  });

  it('refuses when the motion-spec binds a different capability registry snapshot', () => {
    const r = validateInitialSourceSet(baseSet({motionObservedCapabilityRegistryHash: H('f')}));
    expect(r).toMatchObject({ok: false, code: 'VALIDATION_MOTION_REGISTRY_MISMATCH'});
  });

  it('refuses a current revision on an initial set', () => {
    const r = validateInitialSourceSet(baseSet({currentRevisionId: 'rev-0001' as unknown as null}));
    expect(r).toMatchObject({ok: false, code: 'VALIDATION_UNEXPECTED_REVISION'});
  });
});

describe('ledger reducer VALIDATE → SNAPSHOT on validation success', () => {
  function next(
    prev: LedgerEvent | null,
    eventKind: LedgerEventBindingProjection['eventKind'],
    payload: LedgerEventBindingProjection['payload'],
  ): LedgerEvent {
    const binding: LedgerEventBindingProjection = {
      schemaVersion: 'workflow-ledger-event@1',
      sequence: prev ? prev.sequence + 1 : 1,
      projectId: 'world-cup',
      requestId: 'request-0001',
      previousEventHash: prev ? prev.eventHash : null,
      eventKind,
      payload,
    };
    return buildNextEvent(binding, prev, reduce);
  }

  it('moves ready@VALIDATE to ready@SNAPSHOT on an initial-source-set validation', () => {
    let prev: LedgerEvent | null = null;
    prev = next(prev, 'project-initialized', {requestedProjectId: null, allocatedProjectId: 'world-cup'});
    prev = next(prev, 'invocation-received', {
      requestClass: 'new-project',
      trustedHostId: 'claude-code',
      sourceUserInstruction: projectDurableInstructionText('x'),
      suppliedLocalPathCount: 0,
      suppliedLocatorSetHash: null,
      invocationEnvelopeHash: 'a'.repeat(64),
    });
    // Advance all the way to VALIDATE via producer-free advances.
    const edges: Array<[string, string]> = [
      ['INTAKE', 'FACT_CHECK'],
      ['FACT_CHECK', 'BRIEF'],
      ['BRIEF', 'TREATMENT'],
      ['TREATMENT', 'MOTION_SPEC'],
      ['MOTION_SPEC', 'VALIDATE'],
    ];
    for (const [from, to] of edges) {
      prev = next(prev, 'decision-recorded', {decision: {kind: 'advance', fromState: from, toState: to}});
    }
    expect(prev.stateAfter.control).toEqual({kind: 'ready', state: 'VALIDATE'});

    // Fire the source-validation success.
    prev = next(prev, 'interface-result-recorded', {
      actionId: 'action-0001',
      validation: {
        disposition: 'initial-source-set',
        fromState: 'VALIDATE',
        continuationState: 'SNAPSHOT',
        validationReceiptHash: 'e'.repeat(64),
      },
    });
    expect(prev.stateAfter.control).toEqual({kind: 'ready', state: 'SNAPSHOT'});
  });

  it('refuses a validation result fired from a non-VALIDATE state', () => {
    let prev: LedgerEvent | null = null;
    prev = next(prev, 'project-initialized', {requestedProjectId: null, allocatedProjectId: 'world-cup'});
    prev = next(prev, 'invocation-received', {
      requestClass: 'new-project',
      trustedHostId: 'claude-code',
      sourceUserInstruction: projectDurableInstructionText('x'),
      suppliedLocalPathCount: 0,
      suppliedLocatorSetHash: null,
      invocationEnvelopeHash: 'a'.repeat(64),
    });
    const pending = prev;
    expect(() =>
      next(pending, 'interface-result-recorded', {
        actionId: 'action-0001',
        validation: {
          disposition: 'initial-source-set',
          fromState: 'INTAKE',
          continuationState: 'SNAPSHOT',
          validationReceiptHash: 'e'.repeat(64),
        },
      }),
    ).toThrow(/VALIDATE_STATE|VALIDATE_FROM/);
  });
});
