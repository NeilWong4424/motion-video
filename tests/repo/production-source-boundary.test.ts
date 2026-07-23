import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterAll, beforeAll, describe, expect, it} from 'vitest';

import {scanProductionSource} from '../../src/engine/boundary/scan-production-source.js';
import type {BoundaryDiagnosticCode} from '../../src/engine/boundary/production-source-policy.js';

let baseDir: string;

function write(relPath: string, content: string): void {
  const abs = join(baseDir, relPath);
  mkdirSync(join(abs, '..'), {recursive: true});
  writeFileSync(abs, content, 'utf8');
}

function scanFile(relPath: string): BoundaryDiagnosticCode[] {
  return scanProductionSource({kind: 'files', baseDir, files: [relPath]}).map((d) => d.code);
}

beforeAll(() => {
  baseDir = mkdtempSync(join(tmpdir(), 'boundary-scan-'));
});

afterAll(() => {
  rmSync(baseDir, {recursive: true, force: true});
});

describe('production-source boundary scanner', () => {
  it('rejects a bare fetch call', () => {
    write('a/net.ts', 'export const go = async () => fetch("https://x.example/v");');
    const codes = scanFile('a/net.ts');
    expect(codes).toContain('BOUNDARY_NETWORK_CALL');
    expect(codes).toContain('BOUNDARY_REMOTE_RESOURCE');
  });

  it('rejects process.env access', () => {
    write('a/env.ts', 'export const k = process.env.SECRET_KEY;');
    expect(scanFile('a/env.ts')).toContain('BOUNDARY_PROCESS_ENV');
  });

  it('rejects Date.now and Math.random', () => {
    write('a/time.ts', 'export const t = Date.now();\nexport const r = Math.random();');
    const codes = scanFile('a/time.ts');
    expect(codes).toContain('BOUNDARY_NONDETERMINISTIC_TIME');
    expect(codes).toContain('BOUNDARY_NONDETERMINISTIC_RANDOM');
  });

  it('rejects a remote-resource JSX image and Remotion Video', () => {
    write(
      'a/media.tsx',
      'export const X = () => <div><img src="https://cdn.example/a.png" /><Video src="x" /></div>;',
    );
    const codes = scanFile('a/media.tsx');
    expect(codes).toContain('BOUNDARY_REMOTE_RESOURCE');
    expect(codes).toContain('BOUNDARY_REMOTION_VIDEO');
  });

  it('rejects a model/media SDK import and a node network module', () => {
    write('a/sdk.ts', 'import OpenAI from "openai";\nimport {request} from "node:https";');
    const codes = scanFile('a/sdk.ts');
    expect(codes).toContain('BOUNDARY_MODEL_MEDIA_SDK');
    expect(codes).toContain('BOUNDARY_NODE_NETWORK_MODULE');
  });

  it('rejects a forbidden subprocess but allows ffmpeg', () => {
    write('a/proc.ts', 'import {spawn} from "node:child_process";\nspawn("curl", ["-O", "x"]);');
    expect(scanFile('a/proc.ts')).toContain('BOUNDARY_FORBIDDEN_SUBPROCESS');

    write('a/ff.ts', 'import {spawn} from "node:child_process";\nspawn("ffmpeg", ["-i", "in.mp4"]);');
    expect(scanFile('a/ff.ts')).not.toContain('BOUNDARY_FORBIDDEN_SUBPROCESS');
  });

  it('rejects a video-file import', () => {
    write('a/vid.ts', 'import clip from "./intro.mp4";');
    expect(scanFile('a/vid.ts')).toContain('BOUNDARY_VIDEO_IMPORT');
  });

  it('rejects a credential placeholder in documentation, allows negative prose', () => {
    write('a/setup.md', 'Set api_key = "sk-your-real-key-here" before running.');
    expect(scanFile('a/setup.md')).toContain('BOUNDARY_CREDENTIAL_IDENTIFIER');

    write('a/readme.md', 'This repository uses no API key and no credential layer.');
    expect(scanFile('a/readme.md')).toEqual([]);
  });

  it('allows a validated local base-image asset reference', () => {
    write(
      'a/ok.tsx',
      'import {staticFile} from "remotion";\nexport const X = () => <img src={staticFile("generated-assets/abc/logo.png")} />;',
    );
    expect(scanFile('a/ok.tsx')).toEqual([]);
  });

  it('reports the real repository source as clean under production roots', () => {
    // Sanity: scanning the checked-in engine source must produce zero findings.
    const codes = scanProductionSource({
      kind: 'roots',
      baseDir: join(import.meta.dirname, '..', '..'),
      roots: ['src', 'scripts'],
    }).map((d) => d.code);
    expect(codes).toEqual([]);
  });
});
