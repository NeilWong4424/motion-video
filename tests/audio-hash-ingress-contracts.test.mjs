import assert from 'node:assert/strict';
import {lstatSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function documentationFiles(path = root) {
  const results = [];
  for (const entry of readdirSync(path)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const absolute = resolve(path, entry);
    const status = lstatSync(absolute);
    if (status.isSymbolicLink()) continue;
    if (status.isDirectory()) {
      results.push(...documentationFiles(absolute));
    } else if (/\.(?:md|json)$/.test(entry)) {
      results.push(absolute);
    }
  }
  return results;
}

test('AudioBrief is always provider-neutral instrumental direction with no voice exception', () => {
  const contract = read('agent/contracts/role-artifact-contracts.md');
  const prompt = read('agent/prompts/sound-designer.md');
  const template = read('agent/templates/music-prompt-document.md');

  assert.match(contract, /always provider-neutral and instrumental/i);
  assert.match(contract, /no Brief.+(?:authorize|exception).+(?:vocals|spoken words|dialogue|voice)/is);
  assert.doesNotMatch(contract, /instrumental unless/i);

  assert.match(prompt, /must not.+(?:author|request|permit).+(?:vocals|spoken words|dialogue|automatic voice)/is);
  assert.match(prompt, /even when.+(?:Brief|user request).+(?:asks|requests|authorizes)/is);

  assert.match(template, /Create an instrumental cue only/i);
  assert.match(template, /Do not include vocals, spoken words, dialogue/i);
});

test('all repository SHA-256 values use one raw lowercase 64-hex serialization', () => {
  const contract = read('agent/contracts/artifact-contracts.md');
  assert.match(contract, /repository-wide SHA-256 serialization/i);
  assert.match(contract, /\^\[a-f0-9\]\{64\}\$/);
  assert.match(contract, /raw lowercase 64-hex/i);
  assert.match(contract, /must not.+algorithm prefix.+colon/is);

  const prefix = ['sha', '256:'].join('');
  const prefixedDigest = new RegExp(`["']${prefix}[a-f0-9]{16,}`, 'i');
  for (const path of documentationFiles()) {
    const contents = readFileSync(path, 'utf8');
    assert.doesNotMatch(contents, prefixedDigest, `${path} contains a prefixed SHA-256 value`);
  }
});

test('arbitrary invocation paths require safe staging before canonical research', () => {
  for (const entrypoint of ['AGENTS.md', 'CLAUDE.md']) {
    const text = read(entrypoint);
    assert.match(text, /arbitrary user-supplied local path.+ephemeral/is);
    assert.match(text, /stage.+repository-relative.+before.+Researcher/is);
  }

  const contract = read('agent/contracts/role-artifact-contracts.md');
  assert.match(contract, /Local source ingress/i);
  assert.match(contract, /directly supplied.+top-level.+WorkflowInvocation/is);
  assert.match(contract, /copy.+exact bytes.+projects\/<project-id>\/sources/is);
  assert.match(contract, /no.+(?:network|URL).+(?:glob|environment variable|tilde).+embedded/is);
  assert.match(contract, /cannot safely read and stage[\s\S]+write no ResearchFindings/i);
  assert.match(contract, /temporary interface absence[\s\S]+same-state deferred-interface pause/i);
  assert.match(contract, /ResearchSource\.localPath.+only.+staged.+repository-relative/is);

  const workflow = read('agent/video-workflow.md');
  assert.match(workflow, /source ingress.+before.+Researcher/is);
  assert.match(workflow, /Recoverable waiting never writes terminal `STOP`/i);

  const researcher = read('agent/prompts/researcher.md');
  assert.match(researcher, /read only.+staged.+repository-relative.+source/is);
  assert.match(researcher, /must not.+read.+original.+invocation path/is);
});
