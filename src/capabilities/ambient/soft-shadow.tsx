import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutCubic} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({
  mode: z.enum(['drop-shadow', 'glow', 'bloom']).default('drop-shadow'),
  color: z.string().default('#000000'),
  blurPx: z.number().nonnegative().default(24),
  // Offset only used by drop-shadow.
  offsetXPx: z.number().default(0),
  offsetYPx: z.number().default(12),
  // Peak strength (opacity of the shadow / intensity of the glow), reached as progress→1.
  strength: z.number().min(0).max(1).default(0.45),
});
const ResolvedSchema = z.strictObject({
  mode: z.enum(['drop-shadow', 'glow', 'bloom']),
  color: z.string(),
  blurPx: z.number().nonnegative(),
  offsetXPx: z.number(),
  offsetYPx: z.number(),
  strength: z.number().min(0).max(1),
});
type Resolved = z.infer<typeof ResolvedSchema>;

// Convert a strength in [0,1] to an rgba() alpha suffix on a 6-digit hex color,
// or fall back to the raw color when not hex.
const HEX6 = /^#([0-9a-f]{6})$/i;
function withAlpha(color: string, alpha: number): string {
  const m = HEX6.exec(color);
  if (!m) return color;
  const h = m[1]!;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

/**
 * ambient.soft-shadow: layered depth via a CSS filter (drop-shadow / glow /
 * bloom) that fades in with the effect's progress. Owns the `filter` channel —
 * never co-place on the same node/overlapping frames as another filter effect
 * (e.g. ui.card-lift, text.highlight-sweep) or the resolver reports
 * CAPABILITY_CHANNEL_CONFLICT. Restraint principle: reserve `bloom` for the one
 * hero moment.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutCubic(progress);
  const strength = resolved.strength * p;
  const {mode, color, blurPx, offsetXPx, offsetYPx} = resolved;

  let filter: string;
  if (mode === 'drop-shadow') {
    filter = `drop-shadow(${offsetXPx}px ${offsetYPx}px ${blurPx}px ${withAlpha(color, strength)})`;
  } else if (mode === 'glow') {
    // Two stacked drop-shadows with no offset read as a soft glow halo.
    const halo = withAlpha(color, strength);
    filter = `drop-shadow(0 0 ${blurPx}px ${halo}) drop-shadow(0 0 ${blurPx * 2}px ${halo})`;
  } else {
    // bloom: brightened wide halo for the single hero payoff.
    const halo = withAlpha(color, strength);
    filter =
      `drop-shadow(0 0 ${blurPx}px ${halo}) ` +
      `drop-shadow(0 0 ${blurPx * 2.5}px ${halo}) ` +
      `brightness(${(1 + 0.25 * p).toFixed(3)})`;
  }

  return <div style={{filter, display: 'inline-block'}}>{children}</div>;
};

export const ambientSoftShadow = defineCapability({
  id: 'ambient.soft-shadow',
  version: '1.0.0',
  implementationHash: coreImplementationHash('ambient.soft-shadow', '1.0.0'),
  family: 'ambient',
  supportedNodeKinds: ['shape', 'group', 'image', 'text', 'path'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['filter'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({
    mode: intent.mode,
    color: intent.color,
    blurPx: intent.blurPx,
    offsetXPx: intent.offsetXPx,
    offsetYPx: intent.offsetYPx,
    strength: intent.strength,
  }),
  Component,
  fixture: {intent: {mode: 'drop-shadow', color: '#000000', blurPx: 24, offsetXPx: 0, offsetYPx: 12, strength: 0.45}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 0},
});
