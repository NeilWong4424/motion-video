import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {
  anchorRepoRoot,
  buildNextEvent,
  classifyLedger,
  reduce,
  serializeEventLine,
  type LedgerEvent,
  type LedgerEventBindingProjection,
  type RepoRootAnchor,
} from '../../src/engine/ledger/index.js';
import {projectDurableInstructionText} from '../../src/engine/ledger/redaction.js';
import {jcsCanonical} from '../../src/engine/ledger/jcs.js';
import {acceptArtifact, writeCandidate} from '../../src/engine/acceptance/index.js';

let root: string;
let anchor: RepoRootAnchor;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'vertical-'));
  anchor = anchorRepoRoot(root);
});

afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

const PROJECT = 'world-cup';
const REQUEST = 'request-0001';
const CANDIDATE_PATH =
  'projects/world-cup/.workflow/candidates/request-0001/candidate-0001/brief.spec.json';

function next(
  prev: LedgerEvent | null,
  eventKind: LedgerEventBindingProjection['eventKind'],
  payload: LedgerEventBindingProjection['payload'],
): LedgerEvent {
  const binding: LedgerEventBindingProjection = {
    schemaVersion: 'workflow-ledger-event@1',
    sequence: prev ? prev.sequence + 1 : 1,
    projectId: PROJECT,
    requestId: REQUEST,
    previousEventHash: prev ? prev.eventHash : null,
    eventKind,
    payload,
  };
  return buildNextEvent(binding, prev, reduce);
}

function briefCandidateBytes(): string {
  return jcsCanonical({
    schemaVersion: 'brief@1',
    artifactKind: 'brief',
    artifactPath: CANDIDATE_PATH,
    projectId: PROJECT,
    revisionId: null,
    semanticProducer: 'brief-planner',
    expectedSchemaVersion: 'brief@1',
    acceptanceContext: {acceptanceRouteId: 'initial-brief', artifactKind: 'brief', successState: 'TREATMENT'},
    expectedParentBindings: [
      {name: 'researchFindingsHash', contentHash: null},
      {name: 'localAssetManifestHash', contentHash: null},
    ],
    title: 'World Cup format explainer',
  });
}

