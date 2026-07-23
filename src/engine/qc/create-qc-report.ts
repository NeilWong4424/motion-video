import {TechnicalQCReportSchema, type TechnicalQCReport} from '../../contracts/review.js';
import type {RenderPlan} from '../../contracts/render-plan.js';
import type {TechnicalQcResult} from './technical-qc.js';

export function createQcReport(
  plan: RenderPlan,
  renderPlanHash: string,
  reviewedPreviewHash: string,
  result: TechnicalQcResult,
): TechnicalQCReport {
  return TechnicalQCReportSchema.parse({
    schemaVersion: 'technical-qc@1',
    projectId: plan.projectId,
    revisionId: plan.revisionId,
    renderPlanHash,
    reviewedPreviewHash,
    decision: result.decision,
    diagnostics: result.diagnostics.map((d) => ({
      code: d.code,
      severity: d.severity,
      ...(d.evidence !== undefined ? {evidence: d.evidence} : {}),
    })),
  });
}
