import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

const TextLineSchema = z.strictObject({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  fontSize: z.number().positive(),
});

export const BaseTextPropsSchema = z.strictObject({
  text: z.string(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lines: z.array(TextLineSchema).optional(),
});

export type BaseTextProps = z.infer<typeof BaseTextPropsSchema>;

const BaseTextComponent: React.FC<NodeRendererProps<BaseTextProps>> = ({props}) => {
  const color = props.color ?? '#f5f7fa';
  const fontFamily = props.fontFamily ?? 'sans-serif';
  const fontWeight = props.fontWeight ?? 400;
  // The geometry root is a single stable <div>; content changes never replace it.
  return (
    <div data-continuity-root="base.text" style={{color, fontFamily, fontWeight, whiteSpace: 'pre'}}>
      {props.lines
        ? props.lines.map((line, i) => (
            <div
              key={`line-${i}`}
              style={{position: 'absolute', left: line.x, top: line.y, fontSize: line.fontSize}}
            >
              {line.text}
            </div>
          ))
        : props.text}
    </div>
  );
};

export const baseTextRenderer = defineNodeRenderer<BaseTextProps>({
  id: 'base.text',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.text', '1.0.0'),
  supportedNodeKinds: ['text'],
  propsSchema: BaseTextPropsSchema,
  Component: BaseTextComponent,
  continuitySubnodeIds: [],
});
