import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutExpo} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({fromTrackingEm: z.number().default(0.3)});
const ResolvedSchema = z.strictObject({fromTrackingEm: z.number()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** text.tracking-resolve: settles letter-spacing to zero. Owns style. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutExpo(progress);
  const tracking = resolved.fromTrackingEm * (1 - p);
  return <div style={{letterSpacing: `${tracking}em`}}>{children}</div>;
};

export const textTrackingResolve = defineCapability({
  id: 'text.tracking-resolve',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.tracking-resolve', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['style'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({fromTrackingEm: intent.fromTrackingEm}),
  Component,
  fixture: {intent: {fromTrackingEm: 0.3}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 0},
});
