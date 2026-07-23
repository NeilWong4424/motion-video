import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeOutQuart} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({staggerMs: z.number().nonnegative().default(60)});
const ResolvedSchema = z.strictObject({staggerFraction: z.number().min(0).max(1)});
type Resolved = z.infer<typeof ResolvedSchema>;

/** text.word-stagger: fades words in on an eased stagger. Owns opacity. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  progress = 1,
  children,
}) => {
  const p = easeOutQuart(progress);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * 8}px)`}}>{children}</div>;
};

export const textWordStagger = defineCapability({
  id: 'text.word-stagger',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.word-stagger', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['opacity'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({staggerFraction: Math.min(1, intent.staggerMs / 1000)}),
  Component,
  fixture: {intent: {staggerMs: 60}},
  performanceBudget: {maxDomNodes: 8, maxSvgPaths: 0},
});
