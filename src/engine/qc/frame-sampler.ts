import type {RenderPlan} from '../../contracts/render-plan.js';
import type {z} from 'zod';
import type {ResolvedMotionIRSchema} from '../../contracts/resolved-motion.js';

type ResolvedMotionIR = z.infer<typeof ResolvedMotionIRSchema>;

export type SampledFrame = {frame: number; label: string};

/**
 * For every Beat export settled + mid-hold frames; for every non-zero Bridge
 * export pre-motion, midpoint, terminal, immediate-next and next-held; a
 * zero-frame chapter cut exports outgoing final, incoming first and incoming
 * held.
 */
export function sampleReviewFrames(ir: ResolvedMotionIR, _plan: RenderPlan): SampledFrame[] {
  const frames: SampledFrame[] = [];
  const clamp = (f: number) => Math.max(0, Math.min(ir.durationInFrames - 1, f));

  for (const seg of ir.segments) {
    if (seg.kind === 'beat') {
      const mid = clamp(Math.round((seg.from + seg.to) / 2));
      const settled = clamp(seg.from + Math.round((seg.to - seg.from) * 0.6));
      frames.push({frame: mid, label: `${seg.id}-midhold`});
      frames.push({frame: settled, label: `${seg.id}-settle`});
    } else if (seg.to > seg.from) {
      const mid = clamp(Math.round((seg.from + seg.to) / 2));
      frames.push({frame: clamp(seg.from), label: `${seg.id}-premotion`});
      frames.push({frame: mid, label: `${seg.id}-mid`});
      frames.push({frame: clamp(seg.to - 1), label: `${seg.id}-terminal`});
      frames.push({frame: clamp(seg.to), label: `${seg.id}-next`});
    } else {
      // Zero-frame chapter cut.
      const cut = seg.cutAtFrame ?? seg.from;
      frames.push({frame: clamp(cut - 1), label: `${seg.id}-outgoing-final`});
      frames.push({frame: clamp(cut), label: `${seg.id}-incoming-first`});
    }
  }

  // Deduplicate by frame+label.
  const seen = new Set<string>();
  return frames.filter((f) => {
    const key = `${f.frame}:${f.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
