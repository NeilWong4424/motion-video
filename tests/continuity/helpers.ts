import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {TreatmentSpecSchema, type TreatmentSpec} from '../../src/contracts/treatment.js';

export function loadSpec(name: string): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', `${name}.json`), 'utf8')),
  );
}

export function makeTreatment(overrides: Partial<TreatmentSpec> = {}): TreatmentSpec {
  return TreatmentSpecSchema.parse({
    schemaVersion: 'treatment@1',
    projectId: 'p',
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
    chapterCutBudget: 1,
    beatIntentions: [{id: 'bi-1', objective: 'o', message: 'm'}],
    adjacentIntentionPairs: [],
    ...overrides,
  });
}
