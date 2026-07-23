import type {SemanticLockTarget} from '../../contracts/revision.js';
import {canonicalJson} from '../canonical-json.js';
import type {SourceSet} from './apply-operations.js';

/**
 * Compute the set of changed semantic entities between two source sets, keyed by
 * stable ID so the impact set survives array reordering. Returns lock-target
 * shaped entries for brief/treatment/beat/bridge/node/camera/motion-cue.
 */
export function semanticDiff(before: SourceSet, after: SourceSet): SemanticLockTarget[] {
  const changes: SemanticLockTarget[] = [];

  if (canonicalJson(before.brief) !== canonicalJson(after.brief)) {
    changes.push({entity: 'brief', id: before.brief.projectId});
  }
  if (canonicalJson(before.treatment) !== canonicalJson(after.treatment)) {
    changes.push({entity: 'treatment', id: before.treatment.projectId});
  }

  diffById(before.motion.timeline.beats, after.motion.timeline.beats, 'beat', changes);
  diffById(before.motion.timeline.bridges, after.motion.timeline.bridges, 'bridge', changes);
  diffById(before.motion.world.nodes, after.motion.world.nodes, 'node', changes);
  diffById(before.motion.motionCues, after.motion.motionCues, 'motion-cue', changes);

  // Camera is a single track.
  if (canonicalJson(before.motion.camera) !== canonicalJson(after.motion.camera)) {
    changes.push({entity: 'camera', id: 'main-camera'});
  }

  return changes;
}

function diffById<T extends {id: string}>(
  before: readonly T[],
  after: readonly T[],
  entity: 'beat' | 'bridge' | 'node' | 'motion-cue',
  out: SemanticLockTarget[],
): void {
  const beforeById = new Map(before.map((x) => [x.id, canonicalJson(x)]));
  const afterById = new Map(after.map((x) => [x.id, canonicalJson(x)]));
  const ids = new Set([...beforeById.keys(), ...afterById.keys()]);
  for (const id of ids) {
    if (beforeById.get(id) !== afterById.get(id)) {
      out.push({entity, id});
    }
  }
}

export function targetKey(t: SemanticLockTarget): string {
  return `${t.entity}:${t.id}${t.field ? `:${t.field}` : ''}`;
}
