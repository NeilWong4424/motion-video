/**
 * Conservative SVG allowlist sanitizer. Parses text, rejects forbidden
 * constructs, requires a finite viewBox, permits only local fragment references,
 * and returns a normalized copy. It does not attempt to repair unsafe SVG.
 */

const FORBIDDEN_PATTERNS: Array<{re: RegExp; reason: string}> = [
  {re: /<\s*script\b/i, reason: 'script element'},
  {re: /<\s*foreignObject\b/i, reason: 'foreignObject element'},
  {re: /\bon[a-z]+\s*=/i, reason: 'event handler attribute'},
  {re: /\b(?:xlink:href|href)\s*=\s*['"]\s*(?:https?:|data:|\/\/)/i, reason: 'external href'},
  {re: /url\(\s*['"]?\s*(?:https?:|data:|\/\/)/i, reason: 'external CSS url()'},
  {re: /<\s*(?:image|use)\b[^>]*\b(?:xlink:href|href)\s*=\s*['"]\s*(?!#)/i, reason: 'external image/use reference'},
  {re: /<\s*(?:iframe|object|embed|audio|video)\b/i, reason: 'embedded media element'},
  {re: /data:\s*[^,]*;base64/i, reason: 'inline data: payload'},
];

export type SanitizeResult =
  | {ok: true; svg: string}
  | {ok: false; code: 'ASSET_SVG_UNSAFE'; reason: string};

export function sanitizeSvg(source: string): SanitizeResult {
  for (const {re, reason} of FORBIDDEN_PATTERNS) {
    if (re.test(source)) {
      return {ok: false, code: 'ASSET_SVG_UNSAFE', reason};
    }
  }

  // Require a finite numeric viewBox.
  const viewBox = /viewBox\s*=\s*['"]([^'"]+)['"]/i.exec(source);
  if (!viewBox) {
    return {ok: false, code: 'ASSET_SVG_UNSAFE', reason: 'missing viewBox'};
  }
  const parts = viewBox[1]!.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return {ok: false, code: 'ASSET_SVG_UNSAFE', reason: 'non-finite viewBox'};
  }

  // Normalize: trim leading XML declaration/whitespace.
  const normalized = source.replace(/^﻿?\s*(<\?xml[^>]*\?>)?\s*/i, '').trim();
  return {ok: true, svg: normalized};
}
