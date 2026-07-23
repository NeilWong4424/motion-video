import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeInOutQuint} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({crossfade: z.boolean().default(true)});
const ResolvedSchema = z.strictObject({crossfade: z.boolean()});
type Resolved = z.infer<typeof ResolvedSchema>;

/**
 * text.word-replace: crossfades a content-state change on the same node without
 * a hard pop. Owns content. Uses a declared content transition, not a remount.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  progress = 1,
  children,
}) => {
  const p = easeInOutQuint(progress);
  return <div style={{opacity: 0.5 + 0.5 * Math.abs(2 * p - 1)}}>{children}</div>;
};

export const textWordReplace = defineCapability({
  id: 'text.word-replace',
  version: '1.0.0',
  implementationHash: coreImplementationHash('text.word-replace', '1.0.0'),
  family: 'text',
  supportedNodeKinds: ['text'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['content'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({crossfade: intent.crossfade}),
  Component,
  fixture: {intent: {crossfade: true}},
  performanceBudget: {maxDomNodes: 4, maxSvgPaths: 0},
});
