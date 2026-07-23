import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

import {sha256Hex} from '../hash.js';

export type MuxInput = {
  silentVideoPath: string;
  musicPath: string;
  outputPath: string;
  cutPayoffFrame: number;
  fps: number;
  trackPayoffSeconds: number;
  musicGainDb: number;
};

export type MuxPlan = {
  cutPayoffSeconds: number;
  appliedOffsetSeconds: number;
  trimStartSeconds: number;
  delayMilliseconds: number;
  filter: string;
};

/**
 * Compute the deterministic alignment plan: shift the music so its declared
 * payoff second lands exactly on the cut's payoff frame. Positive offset delays
 * the music; negative trims its head. Audio is time-shifted only — picture is
 * never retimed or recut.
 */
export function planAlignment(input: MuxInput): MuxPlan {
  const cutPayoffSeconds = input.cutPayoffFrame / input.fps;
  const appliedOffsetSeconds = cutPayoffSeconds - input.trackPayoffSeconds;
  const delayMilliseconds = appliedOffsetSeconds > 0 ? Math.round(appliedOffsetSeconds * 1000) : 0;
  const trimStartSeconds = appliedOffsetSeconds < 0 ? -appliedOffsetSeconds : 0;

  const parts: string[] = [];
  if (trimStartSeconds > 0) parts.push(`atrim=start=${trimStartSeconds.toFixed(6)}`, 'asetpts=PTS-STARTPTS');
  if (delayMilliseconds > 0) parts.push(`adelay=${delayMilliseconds}|${delayMilliseconds}`);
  parts.push(`volume=${input.musicGainDb}dB`);

  return {
    cutPayoffSeconds,
    appliedOffsetSeconds,
    trimStartSeconds,
    delayMilliseconds,
    filter: parts.join(','),
  };
}

export type MuxResult = {
  plan: MuxPlan;
  outputSha256: string;
  sourceMusicSha256: string;
  silentVideoSha256: string;
};

/**
 * Run the local ffmpeg mux: apply the alignment filter to the music and mux it
 * with the silent video copied stream-for-stream (`-c:v copy`). ffmpeg is the
 * only subprocess; no network, no picture re-encode.
 */
export function runLocalMux(input: MuxInput): MuxResult {
  const plan = planAlignment(input);
  const args = [
    '-y',
    '-i', input.silentVideoPath,
    '-i', input.musicPath,
    '-filter_complex', `[1:a]${plan.filter}[a]`,
    '-map', '0:v',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    input.outputPath,
  ];
  const result = spawnSync('ffmpeg', args, {encoding: 'utf8'});
  if (result.error || result.status !== 0) {
    throw new Error(`AUDIO_MUX_FAILED: ${result.stderr?.slice(-400) ?? result.error?.message ?? 'unknown'}`);
  }

  return {
    plan,
    outputSha256: sha256Hex(readFileSync(input.outputPath)),
    sourceMusicSha256: sha256Hex(readFileSync(input.musicPath)),
    silentVideoSha256: sha256Hex(readFileSync(input.silentVideoPath)),
  };
}
