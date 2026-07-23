import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

export const BaseGroupPropsSchema = z.strictObject({
  label: z.string().optional(),
});

export type BaseGroupProps = z.infer<typeof BaseGroupPropsSchema>;

const BaseGroupComponent: React.FC<NodeRendererProps<BaseGroupProps> & {children?: React.ReactNode}> = ({
  children,
}) => (
  <div data-continuity-root="base.group" style={{position: 'absolute', inset: 0}}>
    {children}
  </div>
);

export const baseGroupRenderer = defineNodeRenderer<BaseGroupProps>({
  id: 'base.group',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.group', '1.0.0'),
  supportedNodeKinds: ['group', 'ui', 'chart', 'logo'],
  propsSchema: BaseGroupPropsSchema,
  Component: BaseGroupComponent,
  continuitySubnodeIds: [],
});
