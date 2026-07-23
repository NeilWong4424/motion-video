import * as React from 'react';

export type CameraHostProps = {
  x: number;
  y: number;
  zoom: number;
  children: React.ReactNode;
};

/**
 * Apply the one global camera transform around the declared origin. The camera
 * transforms only the WorldLayer; screen-space overlays live outside it.
 */
export const CameraHost: React.FC<CameraHostProps> = ({x, y, zoom, children}) => (
  <div
    data-camera-host
    style={{
      position: 'absolute',
      inset: 0,
      transformOrigin: 'top-left',
      transform: `scale(${zoom}) translate(${-x}px, ${-y}px)`,
    }}
  >
    {children}
  </div>
);
