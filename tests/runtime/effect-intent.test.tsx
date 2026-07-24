import * as React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from 'vitest';

import {EffectStackHost, type EffectBinding} from '../../src/engine/runtime/EffectStackHost.js';

function renderStack(binding: EffectBinding, frame: number): unknown {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(
      <EffectStackHost effects={[binding]} frame={frame}>
        <div>child</div>
      </EffectStackHost>,
    );
  });
  return renderer!.toJSON();
}

const base = {id: 'text.tracking-resolve', version: '1.0.0', fromFrame: 0, toFrame: 30};

describe('EffectStackHost carried intent', () => {
  it('renders a non-default intent differently from the fixture default at the same frame', () => {
    // tracking-resolve fixture default fromTrackingEm is 0.3; use a distinct value.
    const withIntent = JSON.stringify(renderStack({...base, intent: {fromTrackingEm: 1.2}}, 0));
    const withFixture = JSON.stringify(renderStack({...base}, 0));
    expect(withIntent).not.toEqual(withFixture);
    // The larger tracking should appear in the rendered letterSpacing at frame 0.
    expect(withIntent).toContain('1.2em');
  });

  it('falls back to the fixture default when intent is absent', () => {
    const absent = JSON.stringify(renderStack({...base}, 0));
    const explicitDefault = JSON.stringify(renderStack({...base, intent: {fromTrackingEm: 0.3}}, 0));
    expect(absent).toEqual(explicitDefault);
  });

  it('falls back to the fixture default when intent is malformed', () => {
    const malformed = JSON.stringify(renderStack({...base, intent: {fromTrackingEm: 'nope'}}, 0));
    const fixture = JSON.stringify(renderStack({...base}, 0));
    expect(malformed).toEqual(fixture);
  });
});
