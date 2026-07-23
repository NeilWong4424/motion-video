import {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';

import {findBrightnessDiscontinuities} from '../../src/engine/qc/brightness-check.js';
import {detectDeadFrame} from '../../src/engine/qc/dead-frame-check.js';
import {checkCameraMotion} from '../../src/engine/qc/camera-motion-check.js';
import type {RgbaImage} from '../../src/engine/qc/seam-check.js';

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

describe('brightness discontinuities', () => {
  it('finds none in a smooth ramp', () => {
    const smooth = Array.from({length: 30}, (_, i) => 10 + i);
    expect(findBrightnessDiscontinuities(smooth)).toEqual([]);
  });

  it('flags a sudden flash', () => {
    const smooth = Array.from({length: 30}, (_, i) => 10 + i);
    const withFlash = [...smooth, 2, 100];
    expect(findBrightnessDiscontinuities(withFlash)).toContainEqual(
      expect.objectContaining({code: 'SEAM_FLASH'}),
    );
  });
});

describe('dead frame', () => {
  it('flags an all-background frame', () => {
    const frame = solid(32, 32, [11, 12, 16]);
    const result = detectDeadFrame(frame, {backgroundColor: {r: 11, g: 12, b: 16}});
    expect(result.code).toBe('DEAD_FRAME_DETECTED');
  });

  it('passes a frame with substantial content', () => {
    const frame = solid(32, 32, [11, 12, 16]);
    // Fill half with bright content.
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 16; x++) {
        const i = (y * 32 + x) * 4;
        frame.data[i] = 240;
        frame.data[i + 1] = 240;
        frame.data[i + 2] = 240;
      }
    }
    expect(detectDeadFrame(frame, {backgroundColor: {r: 11, g: 12, b: 16}}).code).toBe('OK');
  });
});

describe('camera motion', () => {
  it('passes continuous velocity', () => {
    const samples = Array.from({length: 20}, (_, i) => ({frame: i, x: i * 2, y: 0, zoom: 1}));
    expect(checkCameraMotion(samples)).toEqual([]);
  });

  it('flags a teleport/jerk', () => {
    const samples = [
      ...Array.from({length: 5}, (_, i) => ({frame: i, x: i, y: 0, zoom: 1})),
      {frame: 5, x: 500, y: 0, zoom: 1},
      {frame: 6, x: 501, y: 0, zoom: 1},
    ];
    expect(checkCameraMotion(samples)).toContainEqual(expect.objectContaining({code: 'CAMERA_JERK'}));
  });
});
