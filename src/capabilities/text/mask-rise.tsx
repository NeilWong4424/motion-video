import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutExpo} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({riseFraction: z.number().min(0).max(1).default(1)});
const ResolvedSchema = z.strictObject({riseFraction: z.number().min(0).max(1)});

type Resolved = z.infer<typeof ResolvedSchema>;

/**
 * text.mask-rise: reveals text by rising it up behind a clip mask over the
 * effect window. Owns geometry + opacity channels. Never replaces the child
 * root; it wraps it in a stable clip container.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutExpo(progress);
  const translateY = (1 - p) * 100 * resolved.riseFraction;
  return (
    <div style={{overflow: 'hidden', display: 'inline-block'}}>
      <div style={{transform: `translateY(${translateY}%)`, opacity: p}}>{children}</div>
    </div>
  );
};

export const textMaskRise = defineCapability({
  id: 'text.mask-rise',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.mask-rise', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({riseFraction: intent.riseFraction}),
  Component,
  fixture: {intent: {riseFraction: 1}},
  performanceBudget: {maxDomNodes: 4, maxSvgPaths: 0},
});
