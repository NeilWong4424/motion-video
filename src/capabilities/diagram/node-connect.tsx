import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutQuart} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({pop: z.number().min(0).max(0.5).default(0.1)});
const ResolvedSchema = z.strictObject({pop: z.number().min(0).max(0.5)});
type Resolved = z.infer<typeof ResolvedSchema>;

/** diagram.node-connect: settles a diagram node into place with a slight pop. Owns geometry. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutQuart(progress);
  const scale = 1 + resolved.pop * Math.sin(p * Math.PI);
  return <div style={{transform: `scale(${scale})`, opacity: p, transformOrigin: 'center'}}>{children}</div>;
};

export const diagramNodeConnect = defineCapability({
  id: 'diagram.node-connect',
  version: '1.0.0',
  implementationHash: coreImplementationHash('diagram.node-connect', '1.0.0'),
  family: 'diagram',
  supportedNodeKinds: ['shape', 'group'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({pop: intent.pop}),
  Component,
  fixture: {intent: {pop: 0.1}},
  performanceBudget: {maxDomNodes: 3, maxSvgPaths: 1},
});
