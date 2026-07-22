import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

const expectedFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/skills/video/SKILL.md',
  'README.md',
  'agent/video-workflow.md',
  'agent/prompt-manifest.json',
  'agent/contracts/authority-matrix.md',
  'agent/contracts/artifact-contracts.md',
  'agent/contracts/capability-gap-contract.md',
  'agent/contracts/engine-interface.md',
  'agent/contracts/diagnostics.md',
  'agent/contracts/input-trust.md',
  'agent/contracts/motion-spec-contract.md',
  'agent/contracts/revision-contract.md',
  'agent/contracts/review-contract.md',
  'agent/contracts/role-result.md',
  'agent/contracts/treatment-contract.md',
  'agent/contracts/workflow-decision.md',
  'agent/templates/music-prompt-document.md',
  'agent/prompts/brief-planner.md',
  'agent/prompts/researcher.md',
  'agent/prompts/creative-direction.md',
  'agent/prompts/motion-planner.md',
  'agent/prompts/capability-builder.md',
  'agent/prompts/revision-interpreter.md',
  'agent/prompts/sound-designer.md',
  'agent/reviewers/creative-reviewer.md',
  'agent/reviewers/motion-reviewer.md',
  'craft/index.md',
  'craft/skill-manifest.json',
  'craft/motion-craft.md',
  'craft/continuity-first.md',
  'craft/continuous-world.md',
  'craft/camera-choreography.md',
  'craft/style-system.md',
  'craft/kinetic-type.md',
  'craft/shape-path-motion.md',
  'craft/data-motion.md',
  'craft/diagram-motion.md',
  'craft/ui-motion.md',
  'craft/logo-motion.md',
  'craft/ambient-motion.md',
  'craft/sound-design.md',
  'craft/delivery.md',
  'docs/workflows/audio-handoff.md',
  'docs/workflows/capability-gap.md',
  'docs/workflows/revision.md',
  'docs/PROMPT_OS_MAP.md',
  'docs/PART1_STATUS.md',
  'projects/_template/BRIEF_INPUT.md',
  'projects/_template/LOCAL_SOURCES.md',
  'projects/_template/REVISION_REQUEST.md',
  'projects/_template/project.policy.example.json',
  'examples/invocations.md',
];

const roleFiles = [
  'agent/prompts/brief-planner.md',
  'agent/prompts/researcher.md',
  'agent/prompts/creative-direction.md',
  'agent/prompts/motion-planner.md',
  'agent/prompts/capability-builder.md',
  'agent/prompts/revision-interpreter.md',
  'agent/prompts/sound-designer.md',
  'agent/reviewers/creative-reviewer.md',
  'agent/reviewers/motion-reviewer.md',
];

const requiredRoleSections = [
  'Purpose',
  'Authority',
  'Reads',
  'Writes',
  'Must',
  'Must not',
  'Stop conditions',
  'Procedure',
  'Output schema',
  'Handoff',
];

const canonicalStates = [
  'INTAKE',
  'FACT_CHECK',
  'BRIEF',
  'TREATMENT',
  'MOTION_SPEC',
  'CAPABILITY_GAP',
  'VALIDATE',
  'SNAPSHOT',
  'RESOLVE',
  'PREVIEW',
  'TECHNICAL_QC',
  'CREATIVE_AND_MOTION_REVIEW',
  'BOUNDED_FIX',
  'REVISION_INTERPRET',
  'APPLY_SEMANTIC_REVISION',
  'PREVIEW_GATE',
  'SILENT_FINAL',
  'AUDIO_BRIEF',
  'AUDIO_PROMPT',
  'STOP_MANUAL_MUSIC_GENERATION',
  'OPTIONAL_LOCAL_MUX',
  'DELIVERY',
];

