import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeInOutQuint} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({toRadius: z.number().nonnegative().default(0)});
const ResolvedSchema = z.strictObject({toRadius: z.number().nonnegative()});
type Resolved = z.infer<typeof ResolvedSchema>;

/** shape.geometry-morph: morphs a shape's corner radius. Owns geometry. */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeInOutQuint(progress);
  return <div style={{borderRadius: `${resolved.toRadius * p}px`, overflow: 'hidden'}}>{children}</div>;
};

export const shapeGeometryMorph = defineCapability({
  id: 'shape.geometry-morph',
  version: '1.0.0',
  implementationHash: coreImplementationHash('shape.geometry-morph', '1.0.0'),
  family: 'shape',
  supportedNodeKinds: ['shape'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['geometry'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({toRadius: intent.toRadius}),
  Component,
  fixture: {intent: {toRadius: 24}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 1},
});
