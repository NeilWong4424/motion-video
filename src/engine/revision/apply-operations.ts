import type {PatchOperation} from '../../contracts/revision.js';
import type {BriefSpec} from '../../contracts/brief.js';
import type {TreatmentSpec} from '../../contracts/treatment.js';
import type {MotionSpec} from '../../contracts/motion-spec.js';

export type SourceSet = {brief: BriefSpec; treatment: TreatmentSpec; motion: MotionSpec};

/**
 * Apply one patch operation to a source set, returning a new source set. Only
 * bounded operations mutate in place; whole-artifact replacements swap the
 * payload. Unknown targets throw so the caller can reject the patch.
 */
export function applyOperation(source: SourceSet, op: PatchOperation): SourceSet {
  const next: SourceSet = {
    brief: structuredClone(source.brief),
    treatment: structuredClone(source.treatment),
    motion: structuredClone(source.motion),
  };

  switch (op.op) {
    case 'replace-copy': {
      const node = next.motion.world.nodes.find((n) => n.id === op.nodeId);
      if (!node) throw new Error(`PATCH_NODE_MISSING: ${op.nodeId}`);
      const props = (node.renderer.props ?? {}) as {text?: string};
      node.renderer = {...node.renderer, props: {...props, text: op.value}};
      break;
    }
    case 'retime-beat': {
      const beat = next.motion.timeline.beats.find((b) => b.id === op.beatId);
      if (!beat) throw new Error(`PATCH_BEAT_MISSING: ${op.beatId}`);
      beat.durationFrames = op.durationFrames;
      break;
    }
    case 'retime-bridge': {
      const bridge = next.motion.timeline.bridges.find((b) => b.id === op.bridgeId);
      if (!bridge) throw new Error(`PATCH_BRIDGE_MISSING: ${op.bridgeId}`);
      if (bridge.mode === 'chapter-cut') {
        if (op.durationFrames !== 0) throw new Error('PATCH_CHAPTER_CUT_NONZERO');
      } else {
        bridge.durationFrames = op.durationFrames;
      }
      break;
    }
    case 'swap-renderer': {
      const node = next.motion.world.nodes.find((n) => n.id === op.nodeId);
      if (!node) throw new Error(`PATCH_NODE_MISSING: ${op.nodeId}`);
      node.renderer = {id: op.rendererId, version: op.version, props: op.props};
      break;
    }
    case 'replace-brief':
      next.brief = op.value;
      break;
    case 'replace-treatment':
      next.treatment = op.value;
      break;
    case 'replace-motion-spec':
      next.motion = op.value;
      break;
    case 'set-token':
    case 'set-node-state':
    case 'set-effects':
    case 'set-continuity-bridge':
    case 'set-lock':
    case 'remove-lock':
      // Token/state/effect/bridge/lock operations are recorded in the patch and
      // validated against locks/impact, but do not mutate the three canonical
      // payloads here (tokens live in style packs; locks live in the revision
      // manifest). They are applied by their dedicated owners.
      break;
  }

  return next;
}

export function applyOperations(source: SourceSet, ops: readonly PatchOperation[]): SourceSet {
  return ops.reduce((acc, op) => applyOperation(acc, op), source);
}
