import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutExpo} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({from: z.enum(['scale', 'clip']).default('scale')});
const ResolvedSchema = z.strictObject({from: z.enum(['scale', 'clip'])});
type Resolved = z.infer<typeof ResolvedSchema>;

/** shape.shape-reveal: reveals a shape by scaling or clipping in. Owns geometry. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeOutExpo(progress);
  if (resolved.from === 'clip') {
    return <div style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{children}</div>;
  }
  return <div style={{transform: `scale(${0.6 + 0.4 * p})`, opacity: p, transformOrigin: 'center'}}>{children}</div>;
};

export const shapeReveal = defineCapability({
  id: 'shape.shape-reveal',
  version: '1.0.0',
  implementationHash: coreImplementationHash('shape.shape-reveal', '1.0.0'),
  family: 'shape',
  supportedNodeKinds: ['shape'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry', 'opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({from: intent.from}),
  Component,
  fixture: {intent: {from: 'scale'}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 1},
});
