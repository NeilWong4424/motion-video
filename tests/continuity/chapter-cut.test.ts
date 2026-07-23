import {describe, expect, it} from 'vitest';

import {validateContinuity} from '../../src/engine/resolver/validate-continuity.js';
import {codes} from '../../src/engine/resolver/continuity-diagnostics.js';
import {loadSpec, makeTreatment} from './helpers.js';
import type {ChapterCutBridgeSchema} from '../../src/contracts/motion-spec.js';
import type {z} from 'zod';

type ChapterCut = z.infer<typeof ChapterCutBridgeSchema>;

describe('chapter cut', () => {
  it('accepts one justified time-jump cut within budget', () => {
    const spec = loadSpec('justified-chapter-cut');
    const result = codes(
      validateContinuity(makeTreatment({chapterCutBudget: 1, transitionVocabulary: ['shared-element']}), spec),
    );
    expect(result).not.toContain('UNJUSTIFIED_CHAPTER_CUT');
    expect(result).not.toContain('CHAPTER_CUT_V1_LIMIT_EXCEEDED');
  });

  it('flags a zero-budget treatment with a cut', () => {
    const spec = loadSpec('justified-chapter-cut');
    const result = codes(
      validateContinuity(makeTreatment({chapterCutBudget: 0, transitionVocabulary: ['shared-element']}), spec),
    );
    expect(result).toContain('CHAPTER_CUT_BUDGET_EXCEEDED');
  });

  it('flags a cut whose eye-trace exceeds the declared maximum', () => {
    const spec = structuredClone(loadSpec('justified-chapter-cut'));
    const cut = spec.timeline.bridges.find((b) => b.mode === 'chapter-cut') as ChapterCut;
    cut.eyeTrace.incoming.point = {x: 0.95, y: 0.95};
    const result = codes(
      validateContinuity(makeTreatment({chapterCutBudget: 1, transitionVocabulary: ['shared-element']}), spec),
    );
    expect(result).toContain('EYE_TRACE_JUMP');
  });

  it('flags an unjustified cut with an empty exception justification', () => {
    const spec = structuredClone(loadSpec('justified-chapter-cut'));
    const cut = spec.timeline.bridges.find((b) => b.mode === 'chapter-cut') as ChapterCut;
    cut.exceptionJustification = '   ';
    const result = codes(
      validateContinuity(makeTreatment({chapterCutBudget: 1, transitionVocabulary: ['shared-element']}), spec),
    );
    expect(result).toContain('UNJUSTIFIED_CHAPTER_CUT');
  });
});
