import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {BriefSpecSchema, type BriefSpec} from '../../contracts/brief.js';
import {TreatmentSpecSchema, type TreatmentSpec} from '../../contracts/treatment.js';
import {MotionSpecSchema, type MotionSpec} from '../../contracts/motion-spec.js';
import {ProjectFileSchema, type ProjectFile} from '../../contracts/manifest.js';
import type {ProjectPaths} from './paths.js';

export type SourceArtifacts = {
  project: ProjectFile;
  brief: BriefSpec;
  treatment: TreatmentSpec;
  motion: MotionSpec;
};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export async function loadProjectFile(paths: ProjectPaths): Promise<ProjectFile> {
  return ProjectFileSchema.parse(readJson(join(paths.source, 'project.json')));
}

/** Load and strictly validate the editable source artifacts. */
export async function loadSourceArtifacts(paths: ProjectPaths): Promise<SourceArtifacts> {
  const project = ProjectFileSchema.parse(readJson(join(paths.source, 'project.json')));
  const brief = BriefSpecSchema.parse(readJson(join(paths.source, 'brief.spec.json')));
  const treatment = TreatmentSpecSchema.parse(readJson(join(paths.source, 'treatment.json')));
  const motion = MotionSpecSchema.parse(readJson(join(paths.source, 'motion.spec.json')));
  return {project, brief, treatment, motion};
}
