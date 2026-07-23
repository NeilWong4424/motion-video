import {AbsoluteFill, Composition} from 'remotion';

import {projectRegistry} from './generated/project-registry.js';
import {MotionComposition} from './engine/runtime/MotionComposition.js';

const EnvironmentCheck = () => <AbsoluteFill style={{backgroundColor: '#0b0c10'}} />;

/**
 * Registers one Remotion Composition per resolved project (non-null plan).
 * Dimensions, fps, duration and default props come from the embedded RenderPlan.
 * Root never reads project files or rebuilds a plan during render.
 */
export const Root = () => (
  <>
    <Composition
      id="EnvironmentCheck"
      component={EnvironmentCheck}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30}
    />
    {projectRegistry
      .filter((entry) => entry.plan !== null)
      .map((entry) => {
        const plan = entry.plan!;
        return (
          <Composition
            key={entry.projectId}
            id={entry.projectId}
            component={MotionComposition}
            width={plan.canvas.width}
            height={plan.canvas.height}
            fps={plan.canvas.fps}
            durationInFrames={plan.durationInFrames}
            defaultProps={{plan}}
          />
        );
      })}
  </>
);
