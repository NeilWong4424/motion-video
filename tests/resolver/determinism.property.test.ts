import {describe, expect, it} from 'vitest';
import fc from 'fast-check';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {resolveTimeline} from '../../src/engine/resolver/resolve-timeline.js';

// Generate small valid timelines and prove frame totals and determinism.
function buildSpec(beatFrames: number[], bridgeFrames: number[]): MotionSpec {
  const beats = beatFrames.map((f, i) => ({
    id: `b${i}`,
    durationFrames: f,
    objective: 'o',
    message: 'm',
    focalNodeId: 'hero',
    liveContentNodeIds: ['hero'],
    settleAt: {segmentId: `b${i}`, progress: 0.5},
    holdRange: {from: {segmentId: `b${i}`, progress: 0.5}, to: {segmentId: `b${i}`, progress: 1}},
  }));
  const bridges = bridgeFrames.map((f, i) => ({
    id: `br${i}`,
    fromBeatId: `b${i}`,
    toBeatId: `b${i + 1}`,
    durationFrames: f,
    narrativeReason: 'r',
    transitionFamily: 'shared-element',
    vocabularyRole: 'ordinary' as const,
    eyeTrace: {outgoing: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}, incoming: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}},
    motionOwnership: 'node' as const,
    mode: 'shared-element' as const,
    nodeId: 'hero',
    motionRange: {from: {segmentId: `br${i}`, progress: 0}, to: {segmentId: `br${i}`, progress: 1}},
  }));
  return MotionSpecSchema.parse({
    schemaVersion: 'motion-spec@1',
    projectId: 'prop',
    treatmentHash: '0'.repeat(64),
    canvas: {width: 1920, height: 1080, fps: 30},
    timeline: {beats, bridges},
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
          effects: [],
          geometryTrack: [{at: {segmentId: 'b0', progress: 0}, value: {x: 0, y: 0, width: 100, height: 40}, interpolation: 'hold'}],
          styleTrack: [{at: {segmentId: 'b0', progress: 0}, value: {opacity: 1}, interpolation: 'hold'}],
          visibleTrack: [{at: {segmentId: 'b0', progress: 0}, value: 1, interpolation: 'hold'}],
        },
      ],
    },
    camera: {id: 'main-camera', segments: [{id: 'cam', mode: 'hold', segmentId: 'b0', state: {x: 0, y: 0, zoom: 1}}]},
    motionCues: [],
  });
}

describe('resolveTimeline determinism (property)', () => {
  it('total frames equal sum of beats + non-cut bridges, deterministically', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({min: 10, max: 200}), {minLength: 2, maxLength: 5}),
        fc.array(fc.integer({min: 5, max: 60}), {minLength: 1, maxLength: 4}),
        (beats, bridgesRaw) => {
          const bridges = bridgesRaw.slice(0, beats.length - 1);
          if (bridges.length !== beats.length - 1) return true; // skip malformed
          const spec = buildSpec(beats, bridges);
          const a = resolveTimeline(spec);
          const b = resolveTimeline(spec);
          const expected = beats.reduce((s, f) => s + f, 0) + bridges.reduce((s, f) => s + f, 0);
          expect(a.durationInFrames).toBe(expected);
          expect(JSON.stringify(a.segments)).toBe(JSON.stringify(b.segments));
        },
      ),
      {numRuns: 500, seed: 42},
    );
  });
});
