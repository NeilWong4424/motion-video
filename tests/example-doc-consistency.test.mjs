import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const jsonAfter = (text, marker) => {
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, `missing example marker: ${marker}`);
  const match = text.slice(start).match(/```json\n([\s\S]*?)\n```/);
  assert.ok(match, `missing JSON block after: ${marker}`);
  return JSON.parse(match[1]);
};

test('Researcher example uses content-addressed staged sources and closed references', () => {
  const artifact = jsonAfter(
    read('agent/prompts/researcher.md'),
    'A conforming illustrative instance is:',
  );

  const sources = new Map(artifact.sources.map((source) => [source.sourceId, source]));
  const findings = new Set(artifact.findings.map((finding) => finding.id));
  const measurements = new Set(artifact.measurements.map((measurement) => measurement.measurementId));

  for (const source of artifact.sources) {
    assert.match(
      source.localPath,
      new RegExp(`^projects/${artifact.projectId}/sources/${source.sourceId}/${source.sha256}/[^/]+$`),
    );
  }
  for (const finding of artifact.findings) {
    assert.ok(sources.has(finding.sourceId));
    for (const measurementId of finding.measurementIds) assert.ok(measurements.has(measurementId));
  }
  for (const measurement of artifact.measurements) assert.ok(sources.has(measurement.sourceId));
  for (const inference of artifact.inferences) {
    for (const findingId of inference.basedOnFindingIds) assert.ok(findings.has(findingId));
  }
  for (const unresolved of artifact.unresolved) assert.ok(sources.has(unresolved.sourceId));
  if (artifact.status === 'complete') assert.deepEqual(artifact.unresolved, []);
});

test('Revision example declares every stated rendered copy consumer', () => {
  const prompt = read('agent/prompts/revision-interpreter.md');
  const patch = jsonAfter(prompt, 'A valid bounded direct-user-request illustrative instance is below.');

  assert.match(prompt, /headline-copy.+exactly one resolved consumer.+headline-node.+headline-content-track/is);
  assert.match(prompt, /No effect or other node\/track references that copy ID/i);
  assert.deepEqual(patch.operations, [
    {op: 'replace-copy', copyId: 'headline-copy', value: 'User-authorized replacement copy'},
  ]);
  assert.deepEqual(patch.declaredImpactSet, [
    {entity: 'copy', id: 'headline-copy', field: 'text'},
    {entity: 'node', id: 'headline-node', field: 'resolved-render-output'},
    {
      entity: 'node-track',
      id: 'headline-content-track',
      nodeId: 'headline-node',
      channel: 'content',
      field: 'resolved-copy',
    },
  ]);
});

test('Public architecture docs describe advisory, atomic acceptance, continuity, and resume semantics', () => {
  for (const path of ['README.md', 'docs/PROMPT_OS_MAP.md']) {
    const doc = read(path);
    assert.match(doc, /Capability Builder[\s\S]+(?:write-free|writes no candidate|never authors a candidate)/i);
    assert.match(doc, /ArtifactAcceptance@1|successful acceptance/i);
    assert.match(doc, /embedded atomically[\s\S]+interface-result-recorded/i);
    assert.match(doc, /five positive(?:-duration)? continuity families|five positive-duration continuity families/i);
    assert.match(doc, /chapter-cut[\s\S]+(?:exception|not a sixth positive family)/i);
    assert.match(doc, /WAITING_FOR_CAPABILITY_IMPLEMENTATION[\s\S]+resum/i);
  }
  assert.doesNotMatch(read('docs/PROMPT_OS_MAP.md'), /`ArtifactAcceptance@1` Ledger event/);
});
