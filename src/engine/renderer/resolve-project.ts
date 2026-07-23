import {existsSync, mkdirSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

import {resolveMotion} from '../resolver/resolve-motion.js';
import {DeterministicLayoutService} from '../resolver/resolve-layout.js';
import {compileMotion} from '../compiler/compile-motion.js';
import {validateRenderPlan} from '../compiler/validate-render-plan.js';
import {createCoreRegistry} from '../../capabilities/index.js';
import {engineBuildIdentity} from '../../generated/engine-build-manifest.js';
import {loadSourceArtifacts} from '../project/load-project.js';
import {sourceHashes} from '../project/revision-store.js';
import {writeCanonicalFileSync} from '../project/atomic-write.js';
import {sha256Canonical} from '../hash.js';
import {hasErrors, type Diagnostic} from '../../contracts/diagnostic.js';
import type {RenderPlan} from '../../contracts/render-plan.js';
import type {ProjectPaths} from '../project/paths.js';

export type ResolveOutput = {
  diagnostics: Diagnostic[];
  renderPlan: RenderPlan | null;
  renderPlanHash: string | null;
  outputDir: string | null;
};

/**
 * Resolve a snapshotted project to an immutable content-addressed RenderPlan.
 * Refuses null revision or source that differs from the current snapshot.
 */
export async function resolveProject(paths: ProjectPaths): Promise<ResolveOutput> {
  const source = await loadSourceArtifacts(paths);
  if (source.project.currentRevisionId === null) {
    return {diagnostics: [{code: 'SOURCE_NOT_SNAPSHOTTED', severity: 'error'}], renderPlan: null, renderPlanHash: null, outputDir: null};
  }
  const revisionId = source.project.currentRevisionId;

  // Source must match the snapshot.
  const snapshotDir = join(paths.revisions, revisionId);
  const snapshotHashes = JSON.parse(readFileSync(join(snapshotDir, 'source-hashes.json'), 'utf8')) as {
    brief: string; treatment: string; motion: string;
  };
  const current = sourceHashes({brief: source.brief, treatment: source.treatment, motion: source.motion});
  if (
    current.brief !== snapshotHashes.brief ||
    current.treatment !== snapshotHashes.treatment ||
    current.motion !== snapshotHashes.motion
  ) {
    return {diagnostics: [{code: 'SOURCE_NOT_SNAPSHOTTED', severity: 'error', evidence: 'edited since snapshot'}], renderPlan: null, renderPlanHash: null, outputDir: null};
  }

  const layout = new DeterministicLayoutService();
  const result = resolveMotion({
    brief: source.brief,
    treatment: source.treatment,
    motion: source.motion,
    layout,
    registry: createCoreRegistry(),
    layoutArtifactHash: sha256Canonical({fonts: 'noto-latin', service: 'deterministic@1'}),
  });
  const diagnostics = [...result.diagnostics, ...layout.diagnostics];
  if (!result.ir || hasErrors(diagnostics)) {
    return {diagnostics, renderPlan: null, renderPlanHash: null, outputDir: null};
  }

  const renderPlan = compileMotion(result.ir, engineBuildIdentity, revisionId);
  const planDiagnostics = validateRenderPlan(renderPlan);
  diagnostics.push(...planDiagnostics);
  if (hasErrors(diagnostics)) {
    return {diagnostics, renderPlan: null, renderPlanHash: null, outputDir: null};
  }

  const renderPlanHash = sha256Canonical(renderPlan);
  const outputDir = join(paths.output, revisionId, renderPlanHash);
  mkdirSync(outputDir, {recursive: true});

  writeCanonicalFileSync(join(outputDir, 'motion.resolved.json'), result.ir);
  writeCanonicalFileSync(join(outputDir, 'render.plan.json'), renderPlan);
  writeCanonicalFileSync(join(outputDir, 'layout.artifact.json'), {
    layoutArtifactHash: result.ir.layoutArtifactHash,
    service: 'deterministic@1',
  });

  return {diagnostics, renderPlan, renderPlanHash, outputDir};
}

export function findCurrentPlan(paths: ProjectPaths, revisionId: string): {plan: RenderPlan; hash: string; dir: string} | null {
  const revDir = join(paths.output, revisionId);
  if (!existsSync(revDir)) return null;
  for (const entry of readdirSync(revDir, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const planPath = join(revDir, entry.name, 'render.plan.json');
    if (existsSync(planPath)) {
      return {
        plan: JSON.parse(readFileSync(planPath, 'utf8')) as RenderPlan,
        hash: entry.name,
        dir: join(revDir, entry.name),
      };
    }
  }
  return null;
}
