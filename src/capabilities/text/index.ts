import type {CapabilityRegistry} from '../../engine/capability/registry.js';
import type {MotionCapabilityDefinition} from '../../engine/capability/types.js';
import {textMaskRise} from './mask-rise.js';
import {textWordStagger} from './word-stagger.js';
import {textLineReveal} from './line-reveal.js';
import {textTrackingResolve} from './tracking-resolve.js';
import {textHighlightSweep} from './highlight-sweep.js';
import {textWordReplace} from './word-replace.js';

export {
  textMaskRise,
  textWordStagger,
  textLineReveal,
  textTrackingResolve,
  textHighlightSweep,
  textWordReplace,
};

export const textEffects: readonly MotionCapabilityDefinition<unknown, unknown>[] = [
  textMaskRise,
  textWordStagger,
  textLineReveal,
  textTrackingResolve,
  textHighlightSweep,
  textWordReplace,
] as MotionCapabilityDefinition<unknown, unknown>[];

export function registerTextEffects(registry: CapabilityRegistry): void {
  for (const effect of textEffects) registry.registerEffect(effect, 'core');
}
