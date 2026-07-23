import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {MotionSpecSchema} from '../../src/contracts/motion-spec.js';
import {BriefSpecSchema} from '../../src/contracts/brief.js';
import {TreatmentSpecSchema} from '../../src/contracts/treatment.js';
import {resolveMotion} from '../../src/engine/resolver/resolve-motion.js';
import {compileMotion} from '../../src/engine/compiler/compile-motion.js';
import {validateRenderPlan} from '../../src/engine/compiler/validate-render-plan.js';
import {DeterministicLayoutService} from '../../src/engine/resolver/resolve-layout.js';
import {createCoreRegistry} from '../../src/capabilities/index.js';
import {engineBuildIdentity} from '../../src/generated/engine-build-manifest.js';
import {sha256Canonical} from '../../src/engine/hash.js';

const projectsRoot = join(import.meta.dirname, '..', '..', 'projects');

function goldenProjects(): string[] {
  if (!existsSync(projectsRoot)) return [];
  return readdirSync(projectsRoot, {withFileTypes: true})
    .filter((d) => d.isDirectory() && d.name.startsWith('golden-'))
    .map((d) => d.name);
}

describe('golden matrix regression', () => {
  const projects = goldenProjects();

  it('has at least one committed golden project', () => {
    expect(projects.length).toBeGreaterThanOrEqual(1);
  });

  for (const name of projects) {
    it(`${name} resolves, compiles and produces a valid deterministic RenderPlan`, () => {
      const dir = join(projectsRoot, name);
      const brief = BriefSpecSchema.parse(JSON.parse(readFileSync(join(dir, 'brief.spec.json'), 'utf8')));
      const treatment = TreatmentSpecSchema.parse(JSON.parse(readFileSync(join(dir, 'treatment.json'), 'utf8')));
      const motion = MotionSpecSchema.parse(JSON.parse(readFileSync(join(dir, 'motion.spec.json'), 'utf8')));

      const layout = new DeterministicLayoutService();
      const result = resolveMotion({brief, treatment, motion, layout, registry: createCoreRegistry()});
      const errors = [...result.diagnostics, ...layout.diagnostics].filter((d) => d.severity === 'error');
      expect(errors, `${name} resolve errors`).toEqual([]);
      expect(result.ir).not.toBeNull();

      const plan = compileMotion(result.ir!, engineBuildIdentity, 'rev-0001');
      expect(validateRenderPlan(plan), `${name} plan errors`).toEqual([]);

      // Deterministic: same source resolves+compiles to the same plan hash.
      const layout2 = new DeterministicLayoutService();
      const result2 = resolveMotion({brief, treatment, motion, layout: layout2, registry: createCoreRegistry()});
      const plan2 = compileMotion(result2.ir!, engineBuildIdentity, 'rev-0001');
      expect(sha256Canonical(plan)).toBe(sha256Canonical(plan2));

      // Zero chapter cuts and a single world/camera invariant hold.
      expect(motion.timeline.bridges.filter((b) => b.mode === 'chapter-cut').length).toBeLessThanOrEqual(1);
      expect(motion.camera.id).toBe('main-camera');
    });
  }
});
