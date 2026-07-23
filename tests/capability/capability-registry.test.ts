import * as React from 'react';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

import {CapabilityRegistry} from '../../src/engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../src/engine/capability/types.js';

function effect(id: string): MotionCapabilityDefinition<unknown, unknown> {
  return {
    id,
    version: '1.0.0',
    implementationHash: 'a'.repeat(64),
    family: 'text',
    supportedNodeKinds: ['text'],
    intentSchema: z.unknown(),
    resolvedSchema: z.unknown(),
    ownedChannels: ['opacity'],
    continuity: {stableRoot: true, continuitySubnodeIds: []},
    resolve: (i) => i,
    Component: () => React.createElement('div'),
    fixture: {intent: {}},
    performanceBudget: {maxDomNodes: 4, maxSvgPaths: 0},
  };
}

describe('CapabilityRegistry', () => {
  it('registers a core effect and rejects a duplicate', () => {
    const registry = new CapabilityRegistry();
    expect(() => registry.registerEffect(effect('text.mask-rise'), 'core')).not.toThrow();
    expect(() => registry.registerEffect(effect('text.mask-rise'), 'core')).toThrow(/CAPABILITY_DUPLICATE/);
  });

  it('resolves a core effect for any project', () => {
    const registry = new CapabilityRegistry();
    registry.registerEffect(effect('text.mask-rise'), 'core');
    expect(registry.resolveEffect('text.mask-rise', '1.0.0', 'any-project').id).toBe('text.mask-rise');
  });

  it('forbids resolving a project-scoped effect from another project', () => {
    const registry = new CapabilityRegistry();
    registry.registerEffect(effect('project.secret'), 'project:owner-project');
    expect(() => registry.resolveEffect('project.secret', '1.0.0', 'other-project')).toThrow(
      /CAPABILITY_SCOPE_FORBIDDEN/,
    );
    expect(registry.resolveEffect('project.secret', '1.0.0', 'owner-project').id).toBe('project.secret');
  });

  it('lists sorted manifest entries', () => {
    const registry = new CapabilityRegistry();
    registry.registerEffect(effect('text.word-stagger'), 'core');
    registry.registerEffect(effect('text.mask-rise'), 'core');
    expect(registry.list().map((e) => e.id)).toEqual(['text.mask-rise', 'text.word-stagger']);
  });
});
