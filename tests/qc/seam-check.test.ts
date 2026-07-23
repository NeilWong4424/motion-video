import {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';

import {compareCrop, type RgbaImage} from '../../src/engine/qc/seam-check.js';

function solid(width: number, height: number, rgb: [number, number, number]): RgbaImage {
  const png = new PNG({width, height});
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgb[0];
    png.data[i + 1] = rgb[1];
    png.data[i + 2] = rgb[2];
    png.data[i + 3] = 255;
  }
  return {width, height, data: png.data};
}

function withBlock(base: RgbaImage, x: number, y: number, w: number, h: number, rgb: [number, number, number]): RgbaImage {
  const data = Buffer.from(base.data);
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const i = (yy * base.width + xx) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }
  return {width: base.width, height: base.height, data};
}

describe('compareCrop', () => {
  it('reports very high PSNR for identical images', () => {
    const a = solid(64, 64, [20, 20, 20]);
    const b = solid(64, 64, [20, 20, 20]);
    expect(compareCrop(a, b).psnrDb).toBeGreaterThan(60);
  });

  it('reports geometry drift when a block shifts', () => {
    const base = solid(64, 64, [10, 10, 10]);
    const a = withBlock(base, 10, 10, 8, 8, [240, 240, 240]);
    const b = withBlock(base, 30, 10, 8, 8, [240, 240, 240]);
    expect(compareCrop(a, b).maxGeometryDriftPx).toBeGreaterThan(1);
  });
});