const roleWrites = {
  'brief-planner': ['projects/<project-id>/brief.spec.json'],
  researcher: ['projects/<project-id>/research.findings.json'],
  'creative-direction': ['projects/<project-id>/treatment.json'],
  'motion-planner': [
    'projects/<project-id>/motion.spec.json',
    'projects/<project-id>/capability-gaps/<gap-id>.json',
  ],
  'capability-builder': [],
  'revision-interpreter': ['projects/<project-id>/revision.patch.json'],
  'sound-designer': ['projects/<project-id>/audio-brief.json'],
  'creative-reviewer': ['out/<project-id>/<revision-id>/<render-plan-hash>/review/creative-review.json'],
  'motion-reviewer': ['out/<project-id>/<revision-id>/<render-plan-hash>/review/motion-review.json'],
};

function file(path) {
  return join(root, path);
}

function read(path) {
  return readFileSync(file(path), 'utf8');
}

function headingExists(markdown, heading) {
  return new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm').test(markdown);
}

test('Part 1 contains every declared orchestrator, role, skill and workflow prompt', () => {
  const missing = expectedFiles.filter((path) => !existsSync(file(path)));
  assert.deepEqual(missing, [], `Missing Prompt OS files:\n${missing.join('\n')}`);
});

test('every role prompt exposes the same auditable contract sections', () => {
  for (const path of roleFiles) {
    const markdown = read(path);
    const missing = requiredRoleSections.filter((heading) => !headingExists(markdown, heading));
    assert.deepEqual(missing, [], `${path} is missing sections: ${missing.join(', ')}`);
  }
});

test('the role manifest gives each canonical artifact exactly one owner', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  assert.equal(manifest.contractVersion, 'prompt-os/v1');
  assert.deepEqual(
    Object.fromEntries(manifest.roles.filter((role) => role.id !== 'orchestrator').map((role) => [role.id, role.writes])),
    roleWrites,
  );

  const concreteWrites = manifest.roles.flatMap((role) => role.writes.map((path) => [path, role.id]));
  const duplicates = concreteWrites.filter(([path], index) => concreteWrites.findIndex(([candidate]) => candidate === path) !== index);
  assert.deepEqual(duplicates, [], 'Two roles claim the same write target');

  const capabilityBuilder = manifest.roles.find((role) => role.id === 'capability-builder');
  assert.equal(capabilityBuilder.availability, 'interface-stub');
  assert.deepEqual(capabilityBuilder.futureWrites, [
    'projects/<project-id>/capabilities/<capability-id>/capability.manifest.json',
  ]);
});

