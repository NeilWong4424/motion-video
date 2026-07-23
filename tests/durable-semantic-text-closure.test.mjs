import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const field = (name, type) => new RegExp(`${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:\\s*${type}`);
const optionalField = (name, type) => new RegExp(`${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\?:\\s*${type}`);

test('DurableSemanticText is one exact locator-safe semantic prose alias', () => {
  const trust = read('agent/contracts/input-trust.md');

  assert.match(trust, /type DurableSemanticText\s*=\s*DurableLocatorSafeText;/);
  assert.match(trust, /semantic prose[\s\S]+same recursive[\s\S]+locator[\s\S]+secret/i);
});

test('Brief, Research, and AudioBrief semantic prose never widens to string', () => {
  const contract = read('agent/contracts/role-artifact-contracts.md');

  for (const name of ['claim', 'title', 'goal', 'audience', 'message']) {
    assert.match(contract, field(name, 'DurableSemanticText'));
  }
  assert.match(contract, field('cta', 'DurableSemanticText \\| null'));
  for (const name of ['constraints', 'prohibitedContent', 'assumptions']) {
    assert.match(contract, field(name, 'DurableSemanticText\\[\\]'));
  }
  assert.match(contract, field('metric', 'DurableSemanticText'));
  for (const name of ['label', 'sound', 'style', 'instrumentation', 'tempoKey', 'hook', 'dynamics', 'exclude', 'sfxNotes']) {
    assert.match(contract, field(name, 'DurableSemanticText'));
  }

  for (const name of ['claim', 'title', 'goal', 'audience', 'message', 'metric', 'label', 'sound', 'style', 'instrumentation', 'tempoKey', 'hook', 'dynamics', 'exclude', 'sfxNotes']) {
    assert.doesNotMatch(contract, field(name, 'string'));
  }
});

test('Treatment prose is durable and catalog selections use closed aliases', () => {
  const treatment = read('agent/contracts/treatment-contract.md');
  const catalog = read('agent/contracts/catalog-registry-contract.md');

  for (const name of ['objective', 'message', 'focalIntent', 'liveContinuityIntent', 'revealedSpatialRelation', 'visualThesis', 'copyStrategy']) {
    assert.match(treatment, field(name, 'DurableSemanticText'));
    assert.doesNotMatch(treatment, field(name, 'string'));
  }
  assert.match(treatment, field('motionProfile', 'CatalogMotionProfileId'));
  assert.match(treatment, field('stylePackId', 'CatalogStylePackId'));
  assert.match(catalog, /type CatalogMotionProfileId\s*=/);
  assert.match(catalog, /type CatalogStylePackId\s*=/);
  assert.match(catalog, field('intent', 'DurableSemanticText'));
});

test('MotionSpec authored copy, Beat intent, bridge rationale, and cue prose are durable', () => {
  const contract = read('agent/contracts/motion-spec-contract.md');

  assert.match(contract, /type CopyRegistryEntry\s*=\s*\{[\s\S]*?text:\s*DurableSemanticText;/);
  assert.match(contract, /type Beat\s*=\s*\{[\s\S]*?objective:\s*DurableSemanticText;[\s\S]*?message:\s*DurableSemanticText;/);
  assert.match(contract, field('narrativeReason', 'DurableSemanticText'));
  assert.match(contract, optionalField('combinationMeaning', 'DurableSemanticText'));
  assert.match(contract, field('exceptionJustification', 'DurableSemanticText'));
  assert.match(contract, /type MotionCue\s*=\s*\{[\s\S]*?label:\s*DurableSemanticText;/);

  assert.match(contract, /type DesignTokenValue\s*=[\s\S]+\{kind:\s*"string";\s*value:\s*string\}/);
});

test('Review prose is durable and violated rules use a safe rule ID', () => {
  const contract = read('agent/contracts/review-contract.md');

  for (const name of ['missingReason', 'observerAttestation', 'observation', 'requiredAction']) {
    assert.match(contract, field(name, 'DurableSemanticText'));
    assert.doesNotMatch(contract, field(name, 'string'));
  }
  assert.match(contract, /type SafeRuleId\s*=/);
  assert.match(contract, field('violatedRule', 'SafeRuleId'));
  assert.match(contract, field('blockingReasons', '\\[DurableSemanticText, \.\.\.DurableSemanticText\\[\\]\\]'));
});

test('Revision prose and replace-copy values are durable while design tokens stay role-typed', () => {
  const contract = read('agent/contracts/revision-contract.md');

  for (const name of ['narrativeReason', 'combinationMeaning', 'exceptionJustification']) {
    assert.match(contract, optionalField(name, 'DurableSemanticText'));
    assert.doesNotMatch(contract, optionalField(name, 'string'));
  }
  assert.match(contract, /op:\s*"replace-copy";\s*copyId:\s*string;\s*value:\s*DurableSemanticText/);
  assert.match(contract, /op:\s*"set-token";\s*tokenId:\s*string;\s*expectedValueKind:\s*"string";\s*value:\s*string/);
});

test('CapabilityGap prose is durable and prohibited changes are a closed code set', () => {
  const contract = read('agent/contracts/capability-gap-contract.md');

  for (const name of ['requiredIntent', 'whyExistingCompositionFails', 'honestApproximation', 'proposedProjectLocalScope']) {
    assert.match(contract, field(name, name === 'honestApproximation' || name === 'proposedProjectLocalScope'
      ? 'DurableSemanticText \\| null'
      : 'DurableSemanticText'));
    assert.doesNotMatch(contract, field(name, 'string'));
  }
  assert.match(contract, /type ProhibitedEngineChangeCode\s*=/);
  assert.match(contract, field('prohibitedEngineChanges', '\\[ProhibitedEngineChangeCode, \.\.\.ProhibitedEngineChangeCode\\[\\]\\]'));
  assert.doesNotMatch(contract, field('prohibitedEngineChanges', '\\[string'));
});
