import * as React from 'react';

export type ScreenSpaceHostProps = {
  children: React.ReactNode;
};

/** Persistent overlay layer that is not affected by the global camera. */
export const ScreenSpaceHost: React.FC<ScreenSpaceHostProps> = ({children}) => (
  <div data-screen-host style={{position: 'absolute', inset: 0}}>
    {children}
  </div>
);
