import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {
  anchorRepoRoot,
  appendDecision,
  initializeProject,
  loadLedger,
  writeActionResultSidecar,
  type RepoRootAnchor,
} from '../../src/engine/ledger/index.js';

let root: string;
let anchor: RepoRootAnchor;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ledger-int-'));
  anchor = anchorRepoRoot(root);
});

afterEach(() => {
  rmSync(root, {recursive: true, force: true});
});

const INIT = {
  requestedProjectId: null,
  allocatedProjectId: 'world-cup',
  requestClass: 'new-project' as const,
  trustedHostId: 'claude-code' as const,
  rawUserInstruction: 'make a video about world cup format explainer',
  suppliedLocalPathCount: 0,
  suppliedLocatorSetHash: null,
};

describe('initializeProject', () => {
  it('writes exactly two canonical LF-terminated events with a valid chain', () => {
    const result = initializeProject(anchor, INIT);
    const path = join(root, 'projects/world-cup/.workflow/ledger.jsonl');
    expect(existsSync(path)).toBe(true);
    const raw = readFileSync(path, 'utf8');
    const lines = raw.split('\n');
    // two events + trailing empty from final LF
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('');
    expect(result.events).toHaveLength(2);
    expect(result.checkpoint.control).toEqual({kind: 'ready', state: 'INTAKE'});
    expect(result.checkpoint.activeRequest?.requestId).toBe('request-0001');
  });

  it('reloading the ledger reproduces the checkpoint', () => {
    initializeProject(anchor, INIT);
    const loaded = loadLedger(anchor, 'world-cup');
    expect(loaded).not.toBeNull();
    expect(loaded!.events).toHaveLength(2);
    expect(loaded!.checkpoint.activeRequest?.trustedHostId).toBe('claude-code');
    expect(loaded!.verifiedSize).toBe(readFileSync(join(root, 'projects/world-cup/.workflow/ledger.jsonl')).length);
  });

  it('refuses to initialize twice (exclusive create)', () => {
    initializeProject(anchor, INIT);
    expect(() => initializeProject(anchor, INIT)).toThrow();
  });

  it('does not persist raw secrets in the durable instruction', () => {
    const result = initializeProject(anchor, {
      ...INIT,
      allocatedProjectId: 'secret-proj',
      rawUserInstruction: 'render it with api_key=Abc123Def456ghijk',
    });
    const raw = readFileSync(join(root, 'projects/secret-proj/.workflow/ledger.jsonl'), 'utf8');
    expect(raw).not.toContain('Abc123Def456ghijk');
    expect(raw).toContain('[[redacted-secret:0]]');
    expect(result.checkpoint.activeRequest?.sourceUserInstruction).toContain('[[redacted-secret:0]]');
  });
});

describe('appendDecision transactions', () => {
  it('advances INTAKE→FACT_CHECK and persists the new event', () => {
    initializeProject(anchor, INIT);
    const advanced = appendDecision(anchor, 'world-cup', {
      kind: 'advance',
      fromState: 'INTAKE',
      toState: 'FACT_CHECK',
    });
    expect(advanced.checkpoint.control).toEqual({kind: 'ready', state: 'FACT_CHECK'});
    const loaded = loadLedger(anchor, 'world-cup');
    expect(loaded!.events).toHaveLength(3);
    expect(loaded!.checkpoint.control).toEqual({kind: 'ready', state: 'FACT_CHECK'});
  });

  it('abandon moves the ledger to terminal STOP', () => {
    initializeProject(anchor, INIT);
    const stopped = appendDecision(anchor, 'world-cup', {
      kind: 'abandon',
      actor: {type: 'human', id: 'leckz'},
      reason: 'no longer needed',
    });
    expect(stopped.checkpoint.control).toEqual({
      kind: 'terminal',
      state: 'STOP',
      outcomeKind: 'abandoned',
    });
  });

  it('refuses an illegal advance without corrupting the ledger', () => {
    initializeProject(anchor, INIT);
    expect(() =>
      appendDecision(anchor, 'world-cup', {kind: 'advance', fromState: 'INTAKE', toState: 'VALIDATE'}),
    ).toThrow(/ADVANCE_ILLEGAL/);
    // Ledger still loads and is unchanged (2 events).
    const loaded = loadLedger(anchor, 'world-cup');
    expect(loaded!.events).toHaveLength(2);
  });
});

describe('action-result sidecar', () => {
  it('writes an immutable sidecar keyed by its receipt hash and refuses a duplicate', () => {
    initializeProject(anchor, INIT);
    const {relativePath, resultReceiptHash} = writeActionResultSidecar(anchor, 'world-cup', 'action-0001', {
      status: 'written',
      candidate: {byteLength: 10},
    });
    expect(resultReceiptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(existsSync(join(root, relativePath))).toBe(true);
    expect(() =>
      writeActionResultSidecar(anchor, 'world-cup', 'action-0001', {
        status: 'written',
        candidate: {byteLength: 10},
      }),
    ).toThrow();
  });
});

describe('new-project detection', () => {
  it('loadLedger returns null when no ledger exists', () => {
    expect(loadLedger(anchor, 'nonexistent')).toBeNull();
  });
});
