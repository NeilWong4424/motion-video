import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterAll, beforeAll, describe, expect, it} from 'vitest';

import {runLocalMux} from '../../src/engine/audio/local-alignment-mux.js';

let dir: string;
let silent: string;
let tone: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'mux-'));
  silent = join(dir, 'silent.mp4');
  tone = join(dir, 'tone.wav');
  spawnSync('ffmpeg', ['-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=2', '-pix_fmt', 'yuv420p', '-y', silent], {encoding: 'utf8'});
  spawnSync('ffmpeg', ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-y', tone], {encoding: 'utf8'});
});

afterAll(() => {
  rmSync(dir, {recursive: true, force: true});
});

describe('runLocalMux (real ffmpeg)', () => {
  it('muxes aligned audio onto a copied video stream', () => {
    // Only run when the inputs were produced (ffmpeg present).
    if (!existsSync(silent) || !existsSync(tone)) return;
    const out = join(dir, 'muxed.mp4');
    const result = runLocalMux({
      silentVideoPath: silent,
      musicPath: tone,
      outputPath: out,
      cutPayoffFrame: 30,
      fps: 30,
      trackPayoffSeconds: 0.5,
      musicGainDb: -3,
    });
    expect(existsSync(out)).toBe(true);
    expect(result.outputSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.plan.delayMilliseconds).toBe(500);

    // The muxed file has both an audio and a video stream.
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', out], {encoding: 'utf8'});
    expect(probe.stdout).toContain('video');
    expect(probe.stdout).toContain('audio');
  }, 60_000);
});
