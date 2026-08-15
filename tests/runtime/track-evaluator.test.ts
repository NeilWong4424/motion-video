import {describe, expect, it} from 'vitest';

import {evaluateTrack, type RenderTrack} from '../../src/engine/runtime/evaluate-track.js';

describe('evaluateTrack', () => {
  it('holds when interpolation is hold', () => {
    const track: RenderTrack<number> = [
      {frame: 0, value: 10, interpolation: 'hold'},
      {frame: 30, value: 20, interpolation: 'hold'},
    ];
    expect(evaluateTrack(track, 15)).toBe(10);
    expect(evaluateTrack(track, 30)).toBe(20);
  });

  it('interpolates linearly', () => {
    const track: RenderTrack<number> = [
      {frame: 0, value: 0, interpolation: 'linear'},
      {frame: 10, value: 100, interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 5)).toBe(50);
  });

  it('returns exact endpoint values at keyframe frames', () => {
    const track: RenderTrack<number> = [
      {frame: 0, value: 0, interpolation: 'ease', easing: 'easeOutExpo'},
      {frame: 60, value: 300, interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 0)).toBe(0);
    expect(evaluateTrack(track, 60)).toBe(300);
  });

  it('clamps before the first and after the last keyframe', () => {
    const track: RenderTrack<number> = [
      {frame: 10, value: 5, interpolation: 'linear'},
      {frame: 20, value: 15, interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 0)).toBe(5);
    expect(evaluateTrack(track, 100)).toBe(15);
  });

  it('interpolates object geometry component-wise', () => {
    const track: RenderTrack<{x: number; y: number}> = [
      {frame: 0, value: {x: 0, y: 0}, interpolation: 'linear'},
      {frame: 10, value: {x: 100, y: 50}, interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 5)).toEqual({x: 50, y: 25});
  });

  it('applies eased easing monotonically', () => {
    const track: RenderTrack<number> = [
      {frame: 0, value: 0, interpolation: 'ease', easing: 'easeOutQuart'},
      {frame: 100, value: 100, interpolation: 'linear'},
    ];
    const mid = evaluateTrack(track, 50);
    // easeOutQuart is ahead of linear at the midpoint.
    expect(mid).toBeGreaterThan(50);
  });

  it('interpolates matching 6-digit hex colors in RGB', () => {
    const track: RenderTrack<string> = [
      {frame: 0, value: '#000000', interpolation: 'linear'},
      {frame: 10, value: '#ffffff', interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 5)).toBe('#808080');
    expect(evaluateTrack(track, 0)).toBe('#000000');
    expect(evaluateTrack(track, 10)).toBe('#ffffff');
  });

  it('interpolates hex color inside a style object per key', () => {
    const track: RenderTrack<{opacity: number; color: string}> = [
      {frame: 0, value: {opacity: 0, color: '#000000'}, interpolation: 'linear'},
      {frame: 10, value: {opacity: 1, color: '#ffffff'}, interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 5)).toEqual({opacity: 0.5, color: '#808080'});
  });

  it('regression: non-hex color strings still snap to destination on arrival', () => {
    const track: RenderTrack<string> = [
      {frame: 0, value: 'red', interpolation: 'linear'},
      {frame: 10, value: 'blue', interpolation: 'linear'},
    ];
    // Held before arrival, snapped at/after the destination frame.
    expect(evaluateTrack(track, 5)).toBe('red');
    expect(evaluateTrack(track, 10)).toBe('blue');
  });

  it('regression: mismatched color notations (hex vs named) snap, not lerp', () => {
    const track: RenderTrack<string> = [
      {frame: 0, value: '#000000', interpolation: 'linear'},
      {frame: 10, value: 'white', interpolation: 'linear'},
    ];
    expect(evaluateTrack(track, 5)).toBe('#000000');
    expect(evaluateTrack(track, 10)).toBe('white');
  });
});
