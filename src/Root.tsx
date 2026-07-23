import {AbsoluteFill, Composition} from 'remotion';

const EnvironmentCheck = () => <AbsoluteFill style={{backgroundColor: '#0b0c10'}} />;

export const Root = () => (
  <Composition
    id="EnvironmentCheck"
    component={EnvironmentCheck}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={30}
  />
);
