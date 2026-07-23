import {readFileSync, readdirSync, statSync, type Dirent} from 'node:fs';
import {extname, join, relative} from 'node:path';

import {
  EXECUTABLE_EXTENSIONS,
  FORBIDDEN_MODULE_SPECIFIERS,
  FORBIDDEN_NODE_NETWORK_MODULES,
  SUBPROCESS_ALLOWLIST,
  codeLineRules,
  remoteUrlPattern,
  ruleForCredential,
  videoImportPattern,
  type BoundaryDiagnostic,
} from './production-source-policy.js';

export type ScanTarget =
  | {kind: 'files'; baseDir: string; files: readonly string[]}
  | {kind: 'roots'; baseDir: string; roots: readonly string[]; excludeDirs?: readonly string[]};

const DEFAULT_EXCLUDED_DIRS = new Set([
  'node_modules',
  'out',
  '.cache',
  '.remotion',
  '.git',
  'coverage',
  'generated-assets',
  'project-capabilities',
]);

// The boundary policy and scanner modules necessarily *contain* every forbidden
// pattern as detection data, so they are self-excluded from scanning as if they
// were violating code. Their behavior is proven by the dedicated boundary tests.
const SELF_EXCLUDED_FILES = new Set([
  'src/engine/boundary/production-source-policy.ts',
  'src/engine/boundary/scan-production-source.ts',
]);

function isExecutable(path: string): boolean {
  return EXECUTABLE_EXTENSIONS.has(extname(path).toLowerCase());
}

