import * as React from 'react';
import {z} from 'zod';

import {defineCapability} from '../../engine/capability/define-capability.js';
import type {CapabilityRenderProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from '../base/manifest-hash.js';
import {easeInOutQuint} from '../../engine/runtime/easing.js';

const IntentSchema = z.strictObject({pathLength: z.number().positive().default(1000)});
const ResolvedSchema = z.strictObject({pathLength: z.number().positive()});
type Resolved = z.infer<typeof ResolvedSchema>;

/**
 * path.path-draw: draws a stroked path from start to end via stroke-dashoffset.
 * Owns the path channel. Wraps the child path in a stable container.
 */
const Component: React.FC<CapabilityRenderProps<Resolved> & {children?: React.ReactNode; progress?: number}> = ({
  resolved,
  progress = 1,
  children,
}) => {
  const p = easeInOutQuint(progress);
  const offset = resolved.pathLength * (1 - p);
  return (
    <div
      style={
        {
          ['--path-length' as string]: `${resolved.pathLength}`,
          ['--path-offset' as string]: `${offset}`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export const pathDraw = defineCapability({
  id: 'path.path-draw',
  version: '1.0.0',
  implementationHash: coreImplementationHash('path.path-draw', '1.0.0'),
  family: 'path',
  supportedNodeKinds: ['path'],
  intentSchema: IntentSchema,
  resolvedSchema: ResolvedSchema,
  ownedChannels: ['path'],
  continuity: {stableRoot: true, continuitySubnodeIds: []},
  resolve: (intent) => ({pathLength: intent.pathLength}),
  Component,
  fixture: {intent: {pathLength: 1000}},
  performanceBudget: {maxDomNodes: 2, maxSvgPaths: 1},
});
