export type QcMetric = {
  bridgeId: string;
  mode: 'exact-visual' | 'geometry-only' | 'continuous-motion' | 'chapter-cut-evidence';
  psnrDb?: number;
  maxGeometryDriftPx?: number;
  measuredEyeTraceDistanceNormalized?: number;
};

export type BrightnessEvent = {code: 'SEAM_FLASH'; frame: number; delta: number};

export type CompareResult = {psnrDb: number; maxGeometryDriftPx: number};
