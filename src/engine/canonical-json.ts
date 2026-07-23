/**
 * Deterministic canonical JSON serialization for content hashing.
 *
 * Rules:
 * - Objects: keys sorted lexicographically (recursively), plain objects only.
 * - Arrays: original dense order preserved; holes are rejected.
 * - Numbers: finite only; `-0` normalized to `0`.
 * - Strings: standard JSON escaping.
 * - Rejected: undefined, functions, symbols, BigInt, NaN, Infinity, non-plain
 *   objects (Map/Set/Date/class instances), and sparse array holes.
 *
 * The output is compact (no whitespace) so hashing is stable across formatters.
 */

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function serialize(value: unknown): string {
  if (value === null) return 'null';

  const type = typeof value;

  if (type === 'boolean') return value ? 'true' : 'false';

  if (type === 'number') {
    const n = value as number;
    if (!Number.isFinite(n)) {
      throw new Error(`CANONICAL_NUMBER_INVALID: non-finite number ${String(n)}`);
    }
    // Normalize -0 to 0.
    return Object.is(n, -0) ? '0' : String(n);
  }

  if (type === 'string') {
    return JSON.stringify(value);
  }

  if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') {
    throw new Error(`CANONICAL_VALUE_INVALID: unsupported value of type ${type}`);
  }

  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let i = 0; i < value.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(value, i)) {
        throw new Error(`CANONICAL_VALUE_INVALID: array hole at index ${i}`);
      }
      parts.push(serialize(value[i]));
    }
    return `[${parts.join(',')}]`;
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    if (!isPlainObject(obj)) {
      throw new Error('CANONICAL_VALUE_INVALID: non-plain object is not serializable');
    }
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const entry = obj[key];
      if (entry === undefined) {
        throw new Error(`CANONICAL_VALUE_INVALID: undefined value at key "${key}"`);
      }
      parts.push(`${JSON.stringify(key)}:${serialize(entry)}`);
    }
    return `{${parts.join(',')}}`;
  }

  throw new Error(`CANONICAL_VALUE_INVALID: unsupported value of type ${type}`);
}

export function canonicalJson(value: unknown): string {
  return serialize(value);
}
