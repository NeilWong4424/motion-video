import * as React from 'react';

export type EffectBinding = {
  id: string;
  version: string;
  fromFrame: number;
  toFrame: number;
};

export type EffectStackHostProps = {
  effects: readonly EffectBinding[];
  frame: number;
  children: React.ReactNode;
};

/**
 * Apply the ordered, already-resolved effect stack around a stable renderer. In
 * M1 the base Golden Film uses no effects, so this is a stable passthrough
 * wrapper that preserves the child's identity. Task 11 registers real effects;
 * effect components must not replace the child's continuity root.
 */
export const EffectStackHost: React.FC<EffectStackHostProps> = ({children}) => {
  return <>{children}</>;
};