describe('initial-brief full governed vertical', () => {
  it('drives init → BRIEF → delegate → written → candidate-ready → accept → TREATMENT', () => {
    const events: LedgerEvent[] = [];
    let prev: LedgerEvent | null = null;

    // 1-2. Initialize.
    prev = next(prev, 'project-initialized', {requestedProjectId: null, allocatedProjectId: PROJECT});
    events.push(prev);
    prev = next(prev, 'invocation-received', {
      requestClass: 'new-project',
      trustedHostId: 'claude-code',
      sourceUserInstruction: projectDurableInstructionText('world cup format explainer'),
      suppliedLocalPathCount: 0,
      suppliedLocatorSetHash: null,
      invocationEnvelopeHash: 'a'.repeat(64),
    });
    events.push(prev);

    // 3-5. Advance INTAKE → FACT_CHECK → BRIEF.
    prev = next(prev, 'decision-recorded', {decision: {kind: 'advance', fromState: 'INTAKE', toState: 'FACT_CHECK'}});
    events.push(prev);
    prev = next(prev, 'decision-recorded', {decision: {kind: 'advance', fromState: 'FACT_CHECK', toState: 'BRIEF'}});
    events.push(prev);
    expect(prev.stateAfter.control).toEqual({kind: 'ready', state: 'BRIEF'});

    // 6. Delegate the brief-planner role (ready@BRIEF → running@BRIEF).
    prev = next(prev, 'decision-recorded', {
      decision: {kind: 'delegate-role', state: 'BRIEF', actionId: 'action-0001', role: 'brief-planner'},
    });
    events.push(prev);
    expect(prev.stateAfter.control.kind).toBe('running');

    // 7. Role authors bytes through the trusted candidate writer (real write).
    const bytes = briefCandidateBytes();
    const receipt = writeCandidate(anchor, {
      actionId: 'action-0001',
      decisionEventHash: prev.eventBindingHash,
      acceptanceRouteId: 'initial-brief',
      ledgerDerivedCandidatePath: CANDIDATE_PATH,
      bytes,
    });

    // 8. Record the written role result (running → candidate-ready).
    prev = next(prev, 'role-result-recorded', {
      actionId: 'action-0001',
      inputBindingHash: 'd'.repeat(64),
      resultReceiptHash: 'e'.repeat(64),
      written: {
        candidateByteHash: receipt.candidateByteHash,
        candidateByteLength: receipt.candidateByteLength,
        acceptanceRouteId: 'initial-brief',
        candidatePath: CANDIDATE_PATH,
        producerState: 'BRIEF',
      },
    });
    events.push(prev);
    expect(prev.stateAfter.control.kind).toBe('candidate-ready');

    // 9. Run artifact-validation-and-hashing (real acceptance).
    const control = prev.stateAfter.control;
    if (control.kind !== 'candidate-ready') throw new Error('expected candidate-ready');
    const accepted = acceptArtifact(anchor, {
      acceptanceRouteId: control.acceptanceRouteId,
      projectId: PROJECT,
      revisionId: null,
      candidatePath: control.candidatePath,
      capturedByteHash: control.candidateByteHash,
      capturedByteLength: control.candidateByteLength,
      promptBinding: {promptPath: 'agent/prompts/brief-planner.md', promptHash: 'b'.repeat(64)},
      producerDecisionHash: 'c'.repeat(64),
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.code);

    // 10. Record the acceptance interface result (candidate-ready → ready@TREATMENT).
    prev = next(prev, 'interface-result-recorded', {
      actionId: 'action-0002',
      acceptance: {
        acceptanceRouteId: accepted.acceptance.acceptanceRouteId,
        candidateByteHash: accepted.acceptance.candidateByteHash,
        successState: accepted.acceptance.successState as 'TREATMENT',
        contentHash: accepted.acceptance.contentHash,
      },
    });
    events.push(prev);
    expect(prev.stateAfter.control).toEqual({kind: 'ready', state: 'TREATMENT'});

    // The whole chain verifies when serialized and reloaded.
    const contents = events.map(serializeEventLine).join('');
    const classified = classifyLedger(contents, reduce);
    expect(classified.kind).toBe('ok');
    if (classified.kind === 'ok') {
      expect(classified.events).toHaveLength(events.length);
      const last = classified.events[classified.events.length - 1]!;
      expect(last.stateAfter.control).toEqual({kind: 'ready', state: 'TREATMENT'});
    }
  });

  it('reducer refuses acceptance whose hash does not match the pending candidate', () => {
    // Build up to candidate-ready, then submit a mismatched acceptance.
    let prev: LedgerEvent | null = null;
    prev = next(prev, 'project-initialized', {requestedProjectId: null, allocatedProjectId: PROJECT});
    prev = next(prev, 'invocation-received', {
      requestClass: 'new-project',
      trustedHostId: 'claude-code',
      sourceUserInstruction: projectDurableInstructionText('x'),
      suppliedLocalPathCount: 0,
      suppliedLocatorSetHash: null,
      invocationEnvelopeHash: 'a'.repeat(64),
    });
    prev = next(prev, 'decision-recorded', {decision: {kind: 'advance', fromState: 'INTAKE', toState: 'FACT_CHECK'}});
    prev = next(prev, 'decision-recorded', {decision: {kind: 'advance', fromState: 'FACT_CHECK', toState: 'BRIEF'}});
    prev = next(prev, 'decision-recorded', {
      decision: {kind: 'delegate-role', state: 'BRIEF', actionId: 'action-0001', role: 'brief-planner'},
    });
    prev = next(prev, 'role-result-recorded', {
      actionId: 'action-0001',
      inputBindingHash: 'd'.repeat(64),
      resultReceiptHash: 'e'.repeat(64),
      written: {
        candidateByteHash: '1'.repeat(64),
        candidateByteLength: 100,
        acceptanceRouteId: 'initial-brief',
        candidatePath: CANDIDATE_PATH,
        producerState: 'BRIEF',
      },
    });
    const pending = prev;
    expect(() =>
      next(pending, 'interface-result-recorded', {
        actionId: 'action-0002',
        acceptance: {
          acceptanceRouteId: 'initial-brief',
          candidateByteHash: '9'.repeat(64), // wrong hash
          successState: 'TREATMENT',
          contentHash: '9'.repeat(64),
        },
      }),
    ).toThrow(/ACCEPT_HASH_MISMATCH/);
  });
});