test('orchestration closes re-entry, approval provenance and repair-cycle semantics', () => {
  const workflow = read('agent/video-workflow.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const engine = read('agent/contracts/engine-interface.md');
  const diagnostics = read('agent/contracts/diagnostics.md');

  for (const route of ['new project', 'existing visual revision', 'review request', 'audio request', 'delivery request']) {
    assert.match(workflow, new RegExp(route, 'i'), `Missing request re-entry route: ${route}`);
  }
  assert.match(workflow, /currentRevisionId\s*!==?\s*null[\s\S]+RESOLVE/i);
  assert.match(workflow, /RECORD_PREVIEW_APPROVAL[\s\S]+APPROVED[\s\S]+SILENT_FINAL/i);
  assert.match(workflow, /failure|refusal/i);
  assert.match(workflow, /TECHNICAL_QC[\s\S]+(?:block|fail)[\s\S]+(?:must not|cannot).+(?:review|PREVIEW_GATE)/i);
  assert.match(workflow, /repairCycleId/);
  assert.match(workflow, /structuralRepairCount/);
  assert.match(workflow, /visualRepairCount/);
  assert.match(workflow, /rebuild\s*>\s*fix\s*>\s*ship/i);

  assert.match(artifacts, /ProjectPolicy@1/);
  assert.match(artifacts, /policyHash/);
  assert.match(engine, /Approval recorder/i);
  assert.match(engine, /PreviewApproval@1/);
  assert.match(engine, /QC.+both review.+policy/is);
  assert.match(diagnostics, /same revision|same RenderPlan/i);
  assert.match(diagnostics, /preview.+sampled.+QC.+review.+approval/is);
  assert.match(diagnostics, /byte|hash/i);
});

test('host entry points stay thin and route to the same workflow', () => {
  for (const path of ['AGENTS.md', 'CLAUDE.md', '.claude/skills/video/SKILL.md']) {
    const markdown = read(path);
    assert.match(markdown, /agent\/video-workflow\.md/);
    assert.ok(markdown.split('\n').length <= 90, `${path} duplicates too much policy`);
    assert.match(markdown, /no API key/i);
    assert.match(markdown, /AI-generated video/i);
  }
});

test('the orchestrator declares the full state machine and cannot design or bypass gates', () => {
  const workflow = read('agent/video-workflow.md');
  for (const state of canonicalStates) {
    assert.match(workflow, new RegExp(`\\b${state}\\b`), `Missing workflow state: ${state}`);
  }
  assert.match(workflow, /orchestrator.+must not.+design/i);
  assert.match(workflow, /maximum.+one.+chapter cut/i);
  assert.match(workflow, /Engine implementation status/i);
  assert.match(workflow, /required interface.+not implemented/i);
});

test('continuity prompts reject slide resets and require measurable bridge evidence', () => {
  const corpus = [
    read('agent/prompts/creative-direction.md'),
    read('agent/prompts/motion-planner.md'),
    read('agent/reviewers/motion-reviewer.md'),
    read('craft/continuity-first.md'),
    read('craft/continuous-world.md'),
    read('craft/camera-choreography.md'),
  ].join('\n');
  for (const term of ['Persistent World', 'stable identity', 'bridge', 'eye trace', 'dead frame', 'preroll']) {
    assert.match(corpus, new RegExp(term, 'i'), `Continuity corpus is missing ${term}`);
  }
  assert.match(corpus, /Beat[^\n]+not[^\n]+slide/i);
  assert.match(corpus, /maximum.+one.+chapter cut/i);
  assert.match(corpus, /before.+midpoint.+after/i);
  assert.match(corpus, /1(?:\.0)?×.+0\.25×/i);
});

test('research and creative authority remain separate', () => {
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const researcher = manifest.roles.find((role) => role.id === 'researcher');
  const creative = manifest.roles.find((role) => role.id === 'creative-direction');
  assert.deepEqual(researcher.writes, ['projects/<project-id>/research.findings.json']);
  assert.ok(!researcher.authority.includes('treatment'));
  assert.ok(creative.authority.includes('treatment'));
  assert.match(read('agent/prompts/researcher.md'), /local source path/i);
  assert.match(read('agent/prompts/researcher.md'), /cut cadence|hold duration/i);
});

test('capability gaps and revisions cannot become untracked source edits', () => {
  const capability = read('agent/prompts/capability-builder.md');
  const revision = read('agent/prompts/revision-interpreter.md');
  assert.match(capability, /recorded CAPABILITY_GAP/);
  assert.match(capability, /project-local/);
  assert.match(capability, /fixture/);
  assert.match(capability, /performance/);
  assert.match(revision, /SemanticPatch/);
  assert.match(revision, /bounded/);
  assert.match(revision, /rebuild/);
  assert.match(revision, /lock/i);
  assert.match(revision, /must not.+directly edit/i);
});

test('audio has one locked-cut-first manual workflow and no competing order', () => {
  const paths = [
    'agent/video-workflow.md',
    'agent/prompts/sound-designer.md',
    'craft/sound-design.md',
    'docs/workflows/audio-handoff.md',
  ];
  const corpus = paths.map(read).join('\n');
  assert.doesNotMatch(corpus, /score[- ]first|music first|cut to music first/i);
  assert.match(corpus, /approved.+locked.+silent cut/i);
  assert.match(corpus, /MUSIC_PROMPT\.md/);
  assert.match(corpus, /user.+third-party.+music generator/i);
  assert.match(corpus, /must not.+generate music/i);
  assert.match(corpus, /user-declared.+payoff/i);
  assert.match(corpus, /4,000 characters/i);
});

test('the manual music handoff has a concrete provider-neutral document template', () => {
  const template = read('agent/templates/music-prompt-document.md');
  assert.match(template, /PASTE THIS INTO THE MUSIC GENERATOR/);
  assert.match(template, /Motion cue reference.+do not paste/i);
  assert.match(template, /\{\{durationSeconds\}\}/);
  assert.match(template, /\{\{style\}\}/);
  assert.match(template, /\{\{cueStructure\}\}/);
  assert.match(template, /instrumental/i);
  assert.match(template, /4,000 characters/i);
  assert.match(template, /future deterministic.+not implemented/i);
  assert.doesNotMatch(template, /https?:\/\//i);
});

test('operator templates cover fast, structured, local-source and locked-revision inputs', () => {
  const brief = read('projects/_template/BRIEF_INPUT.md');
  const sources = read('projects/_template/LOCAL_SOURCES.md');
  const revision = read('projects/_template/REVISION_REQUEST.md');
  const examples = read('examples/invocations.md');
  assert.match(brief, /Fast input/i);
  assert.match(brief, /Structured brief/i);
  assert.match(brief, /verified fact/i);
  assert.match(sources, /local path/i);
  assert.match(sources, /rights|license/i);
  assert.match(revision, /lock/i);
  assert.match(revision, /other.+unchanged/i);
  assert.match(examples, /Codex/i);
  assert.match(examples, /Claude Code/i);
  assert.match(examples, /revision/i);
  assert.match(read('docs/PROMPT_OS_MAP.md'), /Orchestrator.+Agent.+Skill/is);
});

test('the Prompt OS contains no credential, model-call, generated-video or platform workflow', () => {
  const paths = expectedFiles.filter((path) => /\.(?:md|json)$/.test(path) && existsSync(file(path)));
  const corpus = paths.map((path) => read(path)).join('\n');
  assert.doesNotMatch(corpus, /OPENAI_API_KEY|ANTHROPIC_API_KEY|publicLicenseKey|licenseKey|apiKey/);
  assert.doesNotMatch(corpus, /call (?:an?|the) (?:LLM|model|music|video) API/i);
  assert.doesNotMatch(corpus, /score[- ]first|music first|cut to music first/i);
  assert.doesNotMatch(corpus, /Next\.js|PostgreSQL|Redis|S3 bucket|worker queue/i);
});

test('all manifest file references resolve inside the repository', () => {
  const promptManifest = JSON.parse(read('agent/prompt-manifest.json'));
  const skillManifest = JSON.parse(read('craft/skill-manifest.json'));
  const referenced = [
    ...promptManifest.contracts,
    ...promptManifest.roles.map((role) => role.file),
    ...skillManifest.skills.map((skill) => skill.file),
  ];
  const invalid = referenced.filter((path) => path.startsWith('/') || path.includes('..'));
  const missing = referenced.filter((path) => !existsSync(file(path)));
  assert.deepEqual(invalid, [], `Manifest paths escape repository: ${invalid.join(', ')}`);
  assert.deepEqual(missing, [], `Manifest paths do not resolve: ${missing.join(', ')}`);
  assert.equal(new Set(referenced).size, referenced.length, 'Manifest contains duplicate prompt paths');
});

test('Part 1 status does not pretend the deferred engine exists', () => {
  const status = read('docs/PART1_STATUS.md');
  assert.match(status, /Prompt OS.+complete/i);
  assert.match(status, /Engine.+not implemented/i);
  assert.match(status, /Do not claim.+render/i);
  assert.doesNotMatch(status, /Engine.+complete/i);
});

test('test paths are reported relative to the repo for readable failures', () => {
  assert.equal(relative(root, file('agent/video-workflow.md')), 'agent/video-workflow.md');
});
