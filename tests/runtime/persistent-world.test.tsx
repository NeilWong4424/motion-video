import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import * as React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema} from '../../src/contracts/treatment.js';
import {resolveMotion} from '../../src/engine/resolver/resolve-motion.js';
import {compileMotion} from '../../src/engine/compiler/compile-motion.js';
import {PersistentWorld} from '../../src/engine/runtime/PersistentWorld.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';
import {engineBuildIdentity} from '../../src/generated/engine-build-manifest.js';
import {FakeLayoutService} from '../resolver/fake-layout-service.js';

function loadMotion(): MotionSpec {
  return MotionSpecSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'), 'utf8')),
  );
}

function buildPlan() {
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
  return compileMotion(result.ir!, engineBuildIdentity);
}

describe('PersistentWorld runtime', () => {
  it('keeps each node mounted with a stable root across frame updates', () => {
    const plan = buildPlan();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<PersistentWorld plan={plan} frame={0} />);
    });

    const heroBefore = renderer.root.findByProps({'data-node-id': 'hero'});
    const instanceBefore = heroBefore.instance;

    // Advance across the first bridge boundary (frame ~130) and to a later beat.
    act(() => {
      renderer.update(<PersistentWorld plan={plan} frame={130} />);
    });
    act(() => {
      renderer.update(<PersistentWorld plan={plan} frame={300} />);
    });

    const heroAfter = renderer.root.findByProps({'data-node-id': 'hero'});
    expect(heroAfter.instance).toBe(instanceBefore);

    act(() => {
      renderer.unmount();
    });
  });

  it('mounts every plan node regardless of frame (no beat filtering)', () => {
    const plan = buildPlan();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<PersistentWorld plan={plan} frame={0} />);
    });
    // Both hero and card nodes are present even at frame 0.
    const nodeHosts = renderer.root.findAll((n) => n.props['data-node-id'] !== undefined);
    const ids = new Set(nodeHosts.map((n) => n.props['data-node-id']));
    expect(ids.has('hero')).toBe(true);
    expect(ids.has('card')).toBe(true);
    act(() => {
      renderer.unmount();
    });
  });
});
