import * as React from 'react';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

import {defineCapability} from '../../src/engine/capability/define-capability.js';
import {detectChannelConflicts} from '../../src/engine/capability/matcher.js';
import type {MotionCapabilityDefinition} from '../../src/engine/capability/types.js';

function validEffect(): MotionCapabilityDefinition<{lift: number}, {lift: number}> {
  return {
    id: 'text.mask-rise',
    version: '1.0.0',
    implementationHash: 'a'.repeat(64),
    family: 'text',
    supportedNodeKinds: ['text'],
    intentSchema: z.strictObject({lift: z.number()}),
    resolvedSchema: z.strictObject({lift: z.number()}),
    ownedChannels: ['geometry', 'opacity'],
    continuity: {stableRoot: true, continuitySubnodeIds: []},
    resolve: (intent) => ({lift: intent.lift}),
    Component: () => React.createElement('div'),
    fixture: {intent: {lift: 24}},
    performanceBudget: {maxDomNodes: 8, maxSvgPaths: 0},
  };
}

describe('defineCapability', () => {
  it('accepts a valid effect definition', () => {
    expect(() => defineCapability(validEffect())).not.toThrow();
  });

  it('rejects an invalid id', () => {
    expect(() => defineCapability({...validEffect(), id: 'Mask Rise'})).toThrow(/CAPABILITY_ID_INVALID/);
  });

  it('rejects a non-semver version', () => {
    expect(() => defineCapability({...validEffect(), version: 'latest'})).toThrow(
      /CAPABILITY_VERSION_INVALID/,
    );
  });

  it('rejects duplicate owned channels', () => {
    expect(() =>
      defineCapability({...validEffect(), ownedChannels: ['geometry', 'geometry']}),
    ).toThrow(/CAPABILITY_CHANNEL_DUPLICATE/);
  });

  it('rejects a fixture whose intent fails the schema', () => {
    expect(() =>
      defineCapability({...validEffect(), fixture: {intent: {lift: 'no'}}}),
    ).toThrow(/CAPABILITY_FIXTURE_INVALID/);
  });

  it('resolves deterministically for the same frozen context', () => {
    const effect = defineCapability(validEffect());
    const ctx = Object.freeze({seed: 's', fps: 30, fromFrame: 0, toFrame: 30});
    expect(effect.resolve({lift: 5}, ctx)).toEqual(effect.resolve({lift: 5}, ctx));
  });
});

describe('detectChannelConflicts', () => {
  it('rejects the same channel over overlapping ranges', () => {
    const conflicts = detectChannelConflicts([
      {channels: ['geometry'], fromFrame: 0, toFrame: 30},
      {channels: ['geometry'], fromFrame: 20, toFrame: 40},
    ]);
    expect(conflicts.map((c) => c.code)).toContain('CAPABILITY_CHANNEL_CONFLICT');
  });

  it('allows the same channel over disjoint ranges', () => {
    const conflicts = detectChannelConflicts([
      {channels: ['geometry'], fromFrame: 0, toFrame: 30},
      {channels: ['geometry'], fromFrame: 30, toFrame: 60},
    ]);
    expect(conflicts).toEqual([]);
  });
});
