import type {PersistentNode} from '../../contracts/motion-spec.js';

export type TimelineSegment = {
  id: string;
  kind: 'beat' | 'bridge';
  from: number;
  to: number;
  cutAtFrame?: number;
};

export type ResolvedTimeline = {
  segments: TimelineSegment[];
  durationInFrames: number;
};

export type ResolvedNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  lines?: Array<{text: string; x: number; y: number; fontSize: number}>;
};

export type LayoutContext = {
  canvasWidth: number;
  canvasHeight: number;
  safeAreaInset: number;
};

export type LayoutService = {
  resolveNode(node: PersistentNode, context: LayoutContext): ResolvedNodeLayout;
};
