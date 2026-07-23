import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {TreatmentSpecSchema, type TreatmentSpec} from '../../src/contracts/treatment.js';
import {validateContinuity} from '../../src/engine/resolver/validate-continuity.js';
import {codes} from '../../src/engine/resolver/continuity-diagnostics.js';

function loadSpec(name: string): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', `${name}.json`), 'utf8')),
  );
}

function treatment(overrides: Partial<TreatmentSpec> = {}): TreatmentSpec {
  return TreatmentSpecSchema.parse({
    schemaVersion: 'treatment@1',
    projectId: 'valid-continuity',
    briefHash: '0'.repeat(64),
    message: 'm',
    narrativeArc: 'arc',
    continuityPolicy: 'seamless-default',
    compositionMode: 'persistent-stage',
    motionProfile: 'editorial',
    stylePackId: 'styles/test-neutral@1.0.0',
    visualThesis: 'thesis',
    copyStrategy: 'copy',
    transitionVocabulary: ['shared-element', 'camera-navigation'],
    chapterCutBudget: 0,
    beatIntentions: [{id: 'bi-1', objective: 'o', message: 'm'}],
    adjacentIntentionPairs: [],
    ...overrides,
  });
}

describe('valid continuity', () => {
  it('produces no diagnostics for a seamless three-beat film', () => {
    const spec = loadSpec('valid-continuity');
    const errors = validateContinuity(treatment(), spec).filter((d) => d.severity === 'error');
    expect(codes(errors)).toEqual([]);
  });
});
