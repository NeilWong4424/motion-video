import {describe, expect, it} from 'vitest';

import {MotionSpecSchema, type MotionSpec} from '../../src/contracts/motion-spec.js';
import {resolveTimeline} from '../../src/engine/resolver/resolve-timeline.js';

function baseNode(id: string, seg: string) {
  return {
    id,
    kind: 'text' as const,
    space: 'world' as const,
    semanticRole: 'content' as const,
    renderer: {id: 'base.text', version: '1.0.0', props: {text: id}},
    effects: [],
    geometryTrack: [{at: {segmentId: seg, progress: 0}, value: {x: 0, y: 0, width: 100, height: 40}, interpolation: 'hold' as const}],
    styleTrack: [{at: {segmentId: seg, progress: 0}, value: {opacity: 1}, interpolation: 'hold' as const}],
    visibleTrack: [{at: {segmentId: seg, progress: 0}, value: 1, interpolation: 'hold' as const}],
  };
}

function spec(): MotionSpec {
  return MotionSpecSchema.parse({
    schemaVersion: 'motion-spec@1',
    projectId: 'timeline-demo',
    treatmentHash: '0'.repeat(64),
    canvas: {width: 1920, height: 1080, fps: 30},
    timeline: {
      beats: [
        {id: 'hook', durationFrames: 90, objective: 'o', message: 'm', focalNodeId: 'hero', liveContentNodeIds: ['hero'], settleAt: {segmentId: 'hook', progress: 0.6}, holdRange: {from: {segmentId: 'hook', progress: 0.6}, to: {segmentId: 'hook', progress: 1}}},
        {id: 'proof', durationFrames: 120, objective: 'o', message: 'm', focalNodeId: 'hero', liveContentNodeIds: ['hero'], settleAt: {segmentId: 'proof', progress: 0.6}, holdRange: {from: {segmentId: 'proof', progress: 0.6}, to: {segmentId: 'proof', progress: 1}}},
        {id: 'cta', durationFrames: 60, objective: 'o', message: 'm', focalNodeId: 'hero', liveContentNodeIds: ['hero'], settleAt: {segmentId: 'cta', progress: 0.6}, holdRange: {from: {segmentId: 'cta', progress: 0.6}, to: {segmentId: 'cta', progress: 1}}},
      ],
      bridges: [
        {id: 'hook-to-proof', fromBeatId: 'hook', toBeatId: 'proof', durationFrames: 20, narrativeReason: 'r', transitionFamily: 'shared-element', vocabularyRole: 'ordinary', eyeTrace: {outgoing: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}, incoming: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}}, motionOwnership: 'node', mode: 'shared-element', nodeId: 'hero', motionRange: {from: {segmentId: 'hook-to-proof', progress: 0}, to: {segmentId: 'hook-to-proof', progress: 1}}},
        {id: 'proof-to-cta', fromBeatId: 'proof', toBeatId: 'cta', durationFrames: 30, narrativeReason: 'r', transitionFamily: 'shared-element', vocabularyRole: 'ordinary', eyeTrace: {outgoing: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}, incoming: {nodeId: 'hero', point: {x: 0.5, y: 0.5}}}, motionOwnership: 'node', mode: 'shared-element', nodeId: 'hero', motionRange: {from: {segmentId: 'proof-to-cta', progress: 0}, to: {segmentId: 'proof-to-cta', progress: 1}}},
      ],
    },
    world: {coordinateSpace: 'composition-pixels', origin: 'top-left', transformOrigin: 'top-left', childGeometry: 'parent-local', nodes: [baseNode('hero', 'hook')]},
    camera: {id: 'main-camera', segments: [{id: 'cam', mode: 'hold', segmentId: 'hook', state: {x: 0, y: 0, zoom: 1}}]},
    motionCues: [],
  });
}

describe('resolveTimeline', () => {
  it('resolves exact half-open windows and total duration', () => {
    const result = resolveTimeline(spec());
    expect(result.segments).toEqual([
      {id: 'hook', kind: 'beat', from: 0, to: 90},
      {id: 'hook-to-proof', kind: 'bridge', from: 90, to: 110},
      {id: 'proof', kind: 'beat', from: 110, to: 230},
      {id: 'proof-to-cta', kind: 'bridge', from: 230, to: 260},
      {id: 'cta', kind: 'beat', from: 260, to: 320},
    ]);
    expect(result.durationInFrames).toBe(320);
  });
});
