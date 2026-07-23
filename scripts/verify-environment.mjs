import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';

// Deterministic environment preflight. No shell interpolation, no network.
// Node is pinned to the supported major range for this machine (>=24.12 <25);
// pnpm must be exactly 11.7.0; ffmpeg and ffprobe must be present.

const SUPPORTED_NODE = {major: 24, minMinor: 12};
const REQUIRED_PNPM = '11.7.0';

/** @param {string} code @param {string} message */
function fail(code, message) {
  console.error(`${code}: ${message}`);
  process.exit(1);
}

function checkNode() {
  const [major, minor] = process.versions.node.split('.').map((n) => Number.parseInt(n, 10));
  if (major !== SUPPORTED_NODE.major || (major === SUPPORTED_NODE.major && minor < SUPPORTED_NODE.minMinor)) {
    fail(
      'ENV_NODE_UNSUPPORTED',
      `Node ${process.versions.node} is unsupported; require >=24.${SUPPORTED_NODE.minMinor} <25.`,
    );
  }
}

/**
 * Spawn a binary and return trimmed stdout, or null if it cannot run.
 * All commands and args are fixed literals, never derived from external input.
 * @param {string} binary
 * @param {string[]} args
 */
function runVersion(binary, args) {
  const direct = spawnSync(binary, args, {encoding: 'utf8'});
  if (!direct.error && direct.status === 0) return direct.stdout.trim();
  return null;
}

/**
 * Resolve pnpm via corepack's JS entry using the current Node binary. This is
 * shell-free and cross-platform: Windows `.cmd` shims cannot be spawned without
 * a shell, but corepack ships a plain `.js` next to `node`.
 * @param {string[]} args
 */
function runCorepack(args) {
  const nodeBin = process.execPath;
  const corepackJs = join(dirname(nodeBin), 'node_modules', 'corepack', 'dist', 'corepack.js');
  if (!existsSync(corepackJs)) return null;
  const result = spawnSync(nodeBin, [corepackJs, ...args], {encoding: 'utf8'});
  if (!result.error && result.status === 0) return result.stdout.trim();
  return null;
}

function checkPnpm() {
  // Prefer a directly installed pnpm; otherwise use the Node-bundled corepack
  // to invoke the pinned pnpm without a shell.
  const version = runVersion('pnpm', ['--version']) ?? runCorepack(['pnpm', '--version']);
  if (version === null) {
    fail('ENV_PNPM_UNSUPPORTED', `pnpm is not available; require exactly ${REQUIRED_PNPM}.`);
  }
  if (version !== REQUIRED_PNPM) {
    fail('ENV_PNPM_UNSUPPORTED', `pnpm ${version} is unsupported; require exactly ${REQUIRED_PNPM}.`);
  }
}

/** @param {string} binary @param {string} missingCode */
function checkFfBinary(binary, missingCode) {
  const version = runVersion(binary, ['-version']);
  if (version === null) {
    fail(missingCode, `${binary} is not available on PATH.`);
  }
}

checkNode();
checkPnpm();
checkFfBinary('ffmpeg', 'ENV_FFMPEG_MISSING');
checkFfBinary('ffprobe', 'ENV_FFPROBE_MISSING');

console.log('environment ok: node', process.versions.node, '| pnpm', REQUIRED_PNPM, '| ffmpeg | ffprobe');
