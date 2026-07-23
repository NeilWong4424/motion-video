/**
 * Single source of truth for the production-source boundary policy.
 *
 * This module owns every forbidden pattern and the executable-file policy that
 * keeps the motion engine offline, deterministic, and free of model/media/secret
 * integrations. The scanner in `scan-production-source.ts` consumes these rules;
 * later milestones (and Task 14's project-capability materialization) reuse the
 * same policy rather than growing independent regex lists.
 *
 * Diagnostics are stable string codes. Prose such as "no API key" in user
 * documentation is allowed; a credential example, setup step, or placeholder is
 * not. The distinction is drawn structurally below.
 */

export type BoundaryDiagnosticCode =
  | 'BOUNDARY_CREDENTIAL_IDENTIFIER'
  | 'BOUNDARY_LICENSE_KEY'
  | 'BOUNDARY_PROCESS_ENV'
  | 'BOUNDARY_MODEL_MEDIA_SDK'
  | 'BOUNDARY_NETWORK_CALL'
  | 'BOUNDARY_NODE_NETWORK_MODULE'
  | 'BOUNDARY_NONDETERMINISTIC_TIME'
  | 'BOUNDARY_NONDETERMINISTIC_RANDOM'
  | 'BOUNDARY_REMOTE_RESOURCE'
  | 'BOUNDARY_REMOTION_VIDEO'
  | 'BOUNDARY_VIDEO_IMPORT'
  | 'BOUNDARY_FORBIDDEN_SUBPROCESS'
  | 'BOUNDARY_SHELL_EXECUTION';

export type BoundaryDiagnostic = {
  code: BoundaryDiagnosticCode;
  file: string;
  line: number;
  evidence: string;
  message: string;
};

/**
 * The repository-wide V1 subprocess allowlist. Audio narrows this further to
 * ffmpeg/ffprobe at its own call sites. Anything outside this set is forbidden.
 */
export const SUBPROCESS_ALLOWLIST = new Set([
  'node',
  'git',
  'pnpm',
  'corepack',
  'ffmpeg',
  'ffprobe',
]);

/** Model / media / vector-service SDK import specifiers that must never appear. */
export const FORBIDDEN_MODULE_SPECIFIERS: readonly RegExp[] = [
  /^openai$/,
  /^@anthropic-ai\//,
  /^@ai-sdk\//,
  /^cohere-ai$/,
  /^@google\/generative-ai$/,
  /^@google\/genai$/,
  /^google-generativeai$/,
  /^replicate$/,
  /^@huggingface\//,
  /^suno/,
  /^udio/,
  /^elevenlabs$/,
  /^@elevenlabs\//,
  /^axios$/,
  /^undici$/,
  /^node-fetch$/,
  /^got$/,
  /^superagent$/,
  /^ws$/,
  /^eventsource$/,
];

/** Node core network modules (bare or `node:` prefixed) that must never appear. */
export const FORBIDDEN_NODE_NETWORK_MODULES: readonly string[] = [
  'http',
  'https',
  'http2',
  'net',
  'tls',
  'dns',
  'dgram',
];

/**
 * Executable file extensions the scanner will parse for policy violations.
 * Documentation extensions (.md, .json, .txt) are only scanned for
 * credential-shaped placeholders, not code-shaped violations.
 */
export const EXECUTABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

type LineRule = {
  code: BoundaryDiagnosticCode;
  pattern: RegExp;
  message: string;
  /** When true, only applies to executable files, not documentation. */
  codeOnly: boolean;
};

// Credential-shaped identifiers, assignments, and placeholders. Matches a
// key-like name adjacent to an assignment or object-literal value, catching
// `apiKey = "..."`, `api_key:` , `secretKey`, `accessToken`, private key
// placeholders, etc. Plain negative prose ("no API key") lacks the assignment
// or value shape and is not matched.
const CREDENTIAL_RULE: LineRule = {
  code: 'BOUNDARY_CREDENTIAL_IDENTIFIER',
  pattern:
    /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|bearer[_-]?token|password|passwd)\b\s*[:=]\s*['"`]?[^'"`\s]/i,
  message: 'Credential-shaped identifier with a value is forbidden in production source.',
  codeOnly: false,
};

// Requires an actual PEM begin marker immediately followed by base64 key body
// on the same or next fragment, so security-policy prose that merely *names*
// the marker (e.g. contract documentation of the redaction grammar) is not a
// false positive, while real embedded key material is caught.
const PRIVATE_KEY_BLOCK_RULE: LineRule = {
  code: 'BOUNDARY_CREDENTIAL_IDENTIFIER',
  pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\\n"'`]*[A-Za-z0-9+/]{40,}/,
  message: 'Embedded private key material is forbidden.',
  codeOnly: false,
};

const CODE_LINE_RULES: readonly LineRule[] = [
  {
    code: 'BOUNDARY_LICENSE_KEY',
    pattern: /\b(?:licenseKey|publicLicenseKey|apiKey)\b\s*[:=]/,
    message: 'Remotion apiKey/licenseKey/publicLicenseKey configuration is forbidden.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_PROCESS_ENV',
    pattern: /process\.env\b/,
    message: 'process.env access is forbidden in production source.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_NETWORK_CALL',
    // fetch(, XMLHttpRequest, WebSocket, EventSource, navigator.sendBeacon,
    // including simple aliasing via a member access.
    pattern:
      /(?<![.\w])(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\.\s*(?:sendBeacon)\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/,
    message: 'Runtime network APIs are forbidden.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_NONDETERMINISTIC_TIME',
    pattern: /\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)|\bperformance\.now\s*\(/,
    message: 'Non-deterministic current-time access is forbidden.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_NONDETERMINISTIC_RANDOM',
    pattern: /\bMath\.random\s*\(/,
    message: 'Unseeded Math.random() is forbidden; derive seeds from project/revision/node/capability.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_REMOTION_VIDEO',
    pattern: /<\s*(?:Video|OffthreadVideo)\b/,
    message: 'Remotion <Video>/<OffthreadVideo> substrate is forbidden.',
    codeOnly: true,
  },
  {
    code: 'BOUNDARY_SHELL_EXECUTION',
    pattern: /\b(?:child_process|exec|execSync|spawnSync)\b.*\b(?:shell\s*:\s*true)\b|\b(?:curl|wget)\b|Invoke-WebRequest|Start-BitsTransfer/,
    message: 'Shell execution and network download tools are forbidden.',
    codeOnly: true,
  },
];

/** Detects a remote (non-local) URL literal used as a resource or connection target. */
const REMOTE_URL_PATTERN = /['"`](?:https?:|wss?:|ftp:)\/\/[^'"`]+['"`]/i;

/** Detects a runtime import of a video file (which could become a substrate). */
const VIDEO_IMPORT_PATTERN =
  /\b(?:import|require)\b[^;\n]*['"`][^'"`]+\.(?:mp4|mov|webm|mkv|avi|m4v)['"`]/i;

export function ruleForCredential(): readonly LineRule[] {
  return [CREDENTIAL_RULE, PRIVATE_KEY_BLOCK_RULE];
}

export function codeLineRules(): readonly LineRule[] {
  return CODE_LINE_RULES;
}

export function remoteUrlPattern(): RegExp {
  return new RegExp(REMOTE_URL_PATTERN.source, REMOTE_URL_PATTERN.flags);
}

export function videoImportPattern(): RegExp {
  return new RegExp(VIDEO_IMPORT_PATTERN.source, VIDEO_IMPORT_PATTERN.flags);
}
