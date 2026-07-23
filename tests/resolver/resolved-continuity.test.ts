import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema, type BriefSpec} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema, type TreatmentSpec} from '../../src/contracts/treatment.js';
import {resolveMotion} from '../../src/engine/resolver/resolve-motion.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';
import {sha256Canonical} from '../../src/engine/hash.js';
import {FakeLayoutService} from './fake-layout-service.js';

function loadMotion(): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'), 'utf8')),
  );
}

function brief(durationSeconds: number): BriefSpec {
  return BriefSpecSchema.parse({
    schemaVersion: 'brief@1',
    projectId: 'valid-continuity',
    title: 'T',
    language: 'en',
    goal: 'g',
    audience: 'a',
    message: 'm',
    canvas: {width: 1920, height: 1080, fps: 30},
    durationSeconds,
    facts: [],
    suppliedAssetIds: [],
    constraints: [],
    prohibitedContent: [],
    assumptions: [],
  });
}

function treatment(): TreatmentSpec {
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
    visualThesis: 't',
    copyStrategy: 'c',
    transitionVocabulary: ['shared-element', 'camera-navigation'],
    chapterCutBudget: 0,
    beatIntentions: [{id: 'bi-1', objective: 'o', message: 'm'}],
    adjacentIntentionPairs: [],
  });
}

// valid-continuity has beats 120+150+120 = 390 and bridges 30+30 = 60 -> 450 frames.
const EXPECTED_FRAMES = 450;
const DURATION_SECONDS = EXPECTED_FRAMES / 30; // 15s

describe('resolveMotion', () => {
  it('resolves the valid fixture to an IR with no error diagnostics', () => {
    const result = resolveMotion({
      brief: brief(DURATION_SECONDS),
      treatment: treatment(),
      motion: loadMotion(),
      layout: new FakeLayoutService(),
      registry: createCoreRegistry(),
    });
    const errors = result.diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
    expect(result.ir).not.toBeNull();
    expect(result.ir!.durationInFrames).toBe(EXPECTED_FRAMES);
  });

  it('flags a duration mismatch against the brief', () => {
    const result = resolveMotion({
      brief: brief(10),
      treatment: treatment(),
      motion: loadMotion(),
      layout: new FakeLayoutService(),
      registry: createCoreRegistry(),
    });
    expect(result.ir).toBeNull();
    expect(result.diagnostics.map((d) => d.code)).toContain('DURATION_MISMATCH');
  });

  it('is deterministic: identical inputs produce an identical IR hash', () => {
    const input = {
      brief: brief(DURATION_SECONDS),
      treatment: treatment(),
      motion: loadMotion(),
      layout: new FakeLayoutService(),
      registry: createCoreRegistry(),
    };
    const a = resolveMotion(input);
    const b = resolveMotion(input);
    expect(sha256Canonical(a.ir)).toBe(sha256Canonical(b.ir));
  });

  it('preserves unique node ids in the IR', () => {
    const result = resolveMotion({
      brief: brief(DURATION_SECONDS),
      treatment: treatment(),
      motion: loadMotion(),
      layout: new FakeLayoutService(),
      registry: createCoreRegistry(),
    });
    const ids = result.ir!.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
