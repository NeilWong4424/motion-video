import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutBack, clamp01} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({
  // The effect subdivides its OWN copy of the source string (effects cannot
  // reliably introspect child text), so the author passes it here. This is a
  // small, documented duplication of the base.text `text` prop. Typography must
  // also be passed so the effect's glyph spans match the hero scale of the
  // underlying base.text (otherwise glyphs render at the browser default size).
  text: z.string().default('TITLE'),
  fontSizePx: z.number().positive().default(64),
  fontWeight: z.number().default(800),
  color: z.string().default('#f5f7fa'),
  unit: z.enum(['glyph', 'word']).default('glyph'),
  // Fraction of the window each unit's own reveal occupies; the rest is the
  // per-unit stagger offset. 0.5 => the last unit starts halfway through.
  unitDurationFraction: z.number().min(0.05).max(1).default(0.5),
  risePx: z.number().nonnegative().default(28),
  blurPx: z.number().nonnegative().default(6),
});
const ResolvedSchema = z.strictObject({
  text: z.string(),
  fontSizePx: z.number().positive(),
  fontWeight: z.number(),
  color: z.string(),
  unit: z.enum(['glyph', 'word']),
  unitDurationFraction: z.number().min(0.05).max(1),
  risePx: z.number().nonnegative(),
  blurPx: z.number().nonnegative(),
});
type Resolved = z.infer<typeof ResolvedSchema>;

function splitUnits(text: string, unit: 'glyph' | 'word'): string[] {
  if (unit === 'word') return text.split(/(\s+)/); // keep whitespace tokens for layout
  return Array.from(text); // per-character (code-point aware)
}

/**
 * text.kinetic-reveal: the first effect that truly subdivides text — it renders
 * each glyph/word as its own span and staggers a rise + blur-in + subtle
 * overshoot per unit. Owns geometry + opacity, so it must be the SOLE enter
 * effect on its node (disjoint from mask-rise / word-stagger / line-reveal, which
 * also own those channels). Units resolve (settle) rather than wobble.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
}) => {
  const units = splitUnits(resolved.text, resolved.unit);
  const n = units.length;
  const dur = resolved.unitDurationFraction;
  // Stagger window: unit i starts at start_i and finishes dur later, with the
  // last unit finishing exactly at progress=1.
  const totalStagger = 1 - dur;

  return (
    <div
      style={{
        whiteSpace: 'pre',
        display: 'inline-block',
        fontSize: resolved.fontSizePx,
        fontWeight: resolved.fontWeight,
        color: resolved.color,
        lineHeight: 1,
      }}
    >
      {units.map((u, i) => {
        const start = n <= 1 ? 0 : totalStagger * (i / (n - 1));
        const local = clamp01((progress - start) / dur);
        const p = easeOutBack(local);
        const dy = (1 - p) * resolved.risePx;
        const blur = (1 - clamp01(local)) * resolved.blurPx;
        return (
          <span
            key={`u-${i}`}
            style={{
              display: 'inline-block',
              opacity: clamp01(local),
              transform: `translateY(${dy.toFixed(2)}px)`,
              filter: blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : undefined,
              whiteSpace: 'pre',
            }}
          >
            {u === ' ' ? ' ' : u}
          </span>
        );
      })}
    </div>
  );
};

export const textKineticReveal = defineCapability({
  id: 'text.kinetic-reveal',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.kinetic-reveal', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({
    text: intent.text,
    fontSizePx: intent.fontSizePx,
    fontWeight: intent.fontWeight,
    color: intent.color,
    unit: intent.unit,
    unitDurationFraction: intent.unitDurationFraction,
    risePx: intent.risePx,
    blurPx: intent.blurPx,
  }),
  Component,
  fixture: {intent: {text: 'TITLE', fontSizePx: 64, fontWeight: 800, color: '#f5f7fa', unit: 'glyph', unitDurationFraction: 0.5, risePx: 28, blurPx: 6}},
  performanceBudget: {maxDomNodes: 64, maxSvgPaths: 0},
});
