import * as React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from 'vitest';

import {createCoreRegistry} from '../../src/capabilities/index.js';
import {baseGradientShapeRenderer} from '../../src/capabilities/base/gradient-shape-node.js';
import {baseIsoStackRenderer} from '../../src/capabilities/base/iso-stack-node.js';
import {textKineticReveal} from '../../src/capabilities/text/kinetic-reveal.js';
import {ambientSoftShadow} from '../../src/capabilities/ambient/soft-shadow.js';
import {detectChannelConflicts} from '../../src/engine/capability/matcher.js';

const PROJECT = 'test-project';

function renderJSON(el: React.ReactElement): unknown {
  let r: ReactTestRenderer;
  act(() => {
    r = create(el);
  });
  return r!.toJSON();
}

function countPaths(json: unknown): number {
  let n = 0;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const el = node as {type?: string; children?: unknown[]};
    if (el.type === 'path') n++;
    if (Array.isArray(el.children)) el.children.forEach(walk);
  };
  walk(json);
  return n;
}

function findTypes(json: unknown, type: string): number {
  let n = 0;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const el = node as {type?: string; children?: unknown[]};
    if (el.type === type) n++;
    if (Array.isArray(el.children)) el.children.forEach(walk);
  };
  walk(json);
  return n;
}

describe('premium capabilities: registry', () => {
  it('resolves all four new capabilities from the core registry', () => {
    const reg = createCoreRegistry();
    expect(reg.resolveRenderer('base.gradient-shape', '1.0.0', PROJECT).id).toBe('base.gradient-shape');
    expect(reg.resolveRenderer('base.iso-stack', '1.0.0', PROJECT).id).toBe('base.iso-stack');
    expect(reg.resolveEffect('text.kinetic-reveal', '1.0.0', PROJECT).id).toBe('text.kinetic-reveal');
    expect(reg.resolveEffect('ambient.soft-shadow', '1.0.0', PROJECT).id).toBe('ambient.soft-shadow');
  });
});

describe('base.gradient-shape (A3)', () => {
  const Comp = baseGradientShapeRenderer.Component;
  it('emits a <defs> with a gradient and one <stop> per stop', () => {
    const props = baseGradientShapeRenderer.propsSchema.parse({
      shape: 'rect',
      width: 200,
      height: 100,
      gradient: {
        type: 'linear',
        angleDeg: 90,
        stops: [
          {offset: 0, color: '#0a0e17'},
          {offset: 0.5, color: '#132033'},
          {offset: 1, color: '#4f8cff'},
        ],
      },
    });
    const json = renderJSON(<Comp props={props} frame={0} />);
    expect(findTypes(json, 'defs')).toBe(1);
    expect(findTypes(json, 'linearGradient')).toBe(1);
    expect(findTypes(json, 'stop')).toBe(3);
  });

  it('gives distinct gradients distinct <defs> ids and identical ones the same id', () => {
    const mk = (c: string) =>
      baseGradientShapeRenderer.propsSchema.parse({
        shape: 'ellipse',
        width: 100,
        height: 100,
        gradient: {type: 'radial', stops: [{offset: 0, color: c}, {offset: 1, color: '#000000'}]},
      });
    const a = JSON.stringify(renderJSON(<Comp props={mk('#4f8cff')} frame={0} />));
    const b = JSON.stringify(renderJSON(<Comp props={mk('#4f8cff')} frame={0} />));
    const c = JSON.stringify(renderJSON(<Comp props={mk('#ff4f8c')} frame={0} />));
    expect(a).toEqual(b); // deterministic id for identical gradient
    expect(a).not.toEqual(c); // different gradient -> different id/output
  });
});

describe('base.iso-stack (A6)', () => {
  const Comp = baseIsoStackRenderer.Component;
  it('draws exactly columns*rows*3 shaded faces', () => {
    const props = baseIsoStackRenderer.propsSchema.parse({columns: 4, rows: 3, cubeSize: 40});
    const json = renderJSON(<Comp props={props} frame={0} />);
    expect(countPaths(json)).toBe(4 * 3 * 3);
  });

  it('generated path data uses only SAFE_PATH characters', () => {
    const SAFE_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/;
    const props = baseIsoStackRenderer.propsSchema.parse({columns: 2, rows: 2, cubeSize: 32});
    const json = renderJSON(<Comp props={props} frame={0} />);
    const ds: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      const el = node as {type?: string; props?: {d?: string}; children?: unknown[]};
      if (el.type === 'path' && el.props?.d) ds.push(el.props.d);
      if (Array.isArray(el.children)) el.children.forEach(walk);
    };
    walk(json);
    expect(ds.length).toBeGreaterThan(0);
    for (const d of ds) expect(d).toMatch(SAFE_PATH);
  });
});

describe('text.kinetic-reveal (A5)', () => {
  const Comp = textKineticReveal.Component;
  const resolved = textKineticReveal.resolve(
    {text: 'GOAL', fontSizePx: 120, fontWeight: 900, color: '#f5f7fa', unit: 'glyph', unitDurationFraction: 0.5, risePx: 28, blurPx: 6},
    {seed: 's', fps: 30, fromFrame: 0, toFrame: 30},
  );
  it('renders one span per glyph', () => {
    const json = renderJSON(<Comp resolved={resolved} frame={30} progress={1} />);
    expect(findTypes(json, 'span')).toBe(4); // G O A L
  });
  it('is hidden at progress 0 and fully settled at progress 1', () => {
    const at0 = JSON.stringify(renderJSON(<Comp resolved={resolved} frame={0} progress={0} />));
    const at1 = JSON.stringify(renderJSON(<Comp resolved={resolved} frame={30} progress={1} />));
    expect(at0).not.toEqual(at1);
    expect(at0).toContain('opacity'); // first glyph carries opacity 0 at start
    expect(at0).toContain('blur('); // blur-in present at start
  });
});

describe('ambient.soft-shadow (A4)', () => {
  const Comp = ambientSoftShadow.Component;
  it('applies a stronger filter as progress increases', () => {
    const resolved = ambientSoftShadow.resolve(
      {mode: 'glow', color: '#4f8cff', blurPx: 24, offsetXPx: 0, offsetYPx: 0, strength: 0.5},
      {seed: 's', fps: 30, fromFrame: 0, toFrame: 30},
    );
    const at0 = JSON.stringify(renderJSON(<Comp resolved={resolved} frame={0} progress={0} />));
    const at1 = JSON.stringify(renderJSON(<Comp resolved={resolved} frame={30} progress={1} />));
    expect(at0).not.toEqual(at1);
    expect(at1).toContain('drop-shadow');
  });

  it('conflicts with another filter-owning effect over overlapping frames', () => {
    // soft-shadow + card-lift both own `filter`; overlapping windows must conflict.
    const conflicts = detectChannelConflicts([
      {channels: ['filter'], fromFrame: 0, toFrame: 30},
      {channels: ['geometry', 'filter'], fromFrame: 10, toFrame: 40},
    ]);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it('does not conflict when filter windows are disjoint', () => {
    const conflicts = detectChannelConflicts([
      {channels: ['filter'], fromFrame: 0, toFrame: 30},
      {channels: ['filter'], fromFrame: 30, toFrame: 60},
    ]);
    expect(conflicts.length).toBe(0);
  });
});
