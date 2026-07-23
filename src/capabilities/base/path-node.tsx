import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

// Sanitized path data only: a whitelist of SVG path commands and numbers.
const SAFE_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/;

export const BasePathPropsSchema = z.strictObject({
  d: z.string().regex(SAFE_PATH, 'PATH_DATA_UNSAFE'),
  width: z.number().positive(),
  height: z.number().positive(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  strokeDashoffset: z.number().optional(),
  pathLength: z.number().positive().optional(),
});

export type BasePathProps = z.infer<typeof BasePathPropsSchema>;

const BasePathComponent: React.FC<NodeRendererProps<BasePathProps>> = ({props}) => (
  <svg
    data-continuity-root="base.path"
    width={props.width}
    height={props.height}
    viewBox={`0 0 ${props.width} ${props.height}`}
  >
    <path
      d={props.d}
      fill={props.fill ?? 'none'}
      stroke={props.stroke ?? '#f5f7fa'}
      strokeWidth={props.strokeWidth ?? 2}
      strokeDashoffset={props.strokeDashoffset}
      pathLength={props.pathLength}
    />
  </svg>
);

export const basePathRenderer = defineNodeRenderer<BasePathProps>({
  id: 'base.path',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.path', '1.0.0'),
  supportedNodeKinds: ['path'],
  propsSchema: BasePathPropsSchema,
  Component: BasePathComponent,
  continuitySubnodeIds: [],
});
