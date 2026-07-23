import {coreCapabilityManifest} from '../../generated/core-capability-manifest.js';

/** Look up a core capability's generated implementation hash by id@version. */
export function coreImplementationHash(id: string, version: string): string {
  const entry = coreCapabilityManifest.find((e) => e.id === id && e.version === version);
  if (!entry) {
    throw new Error(`CORE_CAPABILITY_HASH_MISSING: ${id}@${version} — run pnpm capabilities:manifest`);
  }
  return entry.implementationHash;
}
