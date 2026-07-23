import {describe, expect, it} from 'vitest';

import {validateContinuity} from '../../src/engine/resolver/validate-continuity.js';
import {codes} from '../../src/engine/resolver/continuity-diagnostics.js';
import {loadSpec, makeTreatment} from './helpers.js';

describe('bridge intent via validateContinuity', () => {
  it('flags a missing boundary bridge', () => {
    const spec = structuredClone(loadSpec('valid-continuity'));
    spec.timeline.bridges = spec.timeline.bridges.filter((b) => b.id !== 'hook-proof');
    expect(codes(validateContinuity(makeTreatment(), spec))).toContain('BOUNDARY_BRIDGE_MISSING');
  });

  it('flags a duplicated boundary bridge', () => {
    const spec = structuredClone(loadSpec('valid-continuity'));
    const dup = structuredClone(spec.timeline.bridges[0]!);
    dup.id = 'hook-proof-dup';
    spec.timeline.bridges.push(dup);
    expect(codes(validateContinuity(makeTreatment(), spec))).toContain('BOUNDARY_BRIDGE_MULTIPLE');
  });

  it('flags a shared-element bridge whose node is not persistent across both beats', () => {
    const spec = structuredClone(loadSpec('valid-continuity'));
    // Make the shared node not present in the incoming beat.
    const proof = spec.timeline.beats.find((b) => b.id === 'proof')!;
    proof.liveContentNodeIds = proof.liveContentNodeIds.filter((id) => id !== 'hero');
    proof.focalNodeId = 'card';
    expect(codes(validateContinuity(makeTreatment(), spec))).toContain('BRIDGE_REALIZATION_MISMATCH');
  });

  it('flags unexplained camera-and-node transform ownership', () => {
    const spec = structuredClone(loadSpec('valid-continuity'));
    spec.timeline.bridges[0]!.motionOwnership = 'camera-and-node-semantic';
    // No combinationMeaning provided.
    delete (spec.timeline.bridges[0] as {combinationMeaning?: string}).combinationMeaning;
    expect(codes(validateContinuity(makeTreatment(), spec))).toContain('TRANSFORM_OWNERSHIP_CONFLICT');
  });

  it('flags a content-state pop with no declared transition', () => {
    const spec = structuredClone(loadSpec('valid-continuity'));
    const hero = spec.world.nodes.find((n) => n.id === 'hero')!;
    hero.contentTrack = [
      {at: {segmentId: 'hook', progress: 0}, value: {stateId: 's1', text: 'A'}, interpolation: 'hold'},
      {at: {segmentId: 'proof', progress: 0}, value: {stateId: 's2', text: 'B'}, interpolation: 'hold'},
    ];
    expect(codes(validateContinuity(makeTreatment(), spec))).toContain('CONTENT_STATE_POP');
  });
});
