import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';

const IntentSchema = z.strictObject({amplitudePx: z.number().nonnegative().default(6), periodFrames: z.number().positive().default(120)});
const ResolvedSchema = z.strictObject({amplitudePx: z.number().nonnegative(), periodFrames: z.number().positive()});
type Resolved = z.infer<typeof ResolvedSchema>;

/**
 * ambient.drift: a subtle, deterministic ambient float driven by the current
 * frame (no randomness, no time source). Owns geometry. Decorative only.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; frame: number}> = ({
  resolved,
  frame,
  children,
}) => {
  const phase = (2 * Math.PI * frame) / resolved.periodFrames;
  const dy = Math.sin(phase) * resolved.amplitudePx;
  return <div style={{transform: `translateY(${dy}px)`}}>{children}</div>;
};

export const ambientDrift = defineCapability({
  id: 'ambient.drift',
  version: '1.0.0',
  implementationHash: coreImplementationHash('ambient.drift', '1.0.0'),
  family: 'ambient',
  supportedNodeKinds: ['shape', 'group', 'image'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({amplitudePx: intent.amplitudePx, periodFrames: intent.periodFrames}),
  Component,
  fixture: {intent: {amplitudePx: 6, periodFrames: 120}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 0},
});
