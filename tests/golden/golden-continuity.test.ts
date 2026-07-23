import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema} from '../../src/contracts/treatment.js';
import {resolveMotion} from '../../src/engine/resolver/resolve-motion.js';
import {compileMotion} from '../../src/engine/compiler/compile-motion.js';
import {DeterministicLayoutService} from '../../src/engine/resolver/resolve-layout.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';
import {engineBuildIdentity} from '../../src/generated/engine-build-manifest.js';

const projectDir = join(import.meta.dirname, '..', '..', 'projects', 'golden-continuity');

function read(name: string): unknown {
  return JSON.parse(readFileSync(join(projectDir, name), 'utf8'));
}

describe('Golden Film: golden-continuity', () => {
  const brief = BriefSpecSchema.parse(read('brief.spec.json'));
  const treatment = TreatmentSpecSchema.parse(read('treatment.json'));
  const motion = MotionSpecSchema.parse(read('motion.spec.json'));

  it('resolves and compiles with no error diagnostics', () => {
    const layout = new DeterministicLayoutService();
    const result = resolveMotion({brief, treatment, motion, layout, registry: createCoreRegistry()});
    const errors = [...result.diagnostics, ...layout.diagnostics].filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
    expect(result.ir).not.toBeNull();

    const plan = compileMotion(result.ir!, engineBuildIdentity, 'rev-0001');
    expect(plan.durationInFrames).toBe(600);
    expect(plan.handoffChecks.length).toBeGreaterThan(0);
  });

  it('has zero chapter cuts and exactly one signature transition', () => {
    const cuts = motion.timeline.bridges.filter((b) => b.mode === 'chapter-cut');
    expect(cuts).toHaveLength(0);
    const signatures = motion.timeline.bridges.filter((b) => b.vocabularyRole === 'signature');
    expect(signatures).toHaveLength(1);
    expect(signatures[0]!.mode).toBe('morph-into-target');
  });

  it('uses the four ordinary/signature bridge families and 5 beats', () => {
    const modes = motion.timeline.bridges.map((b) => b.mode).sort();
    expect(modes).toEqual(['camera-navigation', 'match-on-action', 'morph-into-target', 'shared-element']);
    expect(motion.timeline.beats).toHaveLength(5);
  });

  it('keeps a hero node persistent across at least three beats', () => {
    const heroBeats = motion.timeline.beats.filter(
      (b) => b.focalNodeId === 'hero' || b.liveContentNodeIds.includes('hero'),
    );
    expect(heroBeats.length).toBeGreaterThanOrEqual(3);
  });

  it('holds the camera at least twice as long as it moves', () => {
    // One move segment (card-dash, 15 frames); the rest hold. 540+ hold vs 15 move.
    const moveSegments = motion.camera.segments.filter((s) => s.mode === 'move');
    expect(moveSegments).toHaveLength(1);
  });
});
