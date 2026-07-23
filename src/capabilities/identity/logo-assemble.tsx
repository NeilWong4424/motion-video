import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeInOutQuint} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({spinDeg: z.number().default(0)});
const ResolvedSchema = z.strictObject({spinDeg: z.number()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** identity.logo-assemble: assembles a logo mark by scaling and settling. Owns geometry + opacity. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeInOutQuint(progress);
  const rot = resolved.spinDeg * (1 - p);
  return (
    <div style={{transform: `scale(${0.7 + 0.3 * p}) rotate(${rot}deg)`, opacity: p, transformOrigin: 'center'}}>
      {children}
    </div>
  );
};

export const identityLogoAssemble = defineCapability({
  id: 'identity.logo-assemble',
  version: '1.0.0',
  implementationHash: coreImplementationHash('identity.logo-assemble', '1.0.0'),
  family: 'identity',
  supportedNodeKinds: ['logo', 'path', 'group'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({spinDeg: intent.spinDeg}),
  Component,
  fixture: {intent: {spinDeg: 0}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 2},
});
