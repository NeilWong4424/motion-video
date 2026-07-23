/**
 * Locator + secret redaction for the Workflow Ledger.
 *
 * Implements the closed lexical grammar from `agent/contracts/workflow-ledger.md`
 * ("Host-native locators are ephemeral..." through the credential scanner). The
 * transform turns arbitrary UTF-8 instruction/answer/label/reason text into
 * `DurableLocatorSafeText`: exact supplied locators become stable `[[locator:<id>]]`
 * tokens, strong-prefix path/URI locators become `[[redacted-locator:<ordinal>]]`,
 * and credential values become `[[redacted-secret:<ordinal>]]`.
 *
 * The transform is deterministic and idempotent: applying it to already-projected
 * text yields identical bytes and never renumbers existing valid tokens. It is a
 * pure string function with no filesystem or path heuristics beyond the grammar.
 *
 * Ordering of passes matters and is fixed by the contract:
 *   1. exact supplied-locator substitution (longest match, ties by ascending id)
 *   2. strong-prefix locator tokenization over delimiter-separated tokens
 *   3. credential redaction (before any durable hash)
 */

export type DurableLocatorSafeText = string & {readonly __durableLocatorSafeText: unique symbol};
export type DurableInstructionText = DurableLocatorSafeText & {readonly __durableInstructionText: unique symbol};

/** One exact supplied locator with its stable id, used only in pass 1. */
export type SuppliedLocator = {locatorId: string; value: string};

export type RedactionResult = {
  text: string;
  /** True when nothing was replaced, i.e. the input was already safe. */
  clean: boolean;
};

// --- Pass 1: exact supplied-locator substitution -----------------------------

/**
 * Replace every exact supplied locator with `[[locator:<locatorId>]]`. At each byte
 * offset the longest matching locator wins; equal lengths break by ascending
 * locatorId; matches never overlap. Exact locators always match even if they look
 * like ordinary prose.
 */
export function substituteSuppliedLocators(input: string, locators: SuppliedLocator[]): string {
  if (locators.length === 0) return input;
  // Sort candidates by descending value length, then ascending locatorId, so the
  // first match found at an offset is the longest / lowest-id winner.
  const ordered = [...locators].sort((a, b) => {
    if (b.value.length !== a.value.length) return b.value.length - a.value.length;
    return a.locatorId < b.locatorId ? -1 : a.locatorId > b.locatorId ? 1 : 0;
  });
  let out = '';
  let i = 0;
  while (i < input.length) {
    let matched: SuppliedLocator | null = null;
    for (const cand of ordered) {
      if (cand.value.length > 0 && input.startsWith(cand.value, i)) {
        matched = cand;
        break;
      }
    }
    if (matched) {
      out += `[[locator:${matched.locatorId}]]`;
      i += matched.value.length;
    } else {
      out += input[i];
      i += 1;
    }
  }
  return out;
}

// --- Pass 2: strong-prefix locator tokenization ------------------------------

// Delimiter set: bytes 0x00..0x20, double quote, single quote, parens, angle
// brackets, square brackets, braces, comma, semicolon.
function isDelimiter(ch: string): boolean {
  const c = ch.charCodeAt(0);
  if (c <= 0x20) return true;
  return (
    ch === '"' ||
    ch === "'" ||
    ch === '(' ||
    ch === ')' ||
    ch === '<' ||
    ch === '>' ||
    ch === '[' ||
    ch === ']' ||
    ch === '{' ||
    ch === '}' ||
    ch === ',' ||
    ch === ';'
  );
}

const RESERVED_DEVICE = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

function hasStrongLocatorPrefix(tok: string): boolean {
  if (
    tok.startsWith('/') ||
    tok.startsWith('./') ||
    tok.startsWith('../') ||
    tok.startsWith('~/') ||
    tok.startsWith('.\\') ||
    tok.startsWith('..\\') ||
    tok.startsWith('~\\') ||
    tok.startsWith('//') ||
    tok.startsWith('\\\\')
  ) {
    return true;
  }
  // ASCII drive letter + colon + slash/backslash separator (e.g. C:/ or C:\).
  if (/^[A-Za-z]:[/\\]/.test(tok)) return true;
  return false;
}

function isWindowsDriveRelative(tok: string): boolean {
  // e.g. C:foo — drive letter, colon, then a non-separator character.
  return /^[A-Za-z]:[^/\\]/.test(tok);
}

