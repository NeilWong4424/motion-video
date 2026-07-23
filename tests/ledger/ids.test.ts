import {describe, expect, it} from 'vitest';

import {
  allocateNextId,
  asActionId,
  asRequestId,
  isOrdinalId,
  parseOrdinalId,
  renderOrdinal,
} from '../../src/engine/ledger/ids.js';

describe('ledger ids', () => {
  it('renders ordinals zero-padded to width 4, growing beyond', () => {
    expect(renderOrdinal('request', 1)).toBe('request-0001');
    expect(renderOrdinal('action', 42)).toBe('action-0042');
    expect(renderOrdinal('rev', 10000)).toBe('rev-10000');
    expect(renderOrdinal('revision-attempt', 1)).toBe('revision-attempt-0001');
  });

  it('allocates the next id with no gaps', () => {
    expect(allocateNextId('request', 0)).toBe('request-0001');
    expect(allocateNextId('request', 1)).toBe('request-0002');
    expect(allocateNextId('action', 9999)).toBe('action-10000');
  });

  it('parses canonical ids and rejects non-canonical spellings', () => {
    expect(parseOrdinalId('request', 'request-0001')).toBe(1);
    expect(parseOrdinalId('request', 'request-10000')).toBe(10000);
    // Wrong family
    expect(parseOrdinalId('request', 'action-0001')).toBeNull();
    // Too few digits
    expect(parseOrdinalId('request', 'request-1')).toBeNull();
    expect(parseOrdinalId('request', 'request-001')).toBeNull();
    // Extra leading zeros beyond width 4
    expect(parseOrdinalId('request', 'request-00001')).toBeNull();
    // Zero / negative
    expect(parseOrdinalId('request', 'request-0000')).toBeNull();
    // Traversal / suffix / separators
    expect(parseOrdinalId('request', 'request-0001/x')).toBeNull();
    expect(parseOrdinalId('request', 'request-0001-a')).toBeNull();
    expect(parseOrdinalId('request', '../request-0001')).toBeNull();
    expect(parseOrdinalId('request', 'Request-0001')).toBeNull();
  });

  it('isOrdinalId agrees with parseOrdinalId', () => {
    expect(isOrdinalId('candidate', 'candidate-0007')).toBe(true);
    expect(isOrdinalId('candidate', 'candidate-7')).toBe(false);
  });

  it('branded parsers validate and reject', () => {
    expect(asRequestId('request-0003')).toBe('request-0003');
    expect(asActionId('action-0003')).toBe('action-0003');
    expect(() => asRequestId('action-0003')).toThrow(/REQUEST_ID_INVALID/);
    expect(() => asActionId('request-0003')).toThrow(/ACTION_ID_INVALID/);
  });

  it('rejects invalid previous ordinals when allocating', () => {
    expect(() => allocateNextId('request', -1)).toThrow(/LEDGER_ID_PREVIOUS_INVALID/);
  });
});
