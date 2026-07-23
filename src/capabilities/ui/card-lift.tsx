import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutExpo} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({liftPx: z.number().nonnegative().default(16)});
const ResolvedSchema = z.strictObject({liftPx: z.number().nonnegative()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** ui.card-lift: lifts a UI card with a shadow settle. Owns geometry + filter. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutExpo(progress);
  const lift = resolved.liftPx * p;
  const blur = 8 + 24 * p;
  return (
    <div style={{transform: `translateY(${-lift}px)`, filter: `drop-shadow(0 ${lift}px ${blur}px rgba(0,0,0,0.4))`}}>
      {children}
    </div>
  );
};

export const uiCardLift = defineCapability({
  id: 'ui.card-lift',
  version: '1.0.0',
  implementationHash: coreImplementationHash('ui.card-lift', '1.0.0'),
  family: 'ui',
  supportedNodeKinds: ['ui', 'shape', 'group'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'filter'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({liftPx: intent.liftPx}),
  Component,
  fixture: {intent: {liftPx: 16}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 0},
});
