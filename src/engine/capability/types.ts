import type * as React from 'react';
import type {z} from 'zod';

import type {NodeKind} from '../../contracts/common.js';

export type MotionChannel = 'geometry' | 'opacity' | 'content' | 'style' | 'path' | 'filter';

export type CapabilityScope = 'core' | `project:${string}`;

export type NodeRendererProps<P> = {
  props: P;
  frame: number;
};

export type NodeRendererDefinition<P> = {
  id: string;
  version: string;
  implementationHash: string;
  supportedNodeKinds: readonly NodeKind[];
  propsSchema: z.ZodType<P>;
  Component: React.ComponentType<NodeRendererProps<P>>;
  continuitySubnodeIds: readonly string[];
};

export type CapabilityResolveContext = {
  seed: string;
  fps: number;
  fromFrame: number;
  toFrame: number;
};

export type CapabilityRenderProps<R> = {
  resolved: R;
  frame: number;
  /** Normalized 0..1 progress within the effect's resolved window. */
  progress?: number;
  children?: React.ReactNode;
};

export type CapabilityFixture = {
  intent: unknown;
};

export type MotionCapabilityDefinition<I, R> = {
  id: string;
  version: string;
  implementationHash: string;
  family: 'text' | 'shape' | 'path' | 'diagram' | 'data' | 'ui' | 'identity' | 'ambient';
  supportedNodeKinds: readonly NodeKind[];
  intentSchema: z.ZodType<I>;
  resolvedSchema: z.ZodType<R>;
  ownedChannels: readonly MotionChannel[];
  continuity: {
    stableRoot: true;
    continuitySubnodeIds: readonly string[];
  };
  resolve: (intent: I, context: CapabilityResolveContext) => R;
  Component: React.ComponentType<CapabilityRenderProps<R>>;
  fixture: CapabilityFixture;
  performanceBudget: {maxDomNodes: number; maxSvgPaths: number};
};

export type CapabilityManifestEntry = {
  kind: 'renderer' | 'effect';
  id: string;
  version: string;
  implementationHash: string;
  scope: CapabilityScope;
  supportedNodeKinds: readonly NodeKind[];
  ownedChannels?: readonly MotionChannel[];
  family?: string;
};

export const CAPABILITY_ID_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
export const CAPABILITY_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