function walk(dir: string, excludeDirs: Set<string>): string[] {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, {withFileTypes: true}) as Dirent[];
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      out.push(...walk(join(dir, entry.name), excludeDirs));
    } else if (entry.isFile()) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function collectImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const importFrom = /\bimport\b[^;'"`]*?from\s*['"`]([^'"`]+)['"`]/g;
  const bareImport = /\bimport\s*['"`]([^'"`]+)['"`]/g;
  const requireCall = /\brequire\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  const dynamicImport = /\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  for (const re of [importFrom, bareImport, requireCall, dynamicImport]) {
    for (const match of source.matchAll(re)) {
      if (match[1]) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function normalizeNodeModule(specifier: string): string {
  return specifier.replace(/^node:/, '').split('/')[0] ?? specifier;
}

function scanSubprocessCalls(
  source: string,
  lines: readonly string[],
  file: string,
): BoundaryDiagnostic[] {
  const diagnostics: BoundaryDiagnostic[] = [];
  // Match spawn/exec/execFile("<binary>" ...) and flag any binary outside the allowlist.
  const spawnPattern = /\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  for (const match of source.matchAll(spawnPattern)) {
    const raw = match[1];
    if (!raw) continue;
    // Skip interpolated/dynamic binaries (e.g. `${bin}.cmd`); the concrete
    // resolved value is checked at its own literal call site.
    if (raw.includes('${')) continue;
    const binary = raw.split(/[\\/]/).pop()?.replace(/\.(exe|cmd|bat)$/i, '') ?? raw;
    if (!SUBPROCESS_ALLOWLIST.has(binary)) {
      const idx = match.index ?? 0;
      const line = source.slice(0, idx).split('\n').length;
      diagnostics.push({
        code: 'BOUNDARY_FORBIDDEN_SUBPROCESS',
        file,
        line,
        evidence: lines[line - 1]?.trim() ?? raw,
        message: `Subprocess "${binary}" is outside the V1 allowlist (${[...SUBPROCESS_ALLOWLIST].join(', ')}).`,
      });
    }
  }
  return diagnostics;
}

function scanImports(
  source: string,
  lines: readonly string[],
  file: string,
): BoundaryDiagnostic[] {
  const diagnostics: BoundaryDiagnostic[] = [];
  for (const specifier of collectImportSpecifiers(source)) {
    if (FORBIDDEN_MODULE_SPECIFIERS.some((re) => re.test(specifier))) {
      const line = lineOf(source, specifier);
      diagnostics.push({
        code: 'BOUNDARY_MODEL_MEDIA_SDK',
        file,
        line,
        evidence: lines[line - 1]?.trim() ?? specifier,
        message: `Forbidden model/media/network SDK import: "${specifier}".`,
      });
    }
    if (FORBIDDEN_NODE_NETWORK_MODULES.includes(normalizeNodeModule(specifier))) {
      const line = lineOf(source, specifier);
      diagnostics.push({
        code: 'BOUNDARY_NODE_NETWORK_MODULE',
        file,
        line,
        evidence: lines[line - 1]?.trim() ?? specifier,
        message: `Forbidden Node network module import: "${specifier}".`,
      });
    }
  }
  return diagnostics;
}

function lineOf(source: string, needle: string): number {
  const idx = source.indexOf(needle);
  if (idx < 0) return 1;
  return source.slice(0, idx).split('\n').length;
}

function scanFile(absolutePath: string, baseDir: string): BoundaryDiagnostic[] {
  const file = relative(baseDir, absolutePath).replaceAll('\\', '/');
  if (SELF_EXCLUDED_FILES.has(file)) return [];
  let source: string;
  try {
    source = readFileSync(absolutePath, 'utf8');
  } catch {
    return [];
  }
  const lines = source.split('\n');
  const executable = isExecutable(absolutePath);
  const diagnostics: BoundaryDiagnostic[] = [];

  // Credential-shaped patterns apply to every scanned file (docs included, so a
  // credential example in Markdown is still rejected).
  const credentialRules = ruleForCredential();
  lines.forEach((text, index) => {
    for (const rule of credentialRules) {
      if (rule.pattern.test(text)) {
        diagnostics.push({
          code: rule.code,
          file,
          line: index + 1,
          evidence: text.trim(),
          message: rule.message,
        });
      }
    }
  });

  if (!executable) return diagnostics;

  // Code-shaped line rules.
  lines.forEach((text, index) => {
    for (const rule of codeLineRules()) {
      if (rule.pattern.test(text)) {
        diagnostics.push({
          code: rule.code,
          file,
          line: index + 1,
          evidence: text.trim(),
          message: rule.message,
        });
      }
    }
  });

  // Remote resource URLs.
  const remote = remoteUrlPattern();
  lines.forEach((text, index) => {
    if (remote.test(text)) {
      diagnostics.push({
        code: 'BOUNDARY_REMOTE_RESOURCE',
        file,
        line: index + 1,
        evidence: text.trim(),
        message: 'Remote resource/connection URL literal is forbidden.',
      });
    }
  });

  // Video-file imports.
  const videoImport = videoImportPattern();
  lines.forEach((text, index) => {
    if (videoImport.test(text)) {
      diagnostics.push({
        code: 'BOUNDARY_VIDEO_IMPORT',
        file,
        line: index + 1,
        evidence: text.trim(),
        message: 'Importing a video file as a runtime substrate is forbidden.',
      });
    }
  });

  diagnostics.push(...scanImports(source, lines, file));
  diagnostics.push(...scanSubprocessCalls(source, lines, file));

  return diagnostics;
}

/**
 * Scan production source under explicit roots or a closed file list and return
 * stable, sorted diagnostics. This is the single reusable boundary scanner;
 * later tasks call it rather than duplicating regex lists.
 */
export function scanProductionSource(target: ScanTarget): BoundaryDiagnostic[] {
  const files: string[] = [];
  if (target.kind === 'files') {
    files.push(...target.files.map((f) => join(target.baseDir, f)));
  } else {
    const excluded = new Set([...DEFAULT_EXCLUDED_DIRS, ...(target.excludeDirs ?? [])]);
    for (const root of target.roots) {
      const abs = join(target.baseDir, root);
      let s;
      try {
        s = statSync(abs);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        files.push(...walk(abs, excluded));
      } else if (s.isFile()) {
        files.push(abs);
      }
    }
  }

  const diagnostics = files.flatMap((f) => scanFile(f, target.baseDir));
  return diagnostics.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code),
  );
}
