/**
 * RFC 8785 (JSON Canonicalization Scheme) serialization for the Workflow Ledger.
 *
 * The Ledger contract (`agent/contracts/workflow-ledger.md`) requires every hashed
 * event and result sidecar to be canonicalized as RFC 8785 / JCS UTF-8 bytes. This
 * is deliberately a SEPARATE serializer from `src/engine/canonical-json.ts`:
 *
 *  - The compiler's `canonicalJson` is a lexicographic-sort compact JSON used for
 *    the engine's existing golden hashes. Changing it would churn those hashes.
 *  - This module implements JCS precisely and is used ONLY by ledger code, so the
 *    two hash domains stay isolated.
 *
 * JCS rules implemented here:
 *  - Object member keys are sorted by their UTF-16 code units. JavaScript's default
 *    string comparison (used by Array.prototype.sort with no comparator, and by the
 *    `<` operator) already orders by UTF-16 code unit, so a plain sort is correct
 *    for the BMP and for surrogate pairs alike (RFC 8785 §3.2.3 sorts on the same
 *    UTF-16 units). We sort explicitly with a code-unit comparator to make the
 *    intent unmistakable and independent of locale.
 *  - Numbers use the ECMAScript `Number::toString` shortest round-trip form, which
 *    V8's `String(n)` implements. Only finite numbers are allowed; `-0` normalizes
 *    to `0` (RFC 8785 §3.2.2.3).
 *  - Strings use the JCS-mandated minimal escaping, identical to the escaping
 *    produced by `JSON.stringify` for a string (RFC 8785 §3.2.2.2 references the
 *    same ECMAScript `JSON.stringify` string production).
 *  - Rejected: undefined, functions, symbols, BigInt, NaN, Infinity, non-plain
 *    objects (Map/Set/Date/class instances), and sparse array holes. A ledger event
 *    must never carry a value JCS cannot represent deterministically.
 */

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Compare two strings by UTF-16 code unit, matching RFC 8785 §3.2.3 member key
 * ordering. This is the same ordering JS uses by default, made explicit.
 */
function compareCodeUnits(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i);
    const cb = b.charCodeAt(i);
    if (ca !== cb) return ca - cb;
  }
  return a.length - b.length;
}

/**
 * Serialize a JavaScript string as a JCS/JSON string literal. `JSON.stringify` of a
 * string produces exactly the escaping RFC 8785 requires (minimal escapes, control
 * characters as `\u00XX`, `"` and `\` escaped), so we defer to it.
 */
function serializeString(value: string): string {
  return JSON.stringify(value);
}

function serializeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`JCS_NUMBER_INVALID: non-finite number ${String(value)}`);
  }
  // Normalize -0 to 0 per RFC 8785 §3.2.2.3.
  if (Object.is(value, -0)) return '0';
  // ECMAScript Number::toString is the JCS number production; String(n) uses it.
  return String(value);
}

function serialize(value: unknown): string {
  if (value === null) return 'null';

  const type = typeof value;

  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') return serializeNumber(value as number);
  if (type === 'string') return serializeString(value as string);

  if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') {
    throw new Error(`JCS_VALUE_INVALID: unsupported value of type ${type}`);
  }

  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let i = 0; i < value.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(value, i)) {
        throw new Error(`JCS_VALUE_INVALID: array hole at index ${i}`);
      }
      parts.push(serialize(value[i]));
    }
    return `[${parts.join(',')}]`;
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    if (!isPlainObject(obj)) {
      throw new Error('JCS_VALUE_INVALID: non-plain object is not serializable');
    }
    const keys = Object.keys(obj).sort(compareCodeUnits);
    const parts: string[] = [];
    for (const key of keys) {
      const entry = obj[key];
      if (entry === undefined) {
        throw new Error(`JCS_VALUE_INVALID: undefined value at key "${key}"`);
      }
      parts.push(`${serializeString(key)}:${serialize(entry)}`);
    }
    return `{${parts.join(',')}}`;
  }

  throw new Error(`JCS_VALUE_INVALID: unsupported value of type ${type}`);
}

/** RFC 8785 canonical JSON string for a value (UTF-8 bytes when encoded). */
export function jcsCanonical(value: unknown): string {
  return serialize(value);
}
