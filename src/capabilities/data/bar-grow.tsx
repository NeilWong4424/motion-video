import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutExpo} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({origin: z.enum(['bottom', 'left']).default('bottom')});
const ResolvedSchema = z.strictObject({origin: z.enum(['bottom', 'left'])});
type Resolved = z.infer<typeof ResolvedSchema>;

/** data.bar-grow: grows a bar from a baseline. Owns geometry. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutExpo(progress);
  const axis = resolved.origin === 'bottom' ? 'scaleY' : 'scaleX';
  const origin = resolved.origin === 'bottom' ? 'bottom center' : 'left center';
  return <div style={{transform: `${axis}(${p})`, transformOrigin: origin}}>{children}</div>;
};

export const dataBarGrow = defineCapability({
  id: 'data.bar-grow',
  version: '1.0.0',
  implementationHash: coreImplementationHash('data.bar-grow', '1.0.0'),
  family: 'data',
  supportedNodeKinds: ['shape', 'chart'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({origin: intent.origin}),
  Component,
  fixture: {intent: {origin: 'bottom'}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 1},
});
