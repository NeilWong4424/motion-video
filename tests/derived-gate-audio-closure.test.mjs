import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const typeBlock = (text, name) => {
  const match = text.match(new RegExp(`type ${name}\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
  assert.ok(match, `missing closed ${name} type`);
  return match[0];
};

test('evidence and QC profiles close every required member and check before pass', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const renderPlan = typeBlock(artifacts, 'RenderPlan');
  const evidenceProfile = typeBlock(artifacts, 'EvidenceProfile');
  const frameScan = typeBlock(artifacts, 'FrameScanArtifact');
  const qcProfile = typeBlock(artifacts, 'TechnicalQCProfile');
  const qcCheck = typeBlock(artifacts, 'TechnicalQCCheckResult');
  const evidenceManifest = typeBlock(artifacts, 'SampledEvidenceManifest');
  const qcReport = typeBlock(artifacts, 'TechnicalQCReport');

  assert.match(artifacts, /type EvidenceRequirement\s*=/);
  assert.match(artifacts, /type EvidenceProfile\s*=/);
  assert.match(artifacts, /type TechnicalQCCheckId\s*=/);
  assert.match(artifacts, /type TechnicalQCProfile\s*=/);
  assert.match(renderPlan, /evidenceProfile:\s*EvidenceProfile/);
  assert.match(renderPlan, /evidenceProfileHash:\s*string/);
  assert.match(renderPlan, /technicalQcProfile:\s*TechnicalQCProfile/);
  assert.match(renderPlan, /technicalQcProfileHash:\s*string/);
  assert.match(evidenceProfile, /requirements:\s*\[EvidenceRequirement,\s*\.\.\.EvidenceRequirement\[\]\]/);
  assert.match(frameScan, /scannerId:\s*"rgba8-bt709-frame-scan-v1"/);
  assert.match(frameScan, /samples:\s*\[FrameScanSample,\s*\.\.\.FrameScanSample\[\]\]/);
  assert.match(artifacts, /luma8\s*=\s*floor\(\(54 \* R \+ 183 \* G \+ 19 \* B\) \/ 256\)/);
  for (const checkId of [
    'profile-binding-integrity',
    'preview-media-profile',
    'evidence-manifest-bijection',
    'evidence-byte-integrity',
    'whole-film-frame-integrity',
    'bridge-range-scan-coverage',
    'text-layout-and-glyph-integrity',
    'deterministic-replay',
  ]) {
    assert.match(qcProfile, new RegExp('"' + checkId + '"'));
  }
  assert.match(qcCheck, /checkId:\s*TechnicalQCCheckId/);
  assert.match(qcCheck, /result:\s*"pass"/);
  assert.match(qcCheck, /evidenceIds:\s*\[SafeAuditLabel,\s*\.\.\.SafeAuditLabel\[\]\]/);
  assert.match(evidenceManifest, /evidenceProfileHash:\s*string/);
  assert.match(evidenceManifest, /technicalQcProfileHash:\s*string/);
  assert.match(qcReport, /evidenceProfileHash:\s*string/);
  assert.match(qcReport, /technicalQcProfileHash:\s*string/);
  assert.match(qcReport, /checks:\s*\[TechnicalQCCheckResult,\s*\.\.\.TechnicalQCCheckResult\[\]\]/);
  assert.doesNotMatch(qcReport, /checks:\s*Array/);
  assert.match(artifacts, /evidenceProfileHash[^\n]+SHA-256|SHA-256[^\n]+evidenceProfileHash/i);
  assert.match(artifacts, /technicalQcProfileHash[^\n]+SHA-256|SHA-256[^\n]+technicalQcProfileHash/i);
  assert.match(artifacts, /checkedMemberHashes[\s\S]+same non-empty length and order/i);
  assert.match(
    artifacts,
    /members[\s\S]+exact ordered bijection[\s\S]+requirements[\s\S]+no missing, extra, duplicate, or reordered/i,
  );
  assert.match(
    artifacts,
    /checks[\s\S]+exact ordered bijection[\s\S]+requiredCheckIds[\s\S]+no missing, extra, duplicate, or reordered/i,
  );
});

test('renderer build identity hashes the exact engine, capability, dependency, and profile bytes', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const manifest = JSON.parse(read('agent/prompt-manifest.json'));
  const buildManifest = typeBlock(artifacts, 'RendererBuildManifest');
  const renderPlan = typeBlock(artifacts, 'RenderPlan');
  const evidenceManifest = typeBlock(artifacts, 'SampledEvidenceManifest');
  const qcReport = typeBlock(artifacts, 'TechnicalQCReport');
  const approvalTuple = typeBlock(artifacts, 'ApprovalTuple');
  const renderManifest = typeBlock(artifacts, 'RenderManifestArtifact');

  for (const purpose of ['engine-runtime', 'core-capability', 'dependency-lock', 'render-profile']) {
    assert.match(artifacts, new RegExp('"' + purpose + '"'));
  }
  assert.doesNotMatch(buildManifest, /rendererBuildHash:/);
  for (const block of [renderPlan, evidenceManifest, qcReport, approvalTuple, renderManifest]) {
    assert.match(block, /rendererBuildHash:\s*string/);
    assert.match(block, /renderProfileHash:\s*string/);
  }
  assert.equal((renderPlan.match(/projectId:/g) ?? []).length, 1);
  assert.match(artifacts, /rendererBuildHash[^\n]+SHA-256|SHA-256[^\n]+rendererBuildHash/i);
  assert.match(artifacts, /exact transitive[\s\S]+byte[\s\S]+closure/i);
  assert.match(artifacts, /rendererBuildId[\s\S]+label[\s\S]+not[\s\S]+identity/i);

  const compilerWrites = manifest.interfaces.find(({id}) => id === 'resolver-compiler').writes;
  assert.ok(
    compilerWrites.some((path) => path.includes('/renderer/<renderer-build-hash>/renderer-build-manifest.json')),
  );
});

test('PreviewApproval extends one exact complete ApprovalTuple', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const approvalTuple = typeBlock(artifacts, 'ApprovalTuple');

  assert.match(approvalTuple, /technicalQcDecision:\s*"pass"/);
  assert.match(approvalTuple, /evidenceProfileHash:\s*string/);
  assert.match(approvalTuple, /technicalQcProfileHash:\s*string/);
  assert.match(approvalTuple, /actor:\s*\{type:\s*"human"/);
  assert.match(approvalTuple, /reason:\s*DurableInstructionText/);
  assert.match(
    artifacts,
    /type PreviewApproval\s*=\s*ApprovalTuple\s*&\s*\{[\s\S]*schemaVersion:\s*"preview-approval@1"/,
  );
  assert.doesNotMatch(artifacts, /actorType, actorId/);
});

test('mux identity derives its path after hashing and proves picture stream equality', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const muxManifest = typeBlock(artifacts, 'MuxManifest');
  const renderManifest = typeBlock(artifacts, 'RenderManifestArtifact');
  const pictureProbe = typeBlock(artifacts, 'PictureStreamProbe');

  assert.match(artifacts, /type PictureStreamProbe\s*=/);
  assert.match(artifacts, /type PicturePresentationMetadata\s*=/);
  assert.match(artifacts, /sha256-iso-bmff-h264-sample-table-v1/);
  assert.match(artifacts, /orderedSampleTableHash/);
  assert.match(artifacts, /pictureStreamFingerprint/);
  assert.match(renderManifest, /pictureProbe:\s*PictureStreamProbe/);
  for (const field of [
    'trackTimescale',
    'trackDurationTicks',
    'codecConfigurationHash',
    'presentationMetadata',
    'presentationMetadataHash',
    'sampleCount',
    'orderedSampleTableHash',
    'pictureStreamFingerprint',
  ]) {
    assert.match(pictureProbe, new RegExp(field + ':'));
  }
  assert.match(muxManifest, /sourcePictureProbe:\s*PictureStreamProbe/);
  assert.match(muxManifest, /mixedPictureProbe:\s*PictureStreamProbe/);
  assert.match(muxManifest, /mixedMasterHash:\s*string/);
  assert.doesNotMatch(muxManifest, /mixedMasterPath/);
  assert.match(
    artifacts,
    /compute(?:s|d)? `muxManifestHash`[\s\S]+derive(?:s|d)? the immutable output paths/i,
  );
  assert.match(
    artifacts,
    /sourcePictureProbe[\s\S]+mixedPictureProbe[\s\S]+byte-for-byte equal/i,
  );
  assert.match(artifacts, /pictureStreamFingerprint[^\n]+SHA-256|SHA-256[^\n]+pictureStreamFingerprint/i);
  assert.match(artifacts, /contains no path[\s\S]+container metadata[\s\S]+audio metadata/i);
});

test('silent final proves exact rendered-frame equivalence with the approved preview', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const frameProbe = typeBlock(artifacts, 'RenderedFrameSequenceProbe');
  const evidenceManifest = typeBlock(artifacts, 'SampledEvidenceManifest');
  const renderManifest = typeBlock(artifacts, 'RenderManifestArtifact');

  assert.match(frameProbe, /algorithm:\s*"sha256-rgba8-bt709-frame-sequence-v1"/);
  assert.match(frameProbe, /orderedFrameHashListHash:\s*string/);
  assert.match(frameProbe, /frameSequenceFingerprint:\s*string/);
  assert.match(evidenceManifest, /previewFrameSequenceProbe:\s*RenderedFrameSequenceProbe/);
  assert.match(renderManifest, /previewHash:\s*string/);
  assert.match(renderManifest, /sampledEvidenceManifestHash:\s*string/);
  assert.match(renderManifest, /approvedPreviewFrameSequenceProbe:\s*RenderedFrameSequenceProbe/);
  assert.match(renderManifest, /silentFinalFrameSequenceProbe:\s*RenderedFrameSequenceProbe/);
  assert.match(renderManifest, /pictureEquivalencePolicy:\s*"exact-rendered-rgba-sequence"/);
  assert.match(
    artifacts,
    /approvedPreviewFrameSequenceProbe[\s\S]+silentFinalFrameSequenceProbe[\s\S]+byte-for-byte equal/i,
  );
  assert.match(artifacts, /reloaded PreviewApproval[\s\S]+sampled evidence manifest[\s\S]+preview bytes/i);
});

test('manual audio alignment has finite decimal rounding and full-picture coverage', () => {
  const artifacts = read('agent/contracts/artifact-contracts.md');
  const alignment = typeBlock(artifacts, 'AudioAlignmentManifest');

  for (const field of [
    'visualPayoffFrame',
    'trackPayoffMilliseconds',
    'gainMilliDb',
    'trackSampleRateHz',
    'trackSampleFrames',
    'trackChannels',
  ]) {
    assert.match(alignment, new RegExp(field + ':'));
  }
  assert.match(artifacts, /trackPayoffSeconds[\s\S]+finite[\s\S]+at most three decimal places/i);
  assert.match(artifacts, /gainDb[\s\S]+finite[\s\S]+-60[\s\S]+\+12[\s\S]+at most three decimal places/i);
  assert.match(
    artifacts,
    /declaredPayoffFrame\s*=\s*floor\(\(2 \* trackPayoffMilliseconds \* fps \+ 1000\) \/ 2000\)/,
  );
  assert.match(artifacts, /trackStartFrame\s*=\s*visualPayoffFrame\s*-\s*declaredPayoffFrame/);
  assert.match(artifacts, /trackStartFrame\s*<=\s*0/);
  assert.match(
    artifacts,
    /trackSampleFrames \* fps\s*>=\s*\(durationInFrames - trackStartFrame\) \* trackSampleRateHz/,
  );
  assert.match(artifacts, /no (?:silence )?padding, looping, time-stretching, or resampling/i);
});

test('manual audio and alignment mux decode only inside the central MediaDecodeSandbox', () => {
  const acceptance = read('agent/contracts/artifact-acceptance.md');
  const artifacts = read('agent/contracts/artifact-contracts.md');

  assert.match(acceptance, /type MediaDecodeSandbox/);
  assert.match(artifacts, /manual-audio-ingress[\s\S]+MediaDecodeSandbox/i);
  assert.match(artifacts, /alignment\/mux[\s\S]+MediaDecodeSandbox/i);
  assert.match(artifacts, /same opened (?:file descriptor|FD)/i);
  assert.match(artifacts, /no network[\s\S]+credentials[\s\S]+host filesystem[\s\S]+writable temporary[\s\S]+child process/i);
  assert.match(artifacts, /typed bounded outputs/i);
  assert.match(artifacts, /cannot enforce[\s\S]+refus/i);
});
