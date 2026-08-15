import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

// A gradient stop: offset in [0,1], a color, and optional per-stop opacity.
const GradientStopSchema = z.strictObject({
  offset: z.number().min(0).max(1),
  color: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
});

const LinearGradientSchema = z.strictObject({
  type: z.literal('linear'),
  // Angle in degrees, 0 = left→right, 90 = top→bottom.
  angleDeg: z.number().optional(),
  stops: z.array(GradientStopSchema).min(2),
});

const RadialGradientSchema = z.strictObject({
  type: z.literal('radial'),
  // Center + radius as fractions of the box (0..1); defaults to centered full-cover.
  center: z.strictObject({x: z.number(), y: z.number()}).optional(),
  radius: z.number().positive().optional(),
  stops: z.array(GradientStopSchema).min(2),
});

const GradientSchema = z.discriminatedUnion('type', [LinearGradientSchema, RadialGradientSchema]);

export const BaseGradientShapePropsSchema = z.strictObject({
  shape: z.enum(['rect', 'rounded-rect', 'ellipse']),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  radius: z.number().nonnegative().optional(),
  gradient: GradientSchema,
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
});

export type BaseGradientShapeProps = z.infer<typeof BaseGradientShapePropsSchema>;

// Deterministic short id from the gradient definition + geometry. Identical
// gradients share a <defs> id; distinct ones cannot collide. Fully deterministic
// (no useId / random) so render output is byte-stable for pixel-diff QC.
function gradientKey(props: BaseGradientShapeProps): string {
  const json = JSON.stringify([props.shape, props.width, props.height, props.radius ?? 0, props.gradient]);
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}

// Map a linear angle (deg) to SVG userSpaceOnUse endpoint fractions.
function linearCoords(angleDeg: number): {x1: number; y1: number; x2: number; y2: number} {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Center the gradient line on (0.5,0.5) and project to the box edges.
  const x1 = 0.5 - dx / 2;
  const y1 = 0.5 - dy / 2;
  const x2 = 0.5 + dx / 2;
  const y2 = 0.5 + dy / 2;
  return {x1, y1, x2, y2};
}

const BaseGradientShapeComponent: React.FC<NodeRendererProps<BaseGradientShapeProps>> = ({props}) => {
  const id = `grad-${gradientKey(props)}`;
  const g = props.gradient;
  const stops = g.stops.map((s, i) => (
    <stop key={`s-${i}`} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
  ));

  const defs =
    g.type === 'linear' ? (
      (() => {
        const {x1, y1, x2, y2} = linearCoords(g.angleDeg ?? 0);
        return (
          <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {stops}
          </linearGradient>
        );
      })()
    ) : (
      <radialGradient
        id={id}
        cx={g.center?.x ?? 0.5}
        cy={g.center?.y ?? 0.5}
        r={g.radius ?? 0.5}
      >
        {stops}
      </radialGradient>
    );

  const common = {
    fill: `url(#${id})`,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth ?? 0,
  };

  return (
    <svg
      data-continuity-root="base.gradient-shape"
      width={props.width}
      height={props.height}
      viewBox={`0 0 ${props.width} ${props.height}`}
    >
      <defs>{defs}</defs>
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

export const baseGradientShapeRenderer = defineNodeRenderer<BaseGradientShapeProps>({
  id: 'base.gradient-shape',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.gradient-shape', '1.0.0'),
  supportedNodeKinds: ['shape'],
  propsSchema: BaseGradientShapePropsSchema,
  Component: BaseGradientShapeComponent,
  continuitySubnodeIds: [],
});
