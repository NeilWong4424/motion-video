import type {PersistentNode} from '../../src/contracts/motion-spec.js';
import type {LayoutContext, LayoutService, ResolvedNodeLayout} from '../../src/engine/resolver/types.js';

/**
 * A deterministic layout service returning explicit fixture rectangles derived
 * from each node's first geometry keyframe. This is test-only and never exported
 * by production code; it cannot become a runtime fallback.
 */
export class FakeLayoutService implements LayoutService {
  resolveNode(node: PersistentNode, _context: LayoutContext): ResolvedNodeLayout {
    const geo = node.geometryTrack[0]?.value as
      | {x?: number; y?: number; width?: number; height?: number}
      | undefined;
    return {
      x: geo?.x ?? 0,
      y: geo?.y ?? 0,
      width: geo?.width ?? 200,
      height: geo?.height ?? 80,
    };
  }
}
