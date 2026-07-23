import {describe, expect, it} from 'vitest';

import {buildNextEvent, classifyLedger, serializeEventLine} from '../../src/engine/ledger/chain.js';
import {reduce} from '../../src/engine/ledger/reducer.js';
import {projectDurableInstructionText} from '../../src/engine/ledger/redaction.js';
import type {
  LedgerEvent,
  LedgerEventBindingProjection,
} from '../../src/engine/ledger/types.js';

const PROJECT = 'world-cup';
const REQUEST = 'request-0001';

function binding(
  sequence: number,
  previousEventHash: string | null,
  eventKind: LedgerEventBindingProjection['eventKind'],
  payload: LedgerEventBindingProjection['payload'],
): LedgerEventBindingProjection {
  return {
    schemaVersion: 'workflow-ledger-event@1',
    sequence,
    projectId: PROJECT,
    requestId: REQUEST,
    previousEventHash,
    eventKind,
    payload,
  };
}

function initSequence(): LedgerEvent[] {
  const instruction = projectDurableInstructionText('make a video about world cup format explainer');
  const e1 = buildNextEvent(
    binding(1, null, 'project-initialized', {requestedProjectId: null, allocatedProjectId: PROJECT}),
    null,
    reduce,
  );
  const e2 = buildNextEvent(
    binding(2, e1.eventHash, 'invocation-received', {
      requestClass: 'new-project',
      trustedHostId: 'claude-code',
      sourceUserInstruction: instruction,
      suppliedLocalPathCount: 0,
      suppliedLocatorSetHash: null,
      invocationEnvelopeHash: 'a'.repeat(64),
    }),
    e1,
    reduce,
  );
  return [e1, e2];
}

describe('init sequence reducer', () => {
  it('project-initialized yields ready@INTAKE with no active request', () => {
    const [e1] = initSequence();
    expect(e1!.stateAfter.control).toEqual({kind: 'ready', state: 'INTAKE'});
    expect(e1!.stateAfter.activeRequest).toBeNull();
    expect(e1!.sequence).toBe(1);
    expect(e1!.previousEventHash).toBeNull();
  });

  it('invocation-received binds the active request', () => {
    const [, e2] = initSequence();
    const req = e2!.stateAfter.activeRequest;
    expect(req).not.toBeNull();
    expect(req!.requestId).toBe('request-0001');
    expect(req!.requestClass).toBe('new-project');
    expect(req!.trustedHostId).toBe('claude-code');
    expect(req!.invocationEventHash).toBe(e2!.eventBindingHash);
    expect(req!.repairCycleId).toBe('repair-0001');
  });

  it('two-stage hashes are non-self-referential and chained', () => {
    const [e1, e2] = initSequence();
    expect(e1!.eventHash).toMatch(/^[a-f0-9]{64}$/);
    expect(e1!.eventBindingHash).not.toBe(e1!.eventHash);
    expect(e2!.previousEventHash).toBe(e1!.eventHash);
  });
});

describe('advance + terminal reducers', () => {
  it('advances INTAKE→FACT_CHECK via a producer-free advance decision', () => {
    const [, e2] = initSequence();
    const e3 = buildNextEvent(
      binding(3, e2!.eventHash, 'decision-recorded', {
        decision: {kind: 'advance', fromState: 'INTAKE', toState: 'FACT_CHECK'},
      }),
      e2!,
      reduce,
    );
    expect(e3.stateAfter.control).toEqual({kind: 'ready', state: 'FACT_CHECK'});
  });

  it('rejects an illegal advance edge', () => {
    const [, e2] = initSequence();
    expect(() =>
      buildNextEvent(
        binding(3, e2!.eventHash, 'decision-recorded', {
          decision: {kind: 'advance', fromState: 'INTAKE', toState: 'VALIDATE'},
        }),
        e2!,
        reduce,
      ),
    ).toThrow(/ADVANCE_ILLEGAL/);
  });

  it('abandon moves to terminal STOP', () => {
    const [, e2] = initSequence();
    const e3 = buildNextEvent(
      binding(3, e2!.eventHash, 'decision-recorded', {
        decision: {
          kind: 'abandon',
          actor: {type: 'human', id: 'leckz'},
          reason: projectDurableInstructionText('user abandoned'),
        },
      }),
      e2!,
      reduce,
    );
    expect(e3.stateAfter.control).toEqual({kind: 'terminal', state: 'STOP', outcomeKind: 'abandoned'});
  });

  it('refuses a deferred route (role-result-recorded) loudly', () => {
    const [, e2] = initSequence();
    expect(() =>
      buildNextEvent(
        binding(3, e2!.eventHash, 'role-result-recorded', {
          actionId: 'action-0001',
          inputBindingHash: 'b'.repeat(64),
          resultReceiptHash: 'c'.repeat(64),
        }),
        e2!,
        reduce,
      ),
    ).toThrow(/ROUTE_NOT_IMPLEMENTED/);
  });
});

describe('classifyLedger round-trip + tamper detection', () => {
  it('verifies a clean serialized ledger', () => {
    const events = initSequence();
    const contents = events.map(serializeEventLine).join('');
    const result = classifyLedger(contents, reduce);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.events).toHaveLength(2);
      expect(result.verifiedSize).toBe(contents.length);
    }
  });

  it('flags a tampered payload as corrupt', () => {
    const events = initSequence();
    let contents = events.map(serializeEventLine).join('');
    // Corrupt the instruction text in line 2 without fixing the hash.
    contents = contents.replace('world cup', 'tampered');
    const result = classifyLedger(contents, reduce);
    expect(result.kind).toBe('corrupt');
  });

  it('flags a torn (unterminated) suffix as corrupt with the prior verified size', () => {
    const events = initSequence();
    const full = events.map(serializeEventLine).join('');
    const firstLen = serializeEventLine(events[0]!).length;
    const torn = full.slice(0, full.length - 1); // drop trailing LF of line 2
    const result = classifyLedger(torn, reduce);
    expect(result.kind).toBe('corrupt');
    if (result.kind === 'corrupt') {
      expect(result.verifiedSize).toBe(firstLen);
    }
  });

  it('treats empty contents as empty', () => {
    expect(classifyLedger('', reduce).kind).toBe('empty');
  });
});
