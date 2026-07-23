import * as React from 'react';

import {baseRenderers} from '../../capabilities/base/index.js';
import type {NodeRendererDefinition} from '../capability/types.js';

const rendererById = new Map<string, NodeRendererDefinition<unknown>>(
  baseRenderers.map((r) => [`${r.id}@${r.version}`, r]),
);

export type NodeRendererHostProps = {
  rendererId: string;
  rendererVersion: string;
  props: unknown;
  frame: number;
  children?: React.ReactNode;
};

/** Select the already-bound base renderer from the static core registry. */
export const NodeRendererHost: React.FC<NodeRendererHostProps> = ({
  rendererId,
  rendererVersion,
  props,
  frame,
  children,
}) => {
  const def = rendererById.get(`${rendererId}@${rendererVersion}`);
  if (!def) {
    throw new Error(`RUNTIME_RENDERER_UNKNOWN: ${rendererId}@${rendererVersion}`);
  }
  const Component = def.Component as React.ComponentType<{
    props: unknown;
    frame: number;
    children?: React.ReactNode;
  }>;
  return (
    <Component props={props} frame={frame}>
      {children}
    </Component>
  );
};