function isReservedDeviceToken(tok: string): boolean {
  // Case-insensitive reserved basename, optionally followed by a dot suffix.
  const base = tok.toLowerCase();
  const dot = base.indexOf('.');
  const name = dot === -1 ? base : base.slice(0, dot);
  return RESERVED_DEVICE.has(name);
}

function isUriLocator(tok: string): boolean {
  // ASCII scheme:// form, or the closed file:/data: forms.
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(tok)) return true;
  if (/^file:/i.test(tok) || /^data:/i.test(tok)) return true;
  return false;
}

function isStrongLocatorToken(tok: string): boolean {
  return (
    hasStrongLocatorPrefix(tok) ||
    isWindowsDriveRelative(tok) ||
    isReservedDeviceToken(tok) ||
    isUriLocator(tok)
  );
}

/**
 * Tokenize by the delimiter set and replace strong-prefix locator tokens with
 * `[[redacted-locator:<ordinal>]]`, reusing the first ordinal for identical tokens.
 * Non-locator prose (including `UI/UX`, `24/7`, `CTA:`) is preserved byte-exact.
 * Already-projected `[[locator:...]]` / `[[redacted-locator:...]]` tokens are left
 * untouched (idempotence).
 */
export function tokenizeStrongLocators(input: string): string {
  const seen = new Map<string, number>();
  let next = 0;
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (isDelimiter(ch)) {
      out += ch;
      i += 1;
      continue;
    }
    // Read a maximal non-delimiter token.
    let j = i;
    while (j < input.length && !isDelimiter(input[j]!)) j += 1;
    const tok = input.slice(i, j);
    if (isAlreadyProjectedToken(tok)) {
      out += tok;
    } else if (isStrongLocatorToken(tok)) {
      let ordinal = seen.get(tok);
      if (ordinal === undefined) {
        ordinal = next++;
        seen.set(tok, ordinal);
      }
      out += `[[redacted-locator:${ordinal}]]`;
    } else {
      out += tok;
    }
    i = j;
  }
  return out;
}

function isAlreadyProjectedToken(tok: string): boolean {
  return /^\[\[(locator|redacted-locator|redacted-secret):[^\]]*\]\]$/.test(tok);
}

// --- Pass 3: credential redaction --------------------------------------------

const PEM_LABELS = [
  'PRIVATE KEY',
  'RSA PRIVATE KEY',
  'EC PRIVATE KEY',
  'DSA PRIVATE KEY',
  'OPENSSH PRIVATE KEY',
  'ENCRYPTED PRIVATE KEY',
];

const LABELED_KEY_EXACT = new Set([
  'apikey', 'accesskey', 'accesstoken', 'authtoken', 'clientsecret',
  'privatekey', 'token', 'secret', 'password', 'passwd', 'pwd',
]);

const CLI_FLAGS = new Set([
  '--api-key', '--access-key', '--access-token', '--auth-token', '--client-secret',
  '--private-key', '--token', '--secret', '--password', '--passwd', '--pwd',
]);

const PROVIDER_PREFIXES = ['sk-', 'sk_live_', 'sk_test_', 'github_pat_', 'xoxb-', 'xoxp-', 'xoxa-', 'xoxr-', 'xoxs-'];

/**
 * Redact credential values, replacing each with `[[redacted-secret:<ordinal>]]`
 * and reusing the first ordinal for identical secret bytes. PEM blocks redact
 * whole; other classes redact only the value, preserving label/separator.
 *
 * Throws `LEDGER_REDACTION_PEM_UNTERMINATED` when a recognized PEM begin marker
 * lacks its matching bounded end marker, per the contract (refuse before hashing).
 */
