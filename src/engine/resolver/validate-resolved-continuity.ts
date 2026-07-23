import type {z} from 'zod';
import type {ResolvedMotionIRSchema} from '../../contracts/resolved-motion.js';
import {errorDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

type ResolvedMotionIR = z.infer<typeof ResolvedMotionIRSchema>;

/** Validate invariants on the resolved IR: unique node ids, frame coverage. */
export function validateResolvedContinuity(ir: ResolvedMotionIR): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const ids = ir.nodes.map((n) => n.id);
  if (new Set(ids).size !== ids.length) {
    diagnostics.push(errorDiagnostic('RESOLVED_NODE_ID_DUPLICATE'));
  }

  // Segment windows must tile [0, duration) with no gap/overlap for rendered
  // (non-zero) segments.
  const rendered = ir.segments.filter((s) => s.to > s.from).sort((a, b) => a.from - b.from);
  let cursor = 0;
  for (const seg of rendered) {
    if (seg.from !== cursor) {
      diagnostics.push(errorDiagnostic('RESOLVED_FRAME_COVERAGE_GAP', {evidence: `${seg.id}@${seg.from}!=${cursor}`}));
    }
    cursor = seg.to;
  }
  if (cursor !== ir.durationInFrames) {
    diagnostics.push(errorDiagnostic('RESOLVED_DURATION_MISMATCH', {evidence: `${cursor}!=${ir.durationInFrames}`}));
  }

  return diagnostics;
}
