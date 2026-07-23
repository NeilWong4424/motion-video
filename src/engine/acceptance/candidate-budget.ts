/**
 * Artifact candidate budget enforcement — bounded streaming JSON structural pass.
 *
 * Per `agent/contracts/artifact-acceptance.md`, before any candidate destination is
 * created, the trusted writer (and, independently, acceptance) must count exact
 * UTF-8 bytes and perform a bounded streaming JSON/JCS lexical + structural pass,
 * stopping as soon as any limit fails, using checked integer arithmetic, never
 * building an unbounded in-memory tree.
 *
 * This module never parses into a JS value tree; it scans the byte string once with
 * an explicit container stack and per-scope counters. Depth, token, per-object and
 * per-array member counts, per-string and total-string Unicode scalar counts,
 * duplicate keys, scalar validity, and total bytes are all metered.
 *
 * The two literal budget profiles are system constants and cannot be widened.
 */

export type CandidateBudget = {
  profile: 'artifact-candidate-budget@1' | 'review-candidate-budget@1';
  maxUtf8Bytes: number;
  maxJsonDepth: number;
  maxJsonTokens: number;
  maxObjectMembersPerObject: number;
  maxArrayMembersPerArray: number;
  maxStringUnicodeScalarsPerValue: number;
  maxStringUnicodeScalarsTotal: number;
};

export const ARTIFACT_CANDIDATE_BUDGET: CandidateBudget = {
  profile: 'artifact-candidate-budget@1',
  maxUtf8Bytes: 8388608,
  maxJsonDepth: 128,
  maxJsonTokens: 262144,
  maxObjectMembersPerObject: 65536,
  maxArrayMembersPerArray: 65536,
  maxStringUnicodeScalarsPerValue: 65536,
  maxStringUnicodeScalarsTotal: 1048576,
};

export const REVIEW_CANDIDATE_BUDGET: CandidateBudget = {
  profile: 'review-candidate-budget@1',
  maxUtf8Bytes: 4194304,
  maxJsonDepth: 64,
  maxJsonTokens: 131072,
  maxObjectMembersPerObject: 16384,
  maxArrayMembersPerArray: 16384,
  maxStringUnicodeScalarsPerValue: 32768,
  maxStringUnicodeScalarsTotal: 524288,
};

export type BudgetOk = {ok: true; byteLength: number; tokenCount: number};
export type BudgetFail = {ok: false; code: string; detail: string};
export type BudgetResult = BudgetOk | BudgetFail;

type Scope =
  | {kind: 'object'; members: number; expectKey: boolean; seenKeys: Set<string>; pendingKey: string | null; afterComma: boolean}
  | {kind: 'array'; members: number; afterComma: boolean};

function fail(code: string, detail: string): BudgetFail {
  return {ok: false, code, detail};
}

/**
 * Count the Unicode scalar values in a JSON string body (already unescaped concept):
 * we count code points, treating a valid surrogate pair as one scalar. Returns null
 * if an unpaired surrogate is encountered (invalid per canonical JSON).
 */
