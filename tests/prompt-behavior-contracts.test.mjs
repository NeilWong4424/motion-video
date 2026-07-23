import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function requires(path, patterns) {
  const text = read(path);
  for (const [label, pattern] of patterns) {
    assert.match(text, pattern, `${path} does not make ${label} explicit`);
  }
}

test('a sparse one-sentence brief records assumptions without inventing claims', () => {
  requires('agent/prompts/brief-planner.md', [
    ['fact/constraint/assumption/unknown separation', /fact.+constraint.+assumption.+unknown/is],
    ['truth-critical questioning', /truth-critical/i],
    ['unsupported-claim stop', /unsupported.+claim|claim.+(?:lacks|without).+(?:evidence|source)/i],
    ['one-message ownership', /one message/i],
    ['no visual direction authority', /must not[\s\S]+(?:style|composition|motion profile)/i],
  ]);
});

test('reference analysis measures local evidence and cannot turn it into direction', () => {
  requires('agent/prompts/researcher.md', [
    ['local-only provenance', /local source path/i],
    ['frame or time evidence', /frame|timestamp|time range/i],
    ['cadence and hold/travel measurement', /cut cadence[\s\S]+hold[\s\S]+travel/i],
    ['geometry and overlap measurement', /geometry[\s\S]+overlap/i],
    ['observation/inference split', /observation[\s\S]+inference/i],
    ['no treatment authority', /must not[\s\S]+(?:choose|select).+(?:style|creative direction|treatment)/i],
  ]);
});

test('creative direction treats camera travel as spatial meaning, not decoration', () => {
  requires('agent/prompts/creative-direction.md', [
    ['fixed continuity policy', /seamless-default/i],
    ['spatial-relation question', /spatial relationship.+camera travel|camera travel.+spatial relationship/is],
    ['held live composition fallback', /held live composition|held (?:shot|camera|composition)[\s\S]+live (?:content|motion)/i],
    ['cut budget', /chapterCutBudget[\s\S]{0,100}0[\s\S]{0,40}1/i],
    ['no executable implementation', /must not[\s\S]+(?:React|CSS|executable code)/i],
  ]);
});

test('motion planning makes continuity structural and records unsupported expression as a gap', () => {
  requires('agent/prompts/motion-planner.md', [
    ['one bridge per adjacent pair', /exactly one bridge.+adjacent Beat/is],
    ['persistent IDs', /persistent.+(?:node IDs|identity)|stable identity[\s\S]+node ID/i],
    ['global clock/world/camera', /global (?:frame )?clock[\s\S]+(?:Persistent World|global world)[\s\S]+global camera/i],
    ['chapter-cut ceiling', /maximum.+one.+chapter cut/i],
    ['typed gap disposition', /CapabilityGap@1|CAPABILITY_GAP/],
    ['no unknown capability', /must not[\s\S]+undeclared capabilit/i],
  ]);
});

test('capability work cannot start from convenience or silently change shared engine scope', () => {
  requires('agent/prompts/capability-builder.md', [
    ['recorded gap precondition', /recorded CAPABILITY_GAP/],
    ['composition check first', /existing.+capabilit.+(?:composition|combine)/is],
    ['project-local scope', /project-local/i],
    ['closed manifest, fixture, tests and performance proof', /manifest[\s\S]+fixture[\s\S]+test[\s\S]+performance/i],
    ['no core promotion', /must not[\s\S]+(?:promote|shared catalog|core catalog)/i],
  ]);
});

test('natural-language revisions become lock-aware patches, never direct edits', () => {
  requires('agent/prompts/revision-interpreter.md', [
    ['base revision and source hashes', /base revision[\s\S]+hash/i],
    ['stable semantic targets', /semantic (?:ID|target)/i],
    ['declared impact', /impact/i],
    ['bounded/rebuild distinction', /bounded[\s\S]+rebuild/i],
    ['review-linked structural rebuild', /rebuild[\s\S]+review issue/i],
    ['direct-edit prohibition', /must not.+directly edit/is],
  ]);
});

test('cold reviewers write evidence and decisions but never repairs or approval', () => {
  for (const path of ['agent/reviewers/creative-reviewer.md', 'agent/reviewers/motion-reviewer.md']) {
    requires(path, [
      ['hash-bound evidence', /RenderPlan hash|hash-bound[\s\S]+RenderPlan/i],
      ['structured frame evidence', /frame range|frameRange/i],
      ['three-way decision', /ship.+fix.+rebuild/is],
      ['read-only behavior', /read-only/i],
      ['no Preview Approval authority', /must not[\s\S]+(?:approve|Preview Approval)/i],
    ]);
  }
});

test('motion review catches slide rhythm using playback and seam evidence', () => {
  requires('agent/reviewers/motion-reviewer.md', [
    ['two playback speeds', /1(?:\.0)?×[\s\S]+0\.25×/i],
    ['bridge samples', /before[\s\S]+midpoint[\s\S]+after/i],
    ['brightness/dead-frame scan', /brightness[\s\S]+dead frame/i],
    ['eye trace', /eye trace/i],
    ['persistent identity', /persistent identity|Persistent World[\s\S]+stable identity/i],
    ['slide-like rhythm', /slide-like|slide rhythm/i],
    ['real target distinction', /real frozen target|actual target component|real target[\s\S]+mounted[\s\S]+frozen/i],
  ]);
});

test('audio stops for manual generation and preserves locked visual timing', () => {
  for (const path of ['agent/prompts/sound-designer.md', 'docs/workflows/audio-handoff.md']) {
    requires(path, [
      ['locked silent-cut precondition', /approved.+locked.+silent cut/i],
      ['single payoff', /exactly one.+payoff/i],
      ['future deterministic prompt interface', /MUSIC_PROMPT\.md/],
      ['manual third-party generation', /user.+third-party.+music generator/i],
      ['manual stop', /stop.+manual|manual.+stop/is],
      ['user-declared return timing', /user-declared.+payoff/i],
      ['no visual recut', /must not[\s\S]+(?:retime|recut|change).+(?:visual|picture)/i],
    ]);
  }
});

test('unsupported product expansion is routed out of scope', () => {
  const workflow = read('agent/video-workflow.md');
  assert.match(workflow, /out[_ -]of[_ -]scope/i);
  assert.match(workflow, /web (?:application|product|dashboard)/i);
  assert.match(workflow, /queue|database/i);
  assert.match(workflow, /AI-generated (?:image|video)/i);
  assert.match(workflow, /(?:must not|do not)[\s\S]+expand.+scope/i);
});
