import type {RenderPlan} from '../contracts/render-plan.js';

export type ProjectRegistryEntry = {
  projectId: string;
  revisionId: string | null;
  renderPlanHash: string | null;
  plan: RenderPlan | null;
};

export const projectRegistry: readonly ProjectRegistryEntry[] = [];
