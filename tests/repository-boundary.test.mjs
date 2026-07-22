import assert from 'node:assert/strict';
import {existsSync, lstatSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, extname, relative, resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

function walk(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    if (entry.name === '.git') return [];
    const absolute = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
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

test('Part 1 contains no deferred motion-engine implementation', () => {
  const forbidden = [
    'src',
    'scripts',
    'remotion.config.ts',
    'vite.config.ts',
    'tsconfig.json',
    'pnpm-lock.yaml',
    'package-lock.json',
  ];
  const present = forbidden.filter((path) => existsSync(resolve(root, path)));
  assert.deepEqual(present, [], `Part 2 files appeared in Part 1: ${present.join(', ')}`);

  const symlinks = walk(root)
    .filter((path) => lstatSync(path).isSymbolicLink())
    .map((path) => relative(root, path));
  assert.deepEqual(symlinks, [], `Prompt OS should not depend on symlinks: ${symlinks.join(', ')}`);
});

test('the Claude Code video skill has discoverable, trigger-only frontmatter', () => {
  const skill = readFileSync(resolve(root, '.claude/skills/video/SKILL.md'), 'utf8');
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1];
  assert.ok(frontmatter, 'SKILL.md is missing YAML frontmatter');
  assert.match(frontmatter, /^name: [a-z0-9-]+$/m);
  assert.match(frontmatter, /^description: Use when\b.+$/m);
  assert.ok(frontmatter.length <= 1024, 'SKILL.md frontmatter exceeds 1,024 characters');
});
