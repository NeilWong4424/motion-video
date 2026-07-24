/**
 * Catalog registry snapshot + source validation (Part 1 governance).
 *
 * - catalog-registry-snapshot: validate the checked-in core registry and expose its
 *   external registrySnapshotHash (core disposition; descendants are a later slice).
 * - canonical-source-hashing-and-validation: the VALIDATE-stage cross-artifact check
 *   (initial-source-set disposition → SNAPSHOT; other dispositions are later slices).
 */

export {
  snapshotCoreRegistry,
  CORE_CAPABILITY_IDS,
  CORE_REGISTRY_PATH,
  type SnapshotResult,
} from './catalog-registry-snapshot.js';

export {
  validateInitialSourceSet,
  type InitialSourceSet,
  type ValidationReceipt,
  type ValidationResult,
  type ValidationDisposition,
} from './source-validation.js';
