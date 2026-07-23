import {warningDiagnostic, type Diagnostic} from '../../contracts/diagnostic.js';

export type CameraSample = {frame: number; x: number; y: number; zoom: number};

/**
 * Check camera velocity continuity. A large frame-to-frame acceleration is a
 * jerk/teleport; smooth continuous velocity passes.
 */
export function checkCameraMotion(samples: readonly CameraSample[], maxAccel = 40): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (samples.length < 3) return diagnostics;

  const velocity = (a: CameraSample, b: CameraSample) => ({
    x: b.x - a.x,
    y: b.y - a.y,
    zoom: (b.zoom - a.zoom) * 1000,
  });

  for (let i = 2; i < samples.length; i++) {
    const v1 = velocity(samples[i - 2]!, samples[i - 1]!);
    const v2 = velocity(samples[i - 1]!, samples[i]!);
    const accel = Math.hypot(v2.x - v1.x, v2.y - v1.y, v2.zoom - v1.zoom);
    if (accel > maxAccel) {
      diagnostics.push(
        warningDiagnostic('CAMERA_JERK', {
          frameRange: {from: samples[i - 1]!.frame, to: samples[i]!.frame},
          evidence: `accel ${accel.toFixed(1)} > ${maxAccel}`,
        }),
      );
    }
  }
  return diagnostics;
}
