import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutQuart} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({withArrow: z.boolean().default(false)});
const ResolvedSchema = z.strictObject({withArrow: z.boolean()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** path.connector-draw: draws a connector line, optionally revealing an arrow head. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  progress = 1,
  children,
}) => {
  const p = easeOutQuart(progress);
  return (
    <div
      style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}
    >
      {children}
    </div>
  );
};

export const connectorDraw = defineCapability({
  id: 'path.connector-draw',
  version: '1.0.0',
  implementationHash: coreImplementationHash('path.connector-draw', '1.0.0'),
  family: 'path',
  supportedNodeKinds: ['path'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['path'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({withArrow: intent.withArrow}),
  Component,
  fixture: {intent: {withArrow: false}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 2},
});
