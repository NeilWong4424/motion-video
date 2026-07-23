import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, it} from 'vitest';

import {createRenderRepoContext} from '../helpers/create-test-repo-context.js';
import {runMotionCli} from '../../src/cli/index.js';
import {resolveProjectPaths} from '../../src/engine/project/paths.js';
import {findCurrentPlan} from '../../src/engine/renderer/resolve-project.js';
import {assertFinalRenderGate} from '../../src/engine/renderer/assert-final-render-gate.js';
import {sha256Canonical, sha256Hex} from '../../src/engine/hash.js';

const fixtureMotion = readFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'specs', 'valid-continuity.json'),
  'utf8',
);

async function resolvedProject(id: string) {
  const context = createRenderRepoContext();
  await runMotionCli(['new', id], context);
  const root = join(context.repoRoot, 'projects', id);
  const motion = JSON.parse(fixtureMotion) as {projectId: string};
  motion.projectId = id;
  writeFileSync(join(root, 'motion.spec.json'), JSON.stringify(motion));
  const brief = JSON.parse(readFileSync(join(root, 'brief.spec.json'), 'utf8')) as {projectId: string; durationSeconds: number};
  brief.projectId = id;
  brief.durationSeconds = 15;
  writeFileSync(join(root, 'brief.spec.json'), JSON.stringify(brief));
  const treatment = JSON.parse(readFileSync(join(root, 'treatment.json'), 'utf8')) as {projectId: string; transitionVocabulary: string[]};
  treatment.projectId = id;
  treatment.transitionVocabulary = ['shared-element', 'camera-navigation'];
  writeFileSync(join(root, 'treatment.json'), JSON.stringify(treatment));
  await runMotionCli(['snapshot', id], context);
  await runMotionCli(['resolve', id], context);
  const paths = resolveProjectPaths(context, id);
  const current = findCurrentPlan(paths, 'rev-0001')!;
  const previewHash = sha256Hex(readFileSync(join(current.dir, 'render.plan.json')));
  return {context, current, previewHash};
}

function writeGateArtifacts(dir: string, id: string, planHash: string, previewHash: string, opts: {qcPass?: boolean; creativeShip?: boolean; motionShip?: boolean} = {}) {
  const reviewDir = join(dir, 'review');
  mkdirSync(reviewDir, {recursive: true});
  const qc = {
    schemaVersion: 'technical-qc@1', projectId: id, revisionId: 'rev-0001', renderPlanHash: planHash,
    reviewedPreviewHash: previewHash, decision: opts.qcPass === false ? 'fail' : 'pass', diagnostics: [],
  };
  const creative = {
    schemaVersion: 'creative-review@1', reviewerRole: 'creative', projectId: id, revisionId: 'rev-0001',
    renderPlanHash: planHash, reviewedPreviewHash: previewHash, decision: opts.creativeShip === false ? 'fix' : 'ship', complete: true, issues: [],
  };
  const motion = {
    schemaVersion: 'motion-review@1', reviewerRole: 'motion', projectId: id, revisionId: 'rev-0001',
    renderPlanHash: planHash, reviewedPreviewHash: previewHash, decision: opts.motionShip === false ? 'fix' : 'ship', complete: true, issues: [],
    playbackObservations: {eyeKnowsWhereToLook: true, messageUnderstood: true, motionMotivated: true, causallyConnected: true, feelsLikeFilmNotSlides: true},
  };
  writeFileSync(join(reviewDir, 'technical-qc.json'), `${JSON.stringify(qc)}\n`);
  writeFileSync(join(reviewDir, 'creative-review.json'), `${JSON.stringify(creative)}\n`);
  writeFileSync(join(reviewDir, 'motion-review.json'), `${JSON.stringify(motion)}\n`);
  const approval = {
    schemaVersion: 'preview-approval@1', projectId: id, revisionId: 'rev-0001', renderPlanHash: planHash,
    reviewedPreviewHash: previewHash, technicalQcHash: sha256Canonical(qc), creativeReviewHash: sha256Canonical(creative),
    motionReviewHash: sha256Canonical(motion), decision: 'approved', actor: 'human', reason: 'looks correct',
  };
  writeFileSync(join(reviewDir, 'preview-approval.json'), `${JSON.stringify(approval)}\n`);
}

describe('final render gate', () => {
  it('blocks when gate artifacts are missing', async () => {
    const {current, previewHash} = await resolvedProject('gate-missing');
    const result = assertFinalRenderGate(current.dir, current.hash, previewHash);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('FINAL_GATE_INCOMPLETE');
  });

  it('passes with a complete current gate', async () => {
    const {current, previewHash} = await resolvedProject('gate-ok');
    writeGateArtifacts(current.dir, 'gate-ok', current.hash, previewHash);
    expect(assertFinalRenderGate(current.dir, current.hash, previewHash).ok).toBe(true);
  });

  it('blocks a non-ship review', async () => {
    const {current, previewHash} = await resolvedProject('gate-fix');
    writeGateArtifacts(current.dir, 'gate-fix', current.hash, previewHash, {creativeShip: false});
    const result = assertFinalRenderGate(current.dir, current.hash, previewHash);
    expect(result.ok).toBe(false);
  });

  it('invalidates when the preview hash changes (stale)', async () => {
    const {current, previewHash} = await resolvedProject('gate-stale');
    writeGateArtifacts(current.dir, 'gate-stale', current.hash, previewHash);
    const result = assertFinalRenderGate(current.dir, current.hash, 'b'.repeat(64));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('RENDER_PLAN_STALE');
  });
});
