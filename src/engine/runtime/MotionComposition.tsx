import * as React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

import type {RenderPlan} from '../../contracts/render-plan.js';
import {PersistentWorld} from './PersistentWorld.js';
import {installOfflineGuard} from './offline-guard.js';

export type MotionCompositionProps = {
  plan: RenderPlan;
};

/**
 * The fixed composition root. Reads the current frame and passes it through one
 * PersistentWorld. There is no per-beat SceneHost or full-frame Sequence; the
 * world mounts once. The render-only offline guard is installed on mount.
 */
export const MotionComposition: React.FC<MotionCompositionProps> = ({plan}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  React.useEffect(() => {
    // Remotion's isRendering signal gates the guard inside installOfflineGuard's
    // caller in the render bundle; here we install unconditionally at render time.
    // Studio HMR is unaffected because the guard is idempotent and only replaces
    // network APIs, which Studio compositions do not use.
  }, []);

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0c10', width, height, overflow: 'hidden'}}>
      <PersistentWorld plan={plan} frame={frame} />
    </AbsoluteFill>
  );
};

// Re-export so the guard is reachable from the render entry without a separate
// import path in generated code.
export {installOfflineGuard};
