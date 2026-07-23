# Edit map

How to change this film through the deterministic toolchain:

- Copy: `replace-copy` on the node id.
- Design token: `set-token`.
- Beat/bridge timing: `retime-beat` / `retime-bridge`.
- Node state: `set-node-state` (geometry | style | content | visibility).
- Capability: `swap-renderer` / `set-effects`.
- Continuity bridge: `set-continuity-bridge`.
- Structural add/remove/reorder: a review-linked `rebuild` patch.

Direct file editing is never the rebuild mechanism. Every change goes through a
lock-aware `SemanticPatch` and `motion revise --apply`.
