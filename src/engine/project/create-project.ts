import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {resolveProjectPaths, type ProjectPaths, type RepoContext} from './paths.js';

const SENTINEL = '__PROJECT_ID__';

// The engine-owned template files copied into a new project. Part 1 prompt-era
// documentation files in projects/_template/ are intentionally not copied.
const TEMPLATE_TEXT_FILES = ['project.json', 'brief.spec.json', 'treatment.json', 'motion.spec.json'];
const TEMPLATE_COPY_FILES = ['NOTES.md', 'EDIT_MAP.md'];

/**
 * Create a new draft project by copying the engine template files, replacing the
 * `__PROJECT_ID__` sentinel, and creating the assets/revisions directories.
 * Refuses an existing target.
 */
export async function createProject(context: RepoContext, projectId: string): Promise<ProjectPaths> {
  const paths = resolveProjectPaths(context, projectId);
  if (existsSync(paths.root)) {
    throw new Error('PROJECT_EXISTS');
  }
  const templateRoot = join(context.repoRoot, 'projects', '_template');

  mkdirSync(paths.root, {recursive: true});
  for (const sub of ['images', 'fonts', 'references', 'audio']) {
    mkdirSync(join(paths.assets, sub), {recursive: true});
  }
  mkdirSync(paths.revisions, {recursive: true});

  for (const file of TEMPLATE_TEXT_FILES) {
    const raw = readFileSync(join(templateRoot, file), 'utf8');
    writeFileSync(join(paths.root, file), raw.replaceAll(SENTINEL, projectId));
  }
  for (const file of TEMPLATE_COPY_FILES) {
    const src = join(templateRoot, file);
    if (existsSync(src)) copyFileSync(src, join(paths.root, file));
  }

  return paths;
}