export function redactCredentials(input: string): string {
  const seen = new Map<string, number>();
  let next = 0;
  const secretToken = (bytes: string): string => {
    let ordinal = seen.get(bytes);
    if (ordinal === undefined) {
      ordinal = next++;
      seen.set(bytes, ordinal);
    }
    return `[[redacted-secret:${ordinal}]]`;
  };

  let out = '';
  let i = 0;
  const n = input.length;
  while (i < n) {
    // --- already-projected token: copy through verbatim (idempotence) ---
    const projected = matchProjectedToken(input, i);
    if (projected) {
      out += input.slice(i, projected.end);
      i = projected.end;
      continue;
    }
    // --- PEM block (highest priority at this offset) ---
    const pem = matchPemBlock(input, i);
    if (pem) {
      out += secretToken(pem.block);
      i = pem.end;
      continue;
    }
    // --- authorization Bearer/Basic ---
    const auth = matchAuthorization(input, i);
    if (auth) {
      out += input.slice(i, auth.valueStart) + secretToken(auth.value);
      i = auth.end;
      continue;
    }
    // --- labeled credential key ---
    const labeled = matchLabeledKey(input, i);
    if (labeled) {
      out += input.slice(i, labeled.valueStart) + secretToken(labeled.value);
      i = labeled.end;
      continue;
    }
    // --- CLI credential flag ---
    const flag = matchCliFlag(input, i);
    if (flag) {
      out += input.slice(i, flag.valueStart) + secretToken(flag.value);
      i = flag.end;
      continue;
    }
    // --- provider-prefixed token / AKIA ---
    const provider = matchProviderToken(input, i);
    if (provider) {
      out += secretToken(provider.value);
      i = provider.end;
      continue;
    }
    // --- generic high-complexity token ---
    const generic = matchGenericToken(input, i);
    if (generic) {
      out += secretToken(generic.value);
      i = generic.end;
      continue;
    }
    out += input[i];
    i += 1;
  }
  return out;
}

const PROJECTED_TOKEN_RE = /\[\[(?:locator|redacted-locator|redacted-secret):[^\]]*\]\]/y;

/** Match an already-projected `[[...:...]]` token anchored at offset i. */
function matchProjectedToken(input: string, i: number): {end: number} | null {
  PROJECTED_TOKEN_RE.lastIndex = i;
  const m = PROJECTED_TOKEN_RE.exec(input);
  if (m && m.index === i) return {end: i + m[0].length};
  return null;
}

function matchPemBlock(input: string, i: number): {block: string; end: number} | null {
  const BEGIN = '-----BEGIN ';
  if (!input.startsWith(BEGIN, i)) return null;
  const labelStart = i + BEGIN.length;
  let label: string | null = null;
  for (const cand of PEM_LABELS) {
    if (input.startsWith(`${cand}-----`, labelStart)) {
      label = cand;
      break;
    }
  }
  if (label === null) return null;
  const endMarker = `-----END ${label}-----`;
  const endIdx = input.indexOf(endMarker, labelStart);
  if (endIdx === -1) {
    throw new Error('LEDGER_REDACTION_PEM_UNTERMINATED');
  }
  const end = endIdx + endMarker.length;
  if (end - i > 65536) {
    throw new Error('LEDGER_REDACTION_PEM_UNTERMINATED');
  }
  return {block: input.slice(i, end), end};
}

function matchAuthorization(input: string, i: number): {value: string; valueStart: number; end: number} | null {
  for (const scheme of ['Bearer', 'Basic']) {
    if (input.slice(i, i + scheme.length).toLowerCase() === scheme.toLowerCase()) {
      let j = i + scheme.length;
      if (j >= input.length || input[j] !== ' ') continue;
      while (j < input.length && input[j] === ' ') j += 1;
      const valueStart = j;
      while (j < input.length && !isWhitespace(input[j]!)) j += 1;
      const value = input.slice(valueStart, j);
      if (value.length >= 1 && value.length <= 512 && /^[\x21-\x7e]+$/.test(value)) {
        return {value, valueStart, end: j};
      }
    }
  }
  return null;
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}

