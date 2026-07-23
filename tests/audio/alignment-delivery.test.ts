import {describe, expect, it} from 'vitest';

import {planAlignment} from '../../src/engine/audio/local-alignment-mux.js';
import {packageDelivery} from '../../src/engine/audio/delivery-packager.js';

describe('planAlignment', () => {
  const base = {
    silentVideoPath: 'v.mp4',
    musicPath: 'm.mp3',
    outputPath: 'out.mp4',
    cutPayoffFrame: 450,
    fps: 30,
    musicGainDb: -2,
    trackPayoffSeconds: 10,
  };

  it('delays the music when the cut payoff is later than the track payoff', () => {
    const plan = planAlignment({...base, trackPayoffSeconds: 10}); // cut payoff = 15s
    expect(plan.cutPayoffSeconds).toBe(15);
    expect(plan.appliedOffsetSeconds).toBeCloseTo(5);
    expect(plan.delayMilliseconds).toBe(5000);
    expect(plan.trimStartSeconds).toBe(0);
    expect(plan.filter).toContain('adelay=5000|5000');
  });

  it('trims the music head when the track payoff is later than the cut payoff', () => {
    const plan = planAlignment({...base, trackPayoffSeconds: 20}); // cut payoff = 15s
    expect(plan.appliedOffsetSeconds).toBeCloseTo(-5);
    expect(plan.trimStartSeconds).toBeCloseTo(5);
    expect(plan.delayMilliseconds).toBe(0);
    expect(plan.filter).toContain('atrim=start=5');
  });

  it('always applies the gain', () => {
    expect(planAlignment(base).filter).toContain('volume=-2dB');
  });
});

describe('packageDelivery', () => {
  it('accepts a not-provided delivery', () => {
    const manifest = packageDelivery({
      projectId: 'p', revisionId: 'rev-0001', renderPlanHash: 'a'.repeat(64),
      audioBriefHash: 'b'.repeat(64), promptAttemptHash: 'c'.repeat(64), audioStatus: 'not-provided',
    });
    expect(manifest.audioStatus).toBe('not-provided');
    expect(manifest.mixAttemptHash).toBeUndefined();
  });

  it('requires a mix hash for a mixed delivery', () => {
    const manifest = packageDelivery({
      projectId: 'p', revisionId: 'rev-0001', renderPlanHash: 'a'.repeat(64),
      audioBriefHash: 'b'.repeat(64), promptAttemptHash: 'c'.repeat(64), audioStatus: 'mixed', mixAttemptHash: 'd'.repeat(64),
    });
    expect(manifest.audioStatus).toBe('mixed');
    expect(manifest.mixAttemptHash).toBe('d'.repeat(64));
  });
});