function countScalars(str: string): number | null {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        i += 1;
        count += 1;
      } else {
        return null; // unpaired high surrogate
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return null; // unpaired low surrogate
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Enforce the budget over candidate bytes (a UTF-8 string). Returns a typed result;
 * never throws for a limit breach (those are `ok:false`). Malformed structure is
 * also reported as a failure rather than a thrown parse error.
 */
export function enforceCandidateBudget(text: string, budget: CandidateBudget): BudgetResult {
  const byteLength = Buffer.byteLength(text, 'utf8');
  if (byteLength > budget.maxUtf8Bytes) {
    return fail('BUDGET_BYTES', `${byteLength} > ${budget.maxUtf8Bytes}`);
  }

  const stack: Scope[] = [];
  let tokenCount = 0;
  let totalStringScalars = 0;
  let sawValue = false;
  let done = false;

  const bumpToken = (): BudgetFail | null => {
    tokenCount += 1;
    if (tokenCount > budget.maxJsonTokens) return fail('BUDGET_TOKENS', `${tokenCount}`);
    return null;
  };

  let i = 0;
  const n = text.length;

  // Register that a value has been produced in the current context, updating array
  // member counts and object key/value expectations.
  const onValueProduced = (): BudgetFail | null => {
    const top = stack[stack.length - 1];
    if (!top) {
      if (sawValue) return fail('JSON_TRAILING', 'multiple top-level values');
      sawValue = true;
      done = true;
      return null;
    }
    top.afterComma = false;
    if (top.kind === 'array') {
      top.members += 1;
      if (top.members > budget.maxArrayMembersPerArray) return fail('BUDGET_ARRAY_MEMBERS', `${top.members}`);
    } else {
      // An object value slot was just filled: one complete key:value member.
      top.members += 1;
      if (top.members > budget.maxObjectMembersPerObject) return fail('BUDGET_OBJECT_MEMBERS', `${top.members}`);
      top.pendingKey = null;
      // The next token in this object must be a comma or the closing brace; expectKey
      // is set true again only when a comma is seen.
    }
    return null;
  };

  while (i < n) {
    const ch = text[i]!;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }
    if (done) return fail('JSON_TRAILING', `unexpected ${ch} after top-level value`);

    const top = stack[stack.length - 1];
    const inObjectExpectingKey = top?.kind === 'object' && top.expectKey;

    if (ch === '{' || ch === '[') {
      const t = bumpToken();
      if (t) return t;
      if (stack.length + 1 > budget.maxJsonDepth) return fail('BUDGET_DEPTH', `${stack.length + 1}`);
      if (ch === '{') {
        stack.push({kind: 'object', members: 0, expectKey: true, seenKeys: new Set(), pendingKey: null, afterComma: false});
      } else {
        stack.push({kind: 'array', members: 0, afterComma: false});
      }
      i += 1;
      continue;
    }

    if (ch === '}' || ch === ']') {
      const t = bumpToken();
      if (t) return t;
      if (!top) return fail('JSON_UNBALANCED', `stray ${ch}`);
      if (ch === '}' && top.kind !== 'object') return fail('JSON_UNBALANCED', 'mismatched }');
      if (ch === ']' && top.kind !== 'array') return fail('JSON_UNBALANCED', 'mismatched ]');
      if (top.kind === 'object' && top.pendingKey !== null) {
        // A key was read but its value never completed before the closing brace.
        return fail('JSON_OBJECT_INCOMPLETE', 'key without value');
      }
      if (top.afterComma) {
        return fail('JSON_TRAILING_COMMA', `trailing comma before ${ch}`);
      }
      stack.pop();
      i += 1;
      const produced = onValueProduced();
      if (produced) return produced;
      continue;
    }

    if (ch === ',') {
      const t = bumpToken();
      if (t) return t;
      if (!top) return fail('JSON_UNBALANCED', 'stray comma');
      if (top.kind === 'object') {
        if (top.expectKey) return fail('JSON_OBJECT', 'comma before key');
        top.expectKey = true;
      }
      if (top.members === 0) return fail('JSON_LEADING_COMMA', 'comma before first element');
      top.afterComma = true;
      i += 1;
      continue;
    }

    if (ch === ':') {
      const t = bumpToken();
      if (t) return t;
      if (!top || top.kind !== 'object' || top.pendingKey === null) {
        return fail('JSON_COLON', 'unexpected colon');
      }
      top.expectKey = false;
      i += 1;
      continue;
    }

    if (ch === '"') {
      const t = bumpToken();
      if (t) return t;
      const parsed = scanString(text, i);
      if (!parsed) return fail('JSON_STRING', `bad string at ${i}`);
      const scalars = countScalars(parsed.value);
      if (scalars === null) return fail('JSON_STRING_SURROGATE', `unpaired surrogate at ${i}`);
      if (scalars > budget.maxStringUnicodeScalarsPerValue) return fail('BUDGET_STRING_PER_VALUE', `${scalars}`);
      totalStringScalars += scalars;
      if (totalStringScalars > budget.maxStringUnicodeScalarsTotal) return fail('BUDGET_STRING_TOTAL', `${totalStringScalars}`);
      i = parsed.end;
      if (inObjectExpectingKey) {
        // This string is a key.
        if (top!.kind === 'object') {
          if (top.seenKeys.has(parsed.value)) return fail('JSON_DUPLICATE_KEY', parsed.value);
          top.seenKeys.add(parsed.value);
          top.pendingKey = parsed.value;
          // expectKey stays true until the colon flips it.
        }
      } else {
        // This string is a value; onValueProduced counts the object/array member.
        const produced = onValueProduced();
        if (produced) return produced;
      }
      continue;
    }

    // Scalar literal: number, true, false, null.
    if (inObjectExpectingKey) return fail('JSON_OBJECT', 'expected string key');
    const scalar = scanScalar(text, i);
    if (!scalar) return fail('JSON_SCALAR', `bad literal at ${i}`);
    const t = bumpToken();
    if (t) return t;
    i = scalar.end;
    // onValueProduced counts the object/array member for this scalar value.
    const produced = onValueProduced();
    if (produced) return produced;
  }

  if (stack.length !== 0) return fail('JSON_UNBALANCED', 'unterminated container');
  if (!sawValue) return fail('JSON_EMPTY', 'no top-level value');
  return {ok: true, byteLength, tokenCount};
}

type ScannedString = {value: string; end: number};

/** Scan a JSON string starting at the opening quote index; returns unescaped value. */
function scanString(text: string, start: number): ScannedString | null {
  let i = start + 1;
  let out = '';
  const n = text.length;
  while (i < n) {
    const ch = text[i]!;
    if (ch === '"') return {value: out, end: i + 1};
    if (ch === '\\') {
      const esc = text[i + 1];
      if (esc === undefined) return null;
      switch (esc) {
        case '"': out += '"'; i += 2; break;
        case '\\': out += '\\'; i += 2; break;
        case '/': out += '/'; i += 2; break;
        case 'b': out += '\b'; i += 2; break;
        case 'f': out += '\f'; i += 2; break;
        case 'n': out += '\n'; i += 2; break;
        case 'r': out += '\r'; i += 2; break;
        case 't': out += '\t'; i += 2; break;
        case 'u': {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
          out += String.fromCharCode(Number.parseInt(hex, 16));
          i += 6;
          break;
        }
        default:
          return null;
      }
    } else {
      const code = ch.charCodeAt(0);
      if (code < 0x20) return null; // unescaped control char is invalid
      out += ch;
      i += 1;
    }
  }
  return null;
}

type ScannedScalar = {end: number};

/** Scan a number / true / false / null literal starting at index i. */
function scanScalar(text: string, start: number): ScannedScalar | null {
  if (text.startsWith('true', start)) return {end: start + 4};
  if (text.startsWith('false', start)) return {end: start + 5};
  if (text.startsWith('null', start)) return {end: start + 4};
  // Sticky flag anchors at lastIndex; do NOT use ^ (with `y`, ^ only matches pos 0).
  const numRe = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  numRe.lastIndex = start;
  const m = numRe.exec(text);
  if (m && m[0].length > 0) return {end: start + m[0].length};
  return null;
}
