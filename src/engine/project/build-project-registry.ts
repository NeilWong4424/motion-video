import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

import {ProjectFileSchema} from '../../contracts/manifest.js';
import {RenderPlanSchema, type RenderPlan} from '../../contracts/render-plan.js';
import {canonicalJson} from '../canonical-json.js';
import {writeCanonicalTsSync} from './atomic-write-ts.js';
import type {RepoContext} from './paths.js';

export type ProjectRegistryEntry = {
  projectId: string;
  revisionId: string | null;
  renderPlanHash: string | null;
  plan: RenderPlan | null;
};

/**
 * Scan direct project directories (excluding names beginning with `_`), read
 * each project.json (and its resolved plan when present), sort by project ID and
 * atomically regenerate src/generated/project-registry.ts as canonical data.
 */
export async function buildProjectRegistry(context: RepoContext): Promise<void> {
  const projectsRoot = join(context.repoRoot, 'projects');
  const entries: ProjectRegistryEntry[] = [];

  if (existsSync(projectsRoot)) {
    const dirents = readdirSync(projectsRoot, {withFileTypes: true});
    for (const dirent of dirents) {
      if (!dirent.isDirectory() || dirent.name.startsWith('_')) continue;
      const projectJson = join(projectsRoot, dirent.name, 'project.json');
      if (!existsSync(projectJson)) continue;
      const project = ProjectFileSchema.parse(JSON.parse(readFileSync(projectJson, 'utf8')));

      let plan: RenderPlan | null = null;
      let renderPlanHash: string | null = null;
      if (project.currentRevisionId) {
        const resolved = tryLoadCurrentPlan(context, project.projectId, project.currentRevisionId);
        if (resolved) {
          plan = resolved.plan;
          renderPlanHash = resolved.renderPlanHash;
        }
      }

      entries.push({
        projectId: project.projectId,
        revisionId: project.currentRevisionId,
        renderPlanHash,
        plan,
      });
    }
  }

  entries.sort((a, b) => a.projectId.localeCompare(b.projectId));

  const body = entries.map((e) => canonicalJson(e)).join(',\n  ');
  const source = `import type {RenderPlan} from '../contracts/render-plan.js';

export type ProjectRegistryEntry = {
  projectId: string;
  revisionId: string | null;
  renderPlanHash: string | null;
  plan: RenderPlan | null;
};

export const projectRegistry = [${
    entries.length === 0 ? '' : `\n  ${body},\n`
  }] satisfies readonly ProjectRegistryEntry[];
`;

  writeCanonicalTsSync(join(context.repoRoot, 'src', 'generated', 'project-registry.ts'), source);
}

function tryLoadCurrentPlan(
  context: RepoContext,
  projectId: string,
  revisionId: string,
): {plan: RenderPlan; renderPlanHash: string} | null {
  const outDir = join(context.repoRoot, 'out', projectId, revisionId);
  if (!existsSync(outDir)) return null;
  const hashDirs = readdirSync(outDir, {withFileTypes: true}).filter((d) => d.isDirectory());
  for (const hashDir of hashDirs) {
    const planPath = join(outDir, hashDir.name, 'render.plan.json');
    if (!existsSync(planPath)) continue;
    const parsed = RenderPlanSchema.safeParse(JSON.parse(readFileSync(planPath, 'utf8')));
    if (parsed.success) {
      return {plan: parsed.data, renderPlanHash: hashDir.name};
    }
  }
  return null;
}
