import * as React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from 'vitest';

import {createCoreRegistry} from '../../src/capabilities/index.js';
import {shapeEffects} from '../../src/capabilities/shape/index.js';
import {pathEffects} from '../../src/capabilities/path/index.js';
import {EffectStackHost} from '../../src/engine/runtime/EffectStackHost.js';

describe('shape and path capability pack', () => {
  it('registers shape and path effects', () => {
    const registry = createCoreRegistry();
    for (const effect of [...shapeEffects, ...pathEffects]) {
      expect(registry.resolveEffect(effect.id, effect.version, 'p').id).toBe(effect.id);
    }
  });

  it('EffectStackHost wraps a child without replacing its identity', () => {
    let renderer!: ReactTestRenderer;
    const child = <div data-continuity-root="test-child">content</div>;
    act(() => {
      renderer = create(
        <EffectStackHost
          effects={[{id: 'path.path-draw', version: '1.0.0', fromFrame: 0, toFrame: 30}]}
          frame={0}
        >
          {child}
        </EffectStackHost>,
      );
    });
    const before = renderer.root.findByProps({'data-continuity-root': 'test-child'});
    const instanceBefore = before.instance;

    act(() => {
      renderer.update(
        <EffectStackHost
          effects={[{id: 'path.path-draw', version: '1.0.0', fromFrame: 0, toFrame: 30}]}
          frame={15}
        >
          {child}
        </EffectStackHost>,
      );
    });
    const after = renderer.root.findByProps({'data-continuity-root': 'test-child'});
    expect(after.instance).toBe(instanceBefore);

    act(() => renderer.unmount());
  });

  it('ignores an unknown effect binding rather than inventing one', () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <EffectStackHost effects={[{id: 'nope.unknown', version: '9.9.9', fromFrame: 0, toFrame: 10}]} frame={5}>
          <span data-continuity-root="x">hi</span>
        </EffectStackHost>,
      );
    });
    expect(renderer.root.findByProps({'data-continuity-root': 'x'})).toBeDefined();
    act(() => renderer.unmount());
  });
});
