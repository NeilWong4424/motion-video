import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema} from '../../src/contracts/treatment.js';
import {resolveMotion} from '../../src/engine/resolver/resolve-motion.js';
import {compileMotion} from '../../src/engine/compiler/compile-motion.js';
import {validateRenderPlan} from '../../src/engine/compiler/validate-render-plan.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';
import {engineBuildIdentity} from '../../src/generated/engine-build-manifest.js';
import {sha256Canonical} from '../../src/engine/hash.js';
import {FakeLayoutService} from '../resolver/fake-layout-service.js';

function loadMotion(): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'), 'utf8')),
  );
}

function buildIr() {
  const brief = BriefSpecSchema.parse({
    schemaVersion: 'brief@1', projectId: 'valid-continuity', title: 'T', language: 'en',
    goal: 'g', audience: 'a', message: 'm', canvas: {width: 1920, height: 1080, fps: 30},
    durationSeconds: 15, facts: [], suppliedAssetIds: [], constraints: [], prohibitedContent: [], assumptions: [],
  });
  const treatment = TreatmentSpecSchema.parse({
    schemaVersion: 'treatment@1', projectId: 'valid-continuity', briefHash: '0'.repeat(64), message: 'm',
    narrativeArc: 'arc', continuityPolicy: 'seamless-default', compositionMode: 'persistent-stage',
    motionProfile: 'editorial', stylePackId: 'styles/test-neutral@1.0.0', visualThesis: 't', copyStrategy: 'c',
    transitionVocabulary: ['shared-element', 'camera-navigation'], chapterCutBudget: 0,
    beatIntentions: [{id: 'bi-1', objective: 'o', message: 'm'}], adjacentIntentionPairs: [],
  });
  const result = resolveMotion({brief, treatment, motion: loadMotion(), layout: new FakeLayoutService(), registry: createCoreRegistry()});
  expect(result.ir).not.toBeNull();
  return result.ir!;
}

describe('compileMotion', () => {
  it('compiles a valid IR into a RenderPlan with matching duration and node keys', () => {
    const ir = buildIr();
    const plan = compileMotion(ir, engineBuildIdentity);
    expect(plan.durationInFrames).toBe(ir.durationInFrames);
    expect(plan.camera.id).toBe('main-camera');
    expect(plan.nodes).toHaveLength(ir.nodes.length);
    expect(new Set(plan.nodes.map((n) => n.key)).size).toBe(ir.nodes.length);
    expect(JSON.stringify(plan)).not.toContain('Sequence');
  });

  it('is deterministic', () => {
    const ir = buildIr();
    expect(sha256Canonical(compileMotion(ir, engineBuildIdentity))).toBe(
      sha256Canonical(compileMotion(ir, engineBuildIdentity)),
    );
  });

  it('produces a RenderPlan with no validation errors', () => {
    const ir = buildIr();
    const plan = compileMotion(ir, engineBuildIdentity);
    expect(validateRenderPlan(plan)).toEqual([]);
  });

  it('embeds the engine build identity and both output profiles', () => {
    const ir = buildIr();
    const plan = compileMotion(ir, engineBuildIdentity);
    expect(plan.build.runtimeImplementationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(plan.profiles.preview.crf).toBe(28);
    expect(plan.profiles.final.crf).toBe(18);
    expect(plan.profiles.final.width).toBe(1920);
  });
});
