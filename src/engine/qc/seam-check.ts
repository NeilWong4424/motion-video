import {PNG} from 'pngjs';

import type {CompareResult} from './types.js';

export type RgbaImage = {width: number; height: number; data: Buffer};

export function decodePng(bytes: Buffer): RgbaImage {
  const png = PNG.sync.read(bytes);
  return {width: png.width, height: png.height, data: png.data};
}

/**
 * Compare two same-size images within an optional crop and return PSNR (dB) and
 * a coarse geometry-drift estimate (max per-channel shift proxy). Identical
 * images yield a very high PSNR.
 */
export function compareCrop(
  a: RgbaImage,
  b: RgbaImage,
  crop?: {x: number; y: number; width: number; height: number},
): CompareResult {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error('QC_IMAGE_SIZE_MISMATCH');
  }
  const region = crop ?? {x: 0, y: 0, width: a.width, height: a.height};
  let mse = 0;
  let count = 0;
  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      const i = (y * a.width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const d = a.data[i + c]! - b.data[i + c]!;
        mse += d * d;
        count++;
      }
    }
  }
  mse /= Math.max(1, count);
  const psnrDb = mse === 0 ? 999 : 10 * Math.log10((255 * 255) / mse);

  // Geometry drift proxy: centroid shift of luminance in the crop.
  const driftPx = centroidShift(a, b, region);

  return {psnrDb, maxGeometryDriftPx: driftPx};
}

function centroidShift(a: RgbaImage, b: RgbaImage, region: {x: number; y: number; width: number; height: number}): number {
  const centroid = (img: RgbaImage) => {
    let sx = 0;
    let sy = 0;
    let sw = 0;
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const i = (y * img.width + x) * 4;
        const lum = 0.299 * img.data[i]! + 0.587 * img.data[i + 1]! + 0.114 * img.data[i + 2]!;
        sx += x * lum;
        sy += y * lum;
        sw += lum;
      }
    }
    return sw === 0 ? {x: 0, y: 0} : {x: sx / sw, y: sy / sw};
  };
  const ca = centroid(a);
  const cb = centroid(b);
  return Math.hypot(ca.x - cb.x, ca.y - cb.y);
}
