import {describe, expect, it} from 'vitest';

import {validateContinuity} from '../../src/engine/resolver/validate-continuity.js';
import {detectSlideReset} from '../../src/engine/resolver/detect-slide-reset.js';
import {codes} from '../../src/engine/resolver/continuity-diagnostics.js';
import {loadSpec, makeTreatment} from './helpers.js';

describe('invalid slide deck', () => {
  it('emits consecutive-cut and slide-like diagnostics', () => {
    const spec = loadSpec('invalid-slide-deck');
    const result = codes(validateContinuity(makeTreatment({transitionVocabulary: ['shared-element']}), spec));
    expect(result).toEqual(
      expect.arrayContaining(['CONSECUTIVE_CHAPTER_CUTS', 'SLIDE_LIKE_CUT_PATTERN']),
    );
  });

  it('exceeds the V1 chapter-cut limit regardless of the treatment budget', () => {
    const spec = loadSpec('invalid-slide-deck');
    const result = codes(validateContinuity(makeTreatment({chapterCutBudget: 1}), spec));
    expect(result).toContain('CHAPTER_CUT_V1_LIMIT_EXCEEDED');
  });

  it('rejects a tiny decorative anchor as non-salient and slide-like', () => {
    const spec = loadSpec('invalid-tiny-anchor');
    const result = codes(detectSlideReset(spec));
    expect(result).toEqual(expect.arrayContaining(['ANCHOR_NOT_SALIENT', 'SLIDE_LIKE_CUT_PATTERN']));
  });
});
