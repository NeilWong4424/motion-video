import * as React from 'react';
import {z} from 'zod';

import {defineNodeRenderer} from '../../engine/capability/define-node-renderer.js';
import type {NodeRendererProps} from '../../engine/capability/types.js';
import {coreImplementationHash} from './manifest-hash.js';

export const BaseIsoStackPropsSchema = z.strictObject({
  columns: z.number().int().positive(),
  rows: z.number().int().positive(),
  cubeSize: z.number().positive().default(48),
  gap: z.number().nonnegative().default(6),
  baseColor: z.string().default('#4f8cff'),
  // Isometric depth of the top/side faces, as a fraction of cubeSize.
  depthFraction: z.number().min(0.1).max(1).default(0.5),
});

export type BaseIsoStackProps = z.infer<typeof BaseIsoStackPropsSchema>;

// Shade a 6-digit hex toward white (amount>0) or black (amount<0). Non-hex
// colors pass through unchanged.
const HEX6 = /^#([0-9a-f]{6})$/i;
function shade(color: string, amount: number): string {
  const m = HEX6.exec(color);
  if (!m) return color;
  const h = m[1]!;
  let out = '#';
  for (let i = 0; i < 6; i += 2) {
    const c = parseInt(h.slice(i, i + 2), 16);
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    out += Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  }
  return out;
}

function num(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

// One isometric cube at top-left (ox,oy). Returns three shaded face paths:
// top (lightest), left (mid), right (darkest) — single consistent light.
function cubeFaces(
  ox: number,
  oy: number,
  size: number,
  depth: number,
  baseColor: string,
  keyPrefix: string,
): React.ReactNode[] {
  const topColor = shade(baseColor, 0.35);
  const leftColor = baseColor;
  const rightColor = shade(baseColor, -0.3);

  // A simple oblique projection: top face is a parallelogram skewed by `depth`.
  const x0 = ox;
  const x1 = ox + size;
  const yTop = oy;
  const yBot = oy + size;
  const dx = depth;
  const dy = depth;

  // Top face (skewed quad above the front).
  const top = `M ${num(x0)} ${num(yTop)} L ${num(x1)} ${num(yTop)} L ${num(x1 + dx)} ${num(yTop - dy)} L ${num(x0 + dx)} ${num(yTop - dy)} Z`;
  // Left/front face (the main square).
  const left = `M ${num(x0)} ${num(yTop)} L ${num(x1)} ${num(yTop)} L ${num(x1)} ${num(yBot)} L ${num(x0)} ${num(yBot)} Z`;
  // Right face (skewed quad to the right).
  const right = `M ${num(x1)} ${num(yTop)} L ${num(x1 + dx)} ${num(yTop - dy)} L ${num(x1 + dx)} ${num(yBot - dy)} L ${num(x1)} ${num(yBot)} Z`;

  return [
    <path key={`${keyPrefix}-r`} d={right} fill={rightColor} />,
    <path key={`${keyPrefix}-l`} d={left} fill={leftColor} />,
    <path key={`${keyPrefix}-t`} d={top} fill={topColor} />,
  ];
}

/**
 * base.iso-stack: a grid of faux-3D isometric cubes drawn as three shaded SVG
 * face paths each (top lightest / front mid / right darkest under one light).
 * No real 3D transforms — pure 2D shaded parallelograms. Growth/count-up is
 * done by wrapping with shape.shape-reveal (clip) or data.bar-grow rather than
 * per-cube prop animation (renderer props are not track-driven).
 */
const BaseIsoStackComponent: React.FC<NodeRendererProps<BaseIsoStackProps>> = ({props}) => {
  const {columns, rows, cubeSize, gap, baseColor} = props;
  const depth = cubeSize * props.depthFraction;
  const stride = cubeSize + gap;
  // Reserve room for the depth skew on the top and right.
  const width = columns * stride - gap + depth;
  const height = rows * stride - gap + depth;

  const faces: React.ReactNode[] = [];
  // Draw back-to-front (top rows first) so nearer cubes overlap correctly.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const ox = c * stride;
      const oy = depth + r * stride;
      faces.push(...cubeFaces(ox, oy, cubeSize, depth, baseColor, `${r}-${c}`));
    }
  }

  return (
    <svg
      data-continuity-root="base.iso-stack"
      width={width}
      height={height}
      viewBox={`0 0 ${num(width)} ${num(height)}`}
    >
      {faces}
    </svg>
  );
};

export const baseIsoStackRenderer = defineNodeRenderer<BaseIsoStackProps>({
  id: 'base.iso-stack',
  version: '1.0.0',
  implementationHash: coreImplementationHash('base.iso-stack', '1.0.0'),
  supportedNodeKinds: ['shape'],
  propsSchema: BaseIsoStackPropsSchema,
  Component: BaseIsoStackComponent,
  continuitySubnodeIds: [],
});
