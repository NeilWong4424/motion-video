import type {MotionSpec} from '../../contracts/motion-spec.js';
import {errorDiagnostic, warningDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

/**
 * Validate camera intent: one main-camera track, moves use a valid verb,
 * non-linear easing and a non-empty reveals statement; reject teleports and
 * multi-verb moves; warn when a film never holds.
 */
export function validateCameraIntent(spec: MotionSpec): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const segments = spec.camera.segments;

  if (spec.camera.id !== 'main-camera') {
    diagnostics.push(errorDiagnostic('CAMERA_TRACK_MISSING'));
  }

  let holdCount = 0;
  let moveCount = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg.mode === 'hold') {
      holdCount++;
      continue;
    }
    moveCount++;
    if (seg.easing.toLowerCase() === 'linear') {
      diagnostics.push(errorDiagnostic('CAMERA_LINEAR_EASING', {evidence: seg.id}));
    }
    if (!seg.reveals || seg.reveals.trim().length === 0) {
      diagnostics.push(errorDiagnostic('CAMERA_REVEALS_MISSING', {evidence: seg.id}));
    }

    // Multi-verb detection: a move whose from/to changes position AND zoom AND
    // rotation simultaneously but declares a single primary verb.
    const dx = Math.abs(seg.to.x - seg.from.x);
    const dy = Math.abs(seg.to.y - seg.from.y);
    const dZoom = Math.abs(seg.to.zoom - seg.from.zoom);
    const dRot = Math.abs((seg.to.rotationDeg ?? 0) - (seg.from.rotationDeg ?? 0));
    const bigPan = dx > 1 || dy > 1;
    const bigZoom = dZoom > 0.01;
    const bigRot = dRot > 0.5;
    const verbCount = [bigPan, bigZoom, bigRot].filter(Boolean).length;
    if (verbCount >= 3) {
      diagnostics.push(errorDiagnostic('CAMERA_MULTI_VERB', {evidence: seg.id}));
    }

    // Teleport: discontinuity between this move's end and the next segment's start.
    const next = segments[i + 1];
    if (next) {
      const nextStart = next.mode === 'hold' ? next.state : next.from;
      const jump =
        Math.abs(nextStart.x - seg.to.x) +
        Math.abs(nextStart.y - seg.to.y) +
        Math.abs(nextStart.zoom - seg.to.zoom) * 1000;
      if (jump > 1) {
        diagnostics.push(errorDiagnostic('CAMERA_TELEPORT', {evidence: `${seg.id}->${next.id}`}));
      }
    }
  }

  if (moveCount > 0 && holdCount === 0) {
    diagnostics.push(warningDiagnostic('CAMERA_ALWAYS_MOVING'));
  }

  return diagnostics;
}
