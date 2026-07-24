import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {bindCapabilities} from '../../src/engine/resolver/bind-capabilities.js';
import {resolveTimeline} from '../../src/engine/resolver/resolve-timeline.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';

/**
 * Build a one-beat spec whose single text node carries one effect with the given
 * props. Exercises the effect-intent threading in bindCapabilities.
 */
function specWithEffectProps(props: unknown): MotionSpec {
  return MotionSpecSchema.parse({
    schemaVersion: 'motion-spec@1',
    projectId: 'bind-intent',
    treatmentHash: '0'.repeat(64),
    canvas: {width: 1920, height: 1080, fps: 30},
    timeline: {
      beats: [
        {
          id: 'only',
          durationFrames: 60,
          objective: 'o',
          message: 'm',
          focalNodeId: 'hero',
          liveContentNodeIds: ['hero'],
          settleAt: {segmentId: 'only', progress: 0.5},
          holdRange: {from: {segmentId: 'only', progress: 0.5}, to: {segmentId: 'only', progress: 1}},
        },
      ],
      bridges: [],
    },
    world: {
      coordinateSpace: 'composition-pixels',
      origin: 'top-left',
      transformOrigin: 'top-left',
      childGeometry: 'parent-local',
      nodes: [
        {
          id: 'hero',
          kind: 'text',
          space: 'world',
          semanticRole: 'content',
          renderer: {id: 'base.text', version: '1.0.0', props: {text: 'x'}},
          effects: [
            {
              id: 'text.mask-rise',
              version: '1.0.0',
              range: {from: {segmentId: 'only', progress: 0}, to: {segmentId: 'only', progress: 0.5}},
              props,
            },
          ],
          geometryTrack: [
            {at: {segmentId: 'only', progress: 0}, value: {x: 100, y: 100, width: 400, height: 80}, interpolation: 'hold'},
          ],
          styleTrack: [{at: {segmentId: 'only', progress: 0}, value: {opacity: 1}, interpolation: 'hold'}],
          visibleTrack: [{at: {segmentId: 'only', progress: 0}, value: 1, interpolation: 'hold'}],
        },
      ],
    },
    camera: {
      id: 'main-camera',
      segments: [{id: 'cam', mode: 'hold', segmentId: 'only', state: {x: 0, y: 0, zoom: 1}}],
    },
    motionCues: [],
  });
}

describe('bindCapabilities effect intent threading', () => {
  it('carries a non-default author prop into the effect binding', () => {
    const spec = specWithEffectProps({riseFraction: 0.4});
    const {bindings, diagnostics} = bindCapabilities(spec, resolveTimeline(spec), createCoreRegistry());
    expect(diagnostics).toEqual([]);
    const effect = bindings[0]!.effects[0]!;
    expect((effect.intent as {riseFraction: number}).riseFraction).toBe(0.4);
  });

  it('fills the fixture default when props are empty', () => {
    const spec = specWithEffectProps({});
    const {bindings, diagnostics} = bindCapabilities(spec, resolveTimeline(spec), createCoreRegistry());
    expect(diagnostics).toEqual([]);
    // text.mask-rise riseFraction defaults to 1.
    expect((bindings[0]!.effects[0]!.intent as {riseFraction: number}).riseFraction).toBe(1);
  });

  it('rejects an out-of-range prop with EFFECT_INTENT_INVALID and drops the effect', () => {
    const spec = specWithEffectProps({riseFraction: 5});
    const {bindings, diagnostics} = bindCapabilities(spec, resolveTimeline(spec), createCoreRegistry());
    expect(diagnostics.some((d) => d.code === 'EFFECT_INTENT_INVALID')).toBe(true);
    expect(bindings[0]!.effects).toHaveLength(0);
  });
});
