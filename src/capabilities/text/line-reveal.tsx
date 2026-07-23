import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutQuart} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({direction: z.enum(['up', 'down']).default('up')});
const ResolvedSchema = z.strictObject({direction: z.enum(['up', 'down'])});
type Resolved = z.infer<typeof ResolvedSchema>;

/** text.line-reveal: wipes a line into view behind a clip. Owns geometry. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutQuart(progress);
  const sign = resolved.direction === 'up' ? 1 : -1;
  return (
    <div style={{overflow: 'hidden', display: 'inline-block'}}>
      <div style={{transform: `translateY(${sign * (1 - p) * 100}%)`}}>{children}</div>
    </div>
  );
};

export const textLineReveal = defineCapability({
  id: 'text.line-reveal',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.line-reveal', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({direction: intent.direction}),
  Component,
  fixture: {intent: {direction: 'up'}},
  performanceBudget: {maxDomNodes: 4, maxSvgPaths: 0},
});