const IDENT_RE = /^["']?([A-Za-z_][A-Za-z0-9_-]{0,63})["']?/;

function matchLabeledKey(input: string, i: number): {value: string; valueStart: number; end: number} | null {
  const slice = input.slice(i, i + 96);
  const m = IDENT_RE.exec(slice);
  if (!m) return null;
  const rawName = m[1]!;
  const normalized = rawName.toLowerCase().replace(/[_-]/g, '');
  const upper = rawName.toUpperCase();
  const matches =
    LABELED_KEY_EXACT.has(normalized) ||
    upper.endsWith('_KEY') ||
    upper.endsWith('_TOKEN') ||
    upper.endsWith('_PASSWORD');
  if (!matches) return null;
  let j = i + m[0].length;
  // optional space/tab, one = or :, optional space/tab
  while (j < input.length && (input[j] === ' ' || input[j] === '\t')) j += 1;
  if (input[j] !== '=' && input[j] !== ':') return null;
  j += 1;
  while (j < input.length && (input[j] === ' ' || input[j] === '\t')) j += 1;
  return readCredentialValue(input, j);
}

function matchCliFlag(input: string, i: number): {value: string; valueStart: number; end: number} | null {
  // Read the flag token up to '=' or whitespace.
  let k = i;
  while (k < input.length && input[k] !== '=' && !isWhitespace(input[k]!)) k += 1;
  const flag = input.slice(i, k).toLowerCase();
  if (!CLI_FLAGS.has(flag)) return null;
  let j = k;
  if (input[j] === '=') {
    j += 1;
  } else if (isWhitespace(input[j] ?? '')) {
    while (j < input.length && (input[j] === ' ' || input[j] === '\t')) j += 1;
  } else {
    return null;
  }
  return readCredentialValue(input, j);
}

/**
 * Read a 1..512-byte credential value: either a quote-delimited printable-ASCII
 * string, or an unquoted token from the allowed character set ending before
 * whitespace, comma, semicolon, `}`, or `]`. Returns null when absent/empty.
 */
function readCredentialValue(input: string, start: number): {value: string; valueStart: number; end: number} | null {
  const q = input[start];
  if (q === '"' || q === "'") {
    let j = start + 1;
    while (j < input.length && input[j] !== q) {
      // printable ASCII only inside the quotes
      const c = input.charCodeAt(j);
      if (c < 0x20 || c > 0x7e) return null;
      j += 1;
    }
    if (input[j] !== q) return null;
    const value = input.slice(start + 1, j);
    if (value.length < 1 || value.length > 512) return null;
    return {value, valueStart: start + 1, end: j + 1};
  }
  // Unquoted: allowed set A-Za-z0-9 . _ ~ + / = % @ : -
  let j = start;
  while (j < input.length) {
    const ch = input[j]!;
    if (isWhitespace(ch) || ch === ',' || ch === ';' || ch === '}' || ch === ']') break;
    if (!/[A-Za-z0-9._~+/=%@:-]/.test(ch)) break;
    j += 1;
  }
  const value = input.slice(start, j);
  if (value.length < 1 || value.length > 512) return null;
  return {value, valueStart: start, end: j};
}

function matchProviderToken(input: string, i: number): {value: string; end: number} | null {
  for (const prefix of PROVIDER_PREFIXES) {
    if (input.startsWith(prefix, i)) {
      let j = i + prefix.length;
      let count = 0;
      while (j < input.length && /[A-Za-z0-9_-]/.test(input[j]!) && count < 256) {
        j += 1;
        count += 1;
      }
      if (count >= 1) return {value: input.slice(i, j), end: j};
    }
  }
  // AKIA + exactly 16 upper-case letters/digits
  if (input.startsWith('AKIA', i)) {
    const tail = input.slice(i + 4, i + 20);
    if (tail.length === 16 && /^[A-Z0-9]{16}$/.test(tail)) {
      // Must not continue into more token chars (exactly 16).
      const after = input[i + 20];
      if (after === undefined || !/[A-Za-z0-9]/.test(after)) {
        return {value: input.slice(i, i + 20), end: i + 20};
      }
    }
  }
  return null;
}

function matchGenericToken(input: string, i: number): {value: string; end: number} | null {
  // A token boundary: previous char must be a non-token char (or start).
  if (i > 0 && /[A-Za-z0-9_-]/.test(input[i - 1]!)) return null;
  let j = i;
  while (j < input.length && /[A-Za-z0-9_-]/.test(input[j]!)) j += 1;
  const value = input.slice(i, j);
  const len = value.length;
  if (len < 32 || len > 256) return null;
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) return null;
  return {value, end: j};
}

// --- Full transform ----------------------------------------------------------

/**
 * Apply all three passes to produce `DurableLocatorSafeText`. `locators` are the
 * exact supplied locators for pass 1 (empty for the recorder's own instruction
 * sanitization when no ingress evidence exists yet).
 */
export function projectDurableSafeText(input: string, locators: SuppliedLocator[] = []): DurableLocatorSafeText {
  const p1 = substituteSuppliedLocators(input, locators);
  const p2 = tokenizeStrongLocators(p1);
  const p3 = redactCredentials(p2);
  return p3 as DurableLocatorSafeText;
}

/** Same as projectDurableSafeText but branded as instruction text. */
export function projectDurableInstructionText(input: string, locators: SuppliedLocator[] = []): DurableInstructionText {
  return projectDurableSafeText(input, locators) as DurableInstructionText;
}

/**
 * Whether text is already fully projected (idempotence check): reapplying the
 * transform (with no supplied locators) yields identical bytes and no strong
 * locator survives.
 */
export function isDurableSafeText(text: string): boolean {
  return projectDurableSafeText(text) === text;
}
