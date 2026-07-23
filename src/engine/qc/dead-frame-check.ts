import type {RgbaImage} from './seam-check.js';

export type DeadFrameDeclaration = {
  backgroundColor: {r: number; g: number; b: number};
  tolerance?: number;
};

export type DeadFrameResult = {code: 'DEAD_FRAME_DETECTED' | 'OK'; backgroundFraction: number};

/**
 * A frame is dead when more than 99.5% of pixels equal the declared bare
 * background within tolerance. A nominal decorative anchor cannot make an
 * otherwise blank frame pass.
 */
export function detectDeadFrame(image: RgbaImage, declaration: DeadFrameDeclaration): DeadFrameResult {
  const tol = declaration.tolerance ?? 4;
  const {r, g, b} = declaration.backgroundColor;
  let background = 0;
  const total = image.width * image.height;
  for (let i = 0; i < image.data.length; i += 4) {
    if (
      Math.abs(image.data[i]! - r) <= tol &&
      Math.abs(image.data[i + 1]! - g) <= tol &&
      Math.abs(image.data[i + 2]! - b) <= tol
    ) {
      background++;
    }
  }
  const backgroundFraction = background / total;
  return {
    code: backgroundFraction > 0.995 ? 'DEAD_FRAME_DETECTED' : 'OK',
    backgroundFraction,
  };
}
