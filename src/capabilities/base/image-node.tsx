import * as React from 'react';
import {Img, staticFile} from 'remotion';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

// Only a validated project-owned static asset path is accepted; never a URL.
export const BaseImagePropsSchema = z.strictObject({
  staticFilePath: z.string().regex(/^generated-assets\//, 'IMAGE_PATH_INVALID'),
  width: z.number().positive(),
  height: z.number().positive(),
});

export type BaseImageProps = z.infer<typeof BaseImagePropsSchema>;

const BaseImageComponent: React.FC<NodeRendererProps<BaseImageProps>> = ({props}) => (
  <Img
    data-continuity-root="base.image"
    src={staticFile(props.staticFilePath)}
    style={{width: props.width, height: props.height, display: 'block'}}
  />
);

export const baseImageRenderer = defineNodeRenderer<BaseImageProps>({
  id: 'base.image',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.image', '1.0.0'),
  supportedNodeKinds: ['image', 'logo'],
  propsSchema: BaseImagePropsSchema,
  Component: BaseImageComponent,
  continuitySubnodeIds: [],
});
