import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

export const BaseShapePropsSchema = z.strictObject({
  shape: z.enum(['rect', 'rounded-rect', 'ellipse']),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  radius: z.number().nonnegative().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
});

export type BaseShapeProps = z.infer<typeof BaseShapePropsSchema>;

const BaseShapeComponent: React.FC<NodeRendererProps<BaseShapeProps>> = ({props}) => {
  const fill = props.fill ?? '#15171e';
  const common = {
    fill,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth ?? 0,
  };
  return (
    <svg
      data-continuity-root="base.shape"
      width={props.width}
      height={props.height}
      viewBox={`0 0 ${props.width} ${props.height}`}
    >
      {props.shape === 'ellipse' ? (
        <ellipse cx={props.width / 2} cy={props.height / 2} rx={props.width / 2} ry={props.height / 2} {...common} />
      ) : (
        <rect
          x={0}
          y={0}
          width={props.width}
          height={props.height}
          rx={props.shape === 'rounded-rect' ? (props.radius ?? 16) : 0}
          {...common}
        />
      )}
    </svg>
  );
};

export const baseShapeRenderer = defineNodeRenderer<BaseShapeProps>({
  id: 'base.shape',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.shape', '1.0.0'),
  supportedNodeKinds: ['shape'],
  propsSchema: BaseShapePropsSchema,
  Component: BaseShapeComponent,
  continuitySubnodeIds: [],
});
