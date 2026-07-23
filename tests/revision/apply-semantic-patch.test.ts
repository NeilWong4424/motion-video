import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema, type BriefSpec} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema, type TreatmentSpec} from '../../src/contracts/treatment.js';
import {applySemanticPatch} from '../../src/engine/revision/apply-semantic-patch.js';
import {sha256Canonical} from '../../src/engine/hash.js';
import type {SemanticPatch} from '../../src/contracts/revision.js';

function loadMotion(): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'), 'utf8')),
  );
}

function brief(): BriefSpec {
  return BriefSpecSchema.parse({
    schemaVersion: 'brief@1', projectId: 'valid-continuity', title: 'T', language: 'en',
    goal: 'g', audience: 'a', message: 'm', canvas: {width: 1920, height: 1080, fps: 30},
    durationSeconds: 15, facts: [], suppliedAssetIds: [], constraints: [], prohibitedContent: [], assumptions: [],
  });
}
function treatment(): TreatmentSpec {
  return TreatmentSpecSchema.parse({
    schemaVersion: 'treatment@1', projectId: 'valid-continuity', briefHash: '0'.repeat(64), message: 'm',
    narrativeArc: 'arc', continuityPolicy: 'seamless-default', compositionMode: 'persistent-stage',
    motionProfile: 'editorial', stylePackId: 'styles/test-neutral@1.0.0', visualThesis: 't', copyStrategy: 'c',
    transitionVocabulary: ['shared-element', 'camera-navigation'], chapterCutBudget: 0,
    beatIntentions: [{id: 'bi-1', objective: 'o', message: 'm'}], adjacentIntentionPairs: [],
  });
}

function baseSource() {
  return {brief: brief(), treatment: treatment(), motion: loadMotion()};
}

function patchFor(source: ReturnType<typeof baseSource>, overrides: Partial<SemanticPatch>): SemanticPatch {
  return {
    mode: 'bounded',
    baseRevisionId: 'rev-0001',
    expectedSourceHashes: {
      brief: sha256Canonical(source.brief),
      treatment: sha256Canonical(source.treatment),
      motion: sha256Canonical(source.motion),
    },
    operations: [],
    declaredImpactSet: [],
    reason: 'test',
    sourceUserInstruction: 'change the hero copy',
    ...overrides,
  } as SemanticPatch;
}

describe('applySemanticPatch', () => {
  it('applies a replace-copy op and reports the node in the diff', () => {
    const source = baseSource();
    const patch = patchFor(source, {
      operations: [{op: 'replace-copy', nodeId: 'hero', value: 'Renamed'}],
      declaredImpactSet: [{entity: 'node', id: 'hero'}],
    });
    const result = applySemanticPatch({source, patch, activeLocks: []});
    expect(result.ok).toBe(true);
    if (result.ok) {
      const hero = result.next.motion.world.nodes.find((n) => n.id === 'hero')!;
      expect((hero.renderer.props as {text: string}).text).toBe('Renamed');
      expect(result.diff).toContainEqual({entity: 'node', id: 'hero'});
    }
  });

  it('rejects a stale base hash', () => {
    const source = baseSource();
    const patch = patchFor(source, {
      expectedSourceHashes: {brief: 'a'.repeat(64), treatment: 'b'.repeat(64), motion: 'c'.repeat(64)},
      operations: [{op: 'replace-copy', nodeId: 'hero', value: 'x'}],
      declaredImpactSet: [{entity: 'node', id: 'hero'}],
    });
    const result = applySemanticPatch({source, patch, activeLocks: []});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.map((d) => d.code)).toContain('PATCH_BASE_HASH_MISMATCH');
  });

  it('enforces a lock against the actual diff', () => {
    const source = baseSource();
    const patch = patchFor(source, {
      operations: [{op: 'replace-copy', nodeId: 'hero', value: 'x'}],
      declaredImpactSet: [{entity: 'node', id: 'hero'}],
    });
    const result = applySemanticPatch({source, patch, activeLocks: [{entity: 'node', id: 'hero'}]});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.map((d) => d.code)).toContain('SEMANTIC_LOCK_VIOLATION');
  });

  it('requires the changed entity in the declared impact set', () => {
    const source = baseSource();
    const patch = patchFor(source, {
      operations: [{op: 'replace-copy', nodeId: 'hero', value: 'x'}],
      declaredImpactSet: [],
    });
    const result = applySemanticPatch({source, patch, activeLocks: []});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.map((d) => d.code)).toContain('IMPACT_SET_INCOMPLETE');
  });

  it('rejects a whole-artifact replacement in bounded mode via schema', () => {
    const source = baseSource();
    expect(() =>
      applySemanticPatch({
        source,
        patch: patchFor(source, {
          operations: [{op: 'replace-brief', value: brief()}],
          declaredImpactSet: [{entity: 'brief', id: 'valid-continuity'}],
        }),
        activeLocks: [],
      }),
    ).toThrow(/WHOLE_REPLACEMENT_REQUIRES_REBUILD/);
  });
});
