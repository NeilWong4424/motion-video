import {pathToFileURL} from 'node:url';

import {Command} from 'commander';

import {deriveRepoContext, type RepoContext} from '../engine/project/paths.js';
import {runNew} from './commands/new.js';
import {runSnapshot} from './commands/snapshot.js';
import {runValidate} from './commands/validate.js';
import {runResolve} from './commands/resolve.js';
import {runPreview} from './commands/preview.js';
import {runStills} from './commands/stills.js';
import {runInspect} from './commands/inspect.js';

/**
 * Run the motion CLI. Production passes no context and derives the immutable
 * repo root from the CLI module location; tests inject an isolated RepoContext.
 * There is no public root/workspace override.
 */
export async function runMotionCli(argv: string[], context?: RepoContext): Promise<number> {
  const ctx = context ?? deriveRepoContext(import.meta.url);

  let exitCode = 0;
  const program = new Command();
  program
    .name('motion')
    .description('Local continuity-first text-to-motion engine')
    .exitOverride();
  // Reject unknown options and excess arguments; no root flag exists.
  program.allowUnknownOption(false);
  program.allowExcessArguments(false);

  program
    .command('new')
    .argument('<project-id>', 'lowercase kebab-case project id')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runNew(ctx, projectId);
    });

  program
    .command('snapshot')
    .argument('<project-id>', 'project id to snapshot as rev-0001')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runSnapshot(ctx, projectId);
    });

  program
    .command('validate')
    .argument('<project-id>')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runValidate(ctx, projectId);
    });

  program
    .command('resolve')
    .argument('<project-id>')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runResolve(ctx, projectId);
    });

  program
    .command('preview')
    .argument('<project-id>')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runPreview(ctx, projectId);
    });

  program
    .command('stills')
    .argument('<project-id>')
    .option('--frames <frames>', 'comma-separated integer frames', '0')
    .allowUnknownOption(false)
    .action(async (projectId: string, options: {frames: string}) => {
      const frames = options.frames.split(',').map((f) => Number.parseInt(f.trim(), 10));
      exitCode = await runStills(ctx, projectId, frames);
    });

  program
    .command('inspect')
    .argument('<project-id>')
    .allowUnknownOption(false)
    .action(async (projectId: string) => {
      exitCode = await runInspect(ctx, projectId);
    });

  try {
    await program.parseAsync(argv, {from: 'user'});
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as {code?: string}).code;
      // Commander help/version exits are code 0.
      if (code === 'commander.helpDisplayed' || code === 'commander.version') {
        return 0;
      }
      if (code === 'commander.help') return 0;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
  return exitCode;
}

// Production entry point: fires when this module is the process entry, using a
// separator-safe file-URL comparison that works under tsx on Windows and POSIX.
const entryPath = process.argv[1];
const isDirectRun = entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href;
if (isDirectRun) {
  runMotionCli(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}
