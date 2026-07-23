import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeInOutQuint} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({color: z.string().default('#4f8cff')});
const ResolvedSchema = z.strictObject({color: z.string()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** text.highlight-sweep: sweeps a highlight bar behind text. Owns filter. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeInOutQuint(progress);
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: resolved.color,
          transformOrigin: 'left center',
          transform: `scaleX(${p})`,
          opacity: 0.25,
        }}
      />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

export const textHighlightSweep = defineCapability({
  id: 'text.highlight-sweep',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.highlight-sweep', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['filter'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({color: intent.color}),
  Component,
  fixture: {intent: {color: '#4f8cff'}},
  performanceBudget: {maxDomNodes: 4, maxSvgPaths: 0},
});
