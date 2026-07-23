import {lstatSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {sep} from 'node:path';

import sharp from 'sharp';

import {sha256Hex} from '../hash.js';
import {sanitizeSvg} from './sanitize-svg.js';

const MAX_BYTES = 20 * 1024 * 1024;

export type LicenseStatus = 'user-owned' | 'licensed' | 'open-license' | 'unknown';

export type AssetRecord = {
  assetId: string;
  relativePath: string;
  mime: string;
  width: number;
  height: number;
  sha256: string;
  sourceDeclaration: string;
  licenseStatus: LicenseStatus;
};

export type AssetInput = {
  assetId: string;
  absolutePath: string;
  projectAssetRoot: string;
  relativePath: string;
  sourceDeclaration: string;
  licenseStatus: LicenseStatus;
};

export type AssetResult =
  | {ok: true; record: AssetRecord; sanitizedSvg?: string}
  | {ok: false; code: string; reason: string};

function sniffMime(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  const head = bytes.subarray(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<svg') || head.startsWith('<?xml')) {
    return 'image/svg+xml';
  }
  return null;
}

/**
 * Accept a local raster or sanitized SVG asset. Rejects URLs, symlinks,
 * realpath escapes, oversize files and unsafe SVG. Never exposes the caller's
 * absolute path to any derived record.
 */
export async function ingestAsset(input: AssetInput): Promise<AssetResult> {
  if (/^[a-z][a-z0-9+.-]*:/i.test(input.relativePath) || /^[a-z][a-z0-9+.-]*:/i.test(input.sourceDeclaration)) {
    return {ok: false, code: 'ASSET_URL_FORBIDDEN', reason: 'url-like input'};
  }

  // Reject symlinks and realpath escape from the project asset root.
  let realPath: string;
  let realRoot: string;
  try {
    if (lstatSync(input.absolutePath).isSymbolicLink()) {
      return {ok: false, code: 'ASSET_SYMLINK_FORBIDDEN', reason: 'symlink source'};
    }
    realPath = realpathSync(input.absolutePath);
    realRoot = realpathSync(input.projectAssetRoot);
  } catch {
    return {ok: false, code: 'ASSET_NOT_FOUND', reason: 'missing source'};
  }
  if (!realPath.startsWith(`${realRoot}${sep}`)) {
    return {ok: false, code: 'ASSET_PATH_ESCAPE', reason: 'outside project asset root'};
  }

  const size = statSync(realPath).size;
  if (size > MAX_BYTES) {
    return {ok: false, code: 'ASSET_TOO_LARGE', reason: `${size} > ${MAX_BYTES}`};
  }

  const bytes = readFileSync(realPath);
  const mime = sniffMime(bytes);
  if (!mime) {
    return {ok: false, code: 'ASSET_MIME_UNSUPPORTED', reason: 'unknown mime'};
  }

  let width: number;
  let height: number;
  let sanitizedSvg: string | undefined;

  if (mime === 'image/svg+xml') {
    const result = sanitizeSvg(bytes.toString('utf8'));
    if (!result.ok) {
      return {ok: false, code: result.code, reason: result.reason};
    }
    sanitizedSvg = result.svg;
    const vb = /viewBox\s*=\s*['"]([^'"]+)['"]/i.exec(result.svg)![1]!.trim().split(/[\s,]+/).map(Number);
    width = Math.round(vb[2]!);
    height = Math.round(vb[3]!);
  } else {
    const meta = await sharp(bytes).metadata();
    if (!meta.width || !meta.height) {
      return {ok: false, code: 'ASSET_METADATA_INVALID', reason: 'no dimensions'};
    }
    width = meta.width;
    height = meta.height;
  }

  const sha256 = sha256Hex(sanitizedSvg ? Buffer.from(sanitizedSvg, 'utf8') : bytes);

  const record: AssetRecord = {
    assetId: input.assetId,
    relativePath: input.relativePath,
    mime,
    width,
    height,
    sha256,
    sourceDeclaration: input.sourceDeclaration,
    licenseStatus: input.licenseStatus,
  };

  return sanitizedSvg ? {ok: true, record, sanitizedSvg} : {ok: true, record};
}
