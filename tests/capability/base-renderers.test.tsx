import * as React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from 'vitest';

import {baseTextRenderer, baseShapeRenderer} from '../../src/capabilities/base/index.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';

describe('base renderers', () => {
  it('register into the core registry with generated implementation hashes', () => {
    const registry = createCoreRegistry();
    const text = registry.resolveRenderer('base.text', '1.0.0', 'p');
    expect(text.id).toBe('base.text');
    expect(text.implementationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(text.implementationHash).not.toBe('0'.repeat(64));
  });

  it('keeps the base.text geometry root stable across content updates', () => {
    const {Component} = baseTextRenderer;
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<Component props={{text: 'A'}} frame={0} />);
    });
    const rootBefore = renderer.root.findByProps({'data-continuity-root': 'base.text'});
    const instanceBefore = rootBefore.instance;

    act(() => {
      renderer.update(<Component props={{text: 'B'}} frame={10} />);
    });
    const rootAfter = renderer.root.findByProps({'data-continuity-root': 'base.text'});
    // The root element is preserved; content changed.
    expect(rootAfter.type).toBe(rootBefore.type);
    expect(rootAfter.instance).toBe(instanceBefore);

    act(() => {
      renderer.unmount();
    });
  });

  it('validates base.shape props', () => {
    expect(() => baseShapeRenderer.propsSchema.parse({shape: 'rect', width: 100, height: 50})).not.toThrow();
    expect(() => baseShapeRenderer.propsSchema.parse({shape: 'triangle', width: 1, height: 1})).toThrow();
  });
});
