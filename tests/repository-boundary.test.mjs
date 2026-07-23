import assert from 'node:assert/strict';
import {existsSync, lstatSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, extname, relative, resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

// Part 2 (the deterministic motion engine) is built in-place alongside the
// Part 1 Prompt OS. The engine owns these roots and config/lockfile paths; they
// are no longer treated as a forbidden "deferred engine" leak. The Part 1
// boundary now asserts only that the DOCUMENTATION surfaces stay declarative:
// no executable code inside the prompt/craft/agent/docs documentation trees,
// and no symlinks. The engine's own no-API/no-network boundary is enforced by
// src/engine/boundary (Part 2, Task 1), not by this Part 1 documentation guard.
const engineRuntimeRoots = new Set([
  'src',
  'scripts',
]);

const enginePart2Files = new Set([
  'remotion.config.ts',
  'remotion.config.js',
  'vite.config.ts',
  'vite.config.js',
  'vitest.config.ts',
  'tsconfig.json',
  'eslint.config.mjs',
  'prettier.config.mjs',
  'pnpm-lock.yaml',
]);

// Documentation trees that must remain declarative (no executable code files).
const documentationRoots = new Set([
  'agent',
  'craft',
  'docs',
  'examples',
  'catalog',
  'projects',
  '.claude',
]);

const executableCodeExtensions = new Set([
  '.c',
  '.cc',
  '.cjs',
  '.cpp',
  '.cts',
  '.go',
  '.h',
  '.hpp',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.kts',
  '.mjs',
  '.mts',
  '.py',
  '.rb',
  '.rs',
  '.sh',
  '.swift',
  '.ts',
  '.tsx',
  '.wasm',
]);

function walk(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    if (entry.name === '.git') return [];
    const absolute = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

// Returns true when a path is executable code living inside a Part 1
// documentation tree, which must stay declarative. Engine roots (src/, scripts/),
// tests, and allowed engine config/lockfiles are explicitly not violations.
function isDocumentationBoundaryViolation(repositoryPath) {
  const normalized = repositoryPath.replaceAll('\\', '/').replace(/^\.\//, '');
  const [topLevel] = normalized.split('/');

  // Engine-owned trees and files are allowed in-place.
  if (engineRuntimeRoots.has(topLevel)) return false;
  if (enginePart2Files.has(normalized)) return false;
  if (topLevel === 'tests') return false;

  // Executable code inside a documentation tree is a violation.
  if (documentationRoots.has(topLevel)) {
    return executableCodeExtensions.has(extname(normalized).toLowerCase());
  }

  return false;
}

test('all checked-in JSON documentation artifacts are valid JSON', () => {
  for (const absolute of walk(root).filter((path) => extname(path) === '.json')) {
    assert.doesNotThrow(
      () => JSON.parse(readFileSync(absolute, 'utf8')),
      `Invalid JSON: ${relative(root, absolute)}`,
    );
  }
});

test('relative Markdown links remain inside the repository and resolve', () => {
  const failures = [];
  for (const absolute of walk(root).filter((path) => extname(path) === '.md')) {
    const markdown = readFileSync(absolute, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      const pathOnly = rawTarget.split('#', 1)[0];
      if (!pathOnly || /^[a-z][a-z0-9+.-]*:/i.test(pathOnly)) continue;
      const target = resolve(dirname(absolute), pathOnly);
      const relativeTarget = relative(root, target);
      if (relativeTarget.startsWith('..') || !existsSync(target)) {
        failures.push(`${relative(root, absolute)} -> ${rawTarget}`);
      }
    }
  }
  assert.deepEqual(failures, [], `Broken or escaping Markdown links:\n${failures.join('\n')}`);
});

test('Part 1 documentation trees stay declarative (no executable code, no symlinks)', () => {
  const checkedInPaths = walk(root).map((path) => relative(root, path).replaceAll('\\', '/'));
  const present = checkedInPaths.filter(isDocumentationBoundaryViolation);
  assert.deepEqual(
    present,
    [],
    `Executable code leaked into a Part 1 documentation tree: ${present.join(', ')}`,
  );

  const symlinks = walk(root)
    .filter((path) => lstatSync(path).isSymbolicLink())
    .map((path) => relative(root, path));
  assert.deepEqual(symlinks, [], `Prompt OS should not depend on symlinks: ${symlinks.join(', ')}`);
});

test('documentation boundary flags code in doc trees but allows engine roots and configs', () => {
  for (const path of [
    'agent/index.ts',
    'craft/compiler.tsx',
    'docs/render.js',
    'examples/compositor.mjs',
    'projects/demo/hack.sh',
  ]) {
    assert.equal(
      isDocumentationBoundaryViolation(path),
      true,
      `Code in a documentation tree escaped the boundary: ${path}`,
    );
  }

  for (const path of [
    'tests/repository-boundary.test.mjs',
    'package.json',
    'docs/example.md',
    'agent/prompt-manifest.json',
    'src/index.ts',
    'src/engine/resolver/resolve-motion.ts',
    'scripts/verify-environment.mjs',
    'tsconfig.json',
    'vitest.config.ts',
    'remotion.config.ts',
  ]) {
    assert.equal(
      isDocumentationBoundaryViolation(path),
      false,
      `Allowed engine/documentation path was rejected: ${path}`,
    );
  }
});

test('the Claude Code video skill has discoverable, trigger-only frontmatter', () => {
  const skill = readFileSync(resolve(root, '.claude/skills/video/SKILL.md'), 'utf8');
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1];
  assert.ok(frontmatter, 'SKILL.md is missing YAML frontmatter');
  assert.match(frontmatter, /^name: [a-z0-9-]+$/m);
  assert.match(frontmatter, /^description: Use when\b.+$/m);
  assert.ok(frontmatter.length <= 1024, 'SKILL.md frontmatter exceeds 1,024 characters');
});
