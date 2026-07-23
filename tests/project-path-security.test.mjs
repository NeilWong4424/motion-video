import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('project identity is sanitized before validation allocation lookup or persistence', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const workflow = read('agent/video-workflow.md');

  assert.match(decision, /locator-and-secret projection[^\n]+raw user request and raw requested project ID[^\n]+before[^\n]+ProjectId/i);
  assert.match(decision, /requestedProjectId[\s\S]+secret or locator[\s\S]+reject[\s\S]+safe replacement/i);
  assert.match(decision, /slug[\s\S]+sanitized[\s\S]+bytes/i);
  assert.match(ledger, /project and secret-sanitize[\s\S]+allocate\/validate `projectId`/i);
  assert.match(workflow, /Before resolving or allocating `ProjectId`[^\n]+projection/i);
  assert.doesNotMatch(ledger, /allocate\/validate `projectId`; project and secret-sanitize/i);
});

test('project and capability path components reject Windows reserved device basenames', () => {
  const decision = read('agent/contracts/workflow-decision.md');
  const ledger = read('agent/contracts/workflow-ledger.md');
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const corpus = `${decision}\n${ledger}\n${acceptance}`;

  assert.match(decision, /type ReservedDeviceBasename\s*=/);
  for (const name of ['"con"', '"prn"', '"aux"', '"nul"', '"com1"', '"com9"', '"lpt1"', '"lpt9"']) {
    assert.ok(decision.includes(name), `missing reserved device ${name}`);
  }
  assert.match(decision, /ProjectId[^\n]+invalid[^\n]+ReservedDeviceBasename/i);
  assert.match(ledger, /basename before the first dot[\s\S]+ReservedDeviceBasename/i);
  assert.match(acceptance, /Windows reserved-device-basename/i);
  assert.match(corpus, /case-insensitive/i);
});
