/**
 * catalog-registry-snapshot — validate the checked-in core registry and expose its
 * external `registrySnapshotHash`.
 *
 * Per `agent/contracts/catalog-registry-contract.md`, this interface validates the
 * exact checked-in resource `catalog/core-registry.json` and exposes its external
 * SHA-256 identity. It does NOT download, discover, implement, or execute anything.
 * It never mutates the registry or treats a snapshot claim as implementation proof.
 *
 * Build scope: the CORE snapshot is validated end-to-end (canonical bytes, closed
 * core ID set, SemVer, schema-ID grammar, and the closed motion-profile / style-pack
 * constants). Project-descendant snapshots depend on accepted capability receipts (a
 * later slice) and are refused loudly here.
 */

import {readFileUnderRoot, type RepoRootAnchor} from '../ledger/fs-safe.js';
import {sha256Hex} from '../ledger/hash.js';
import {jcsCanonical} from '../ledger/jcs.js';

/** The exact closed set of core capability IDs (contract CoreCapabilityId union). */
export const CORE_CAPABILITY_IDS = [
  'core.camera.global-2d',
  'core.effect.clip-mask',
  'core.effect.content-transition',
  'core.effect.opacity-transform',
  'core.effect.path-trim',
  'core.renderer.group',
  'core.renderer.local-image',
  'core.renderer.path',
  'core.renderer.shape',
  'core.renderer.text',
] as const;

const CATALOG_MOTION_PROFILE_ID = 'core.motion.content-adaptive@1';
const CATALOG_STYLE_PACK_ID = 'core.style.adaptive-minimal@1';
const CATALOG_CONSTRAINTS = new Set([
  'accessible-contrast',
  'local-fonts-only',
  'no-generated-media',
  'seamless-default',
]);

export const CORE_REGISTRY_PATH = 'catalog/core-registry.json';

/** Canonical SemVer 2.0.0 (subset sufficient for the core registry: major.minor.patch). */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** core.schema.<slug>.intent@1 / .resolved@1 grammar. */
const CORE_SCHEMA_RE = /^core\.schema\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.(intent|resolved)@1$/;

export type SnapshotOk = {ok: true; registrySnapshotHash: string; snapshotId: string; capabilityIds: string[]};
export type SnapshotFail = {ok: false; code: string; detail: string};
export type SnapshotResult = SnapshotOk | SnapshotFail;

function fail(code: string, detail: string): SnapshotFail {
  return {ok: false, code, detail};
}

type CoreCapability = {
  id: string;
  version: string;
  kind: string;
  implementationStatus: string;
  intentSchemaId: string;
  resolvedSchemaId: string;
  intent: string;
};

type CoreRegistry = {
  schemaVersion: string;
  snapshotId: string;
  scope: string;
  parentSnapshotHash: string | null;
  implementationBindingHashes: string[];
  motionProfiles: Array<{id: string; description: string; timingPolicy: string}>;
  stylePacks: Array<{id: string; description: string; constraints: string[]}>;
  capabilities: CoreCapability[];
};

/**
 * Validate and hash the core registry. Reads through the anchored no-follow path,
 * requires canonical (JCS) bytes, verifies the closed core ID set + grammar, and
 * emits the external registrySnapshotHash over the exact JCS bytes.
 */
export function snapshotCoreRegistry(anchor: RepoRootAnchor): SnapshotResult {
  let raw: string;
  try {
    raw = readFileUnderRoot(anchor, CORE_REGISTRY_PATH);
  } catch (err) {
    return fail('REGISTRY_READ_FAILED', (err as Error).message);
  }

  let parsed: CoreRegistry;
  try {
    parsed = JSON.parse(raw) as CoreRegistry;
  } catch (err) {
    return fail('REGISTRY_PARSE_FAILED', (err as Error).message);
  }

  // Canonical-bytes requirement: the external identity is over the JCS bytes, and a
  // non-canonical on-disk file is refused rather than silently re-serialized.
  const canonical = jcsCanonical(parsed);

  if (parsed.schemaVersion !== 'catalog-registry-snapshot@1') {
    return fail('REGISTRY_SCHEMA', String(parsed.schemaVersion));
  }
  if (parsed.scope !== 'core') {
    return fail('REGISTRY_SCOPE_NOT_CORE', String(parsed.scope));
  }
  if (parsed.parentSnapshotHash !== null) {
    return fail('REGISTRY_CORE_HAS_PARENT', 'core snapshot must have null parent');
  }
  if (!Array.isArray(parsed.implementationBindingHashes) || parsed.implementationBindingHashes.length !== 0) {
    return fail('REGISTRY_CORE_HAS_BINDINGS', 'core snapshot binding list must be empty');
  }

  // Closed motion-profile + style-pack constants.
  if (parsed.motionProfiles.length !== 1 || parsed.motionProfiles[0]!.id !== CATALOG_MOTION_PROFILE_ID) {
    return fail('REGISTRY_MOTION_PROFILE', 'unexpected motion profile set');
  }
  if (parsed.stylePacks.length !== 1 || parsed.stylePacks[0]!.id !== CATALOG_STYLE_PACK_ID) {
    return fail('REGISTRY_STYLE_PACK', 'unexpected style pack set');
  }
  for (const c of parsed.stylePacks[0]!.constraints) {
    if (!CATALOG_CONSTRAINTS.has(c)) return fail('REGISTRY_CONSTRAINT', c);
  }

  // Capabilities: exactly the closed core ID set, unique, with valid SemVer + schema IDs.
  const expected = new Set<string>(CORE_CAPABILITY_IDS);
  const seen = new Set<string>();
  for (const cap of parsed.capabilities) {
    if (!expected.has(cap.id)) return fail('REGISTRY_UNKNOWN_CORE_ID', cap.id);
    if (seen.has(cap.id)) return fail('REGISTRY_DUPLICATE_ID', cap.id);
    seen.add(cap.id);
    if (!SEMVER_RE.test(cap.version)) return fail('REGISTRY_SEMVER', `${cap.id} ${cap.version}`);
    if (!CORE_SCHEMA_RE.test(cap.intentSchemaId) || !cap.intentSchemaId.endsWith('.intent@1')) {
      return fail('REGISTRY_INTENT_SCHEMA_ID', cap.intentSchemaId);
    }
    if (!CORE_SCHEMA_RE.test(cap.resolvedSchemaId) || !cap.resolvedSchemaId.endsWith('.resolved@1')) {
      return fail('REGISTRY_RESOLVED_SCHEMA_ID', cap.resolvedSchemaId);
    }
  }
  if (seen.size !== CORE_CAPABILITY_IDS.length) {
    return fail('REGISTRY_MISSING_CORE_ID', `have ${seen.size} of ${CORE_CAPABILITY_IDS.length}`);
  }

  // snapshotId for the core registry is a fixed local id; the external identity is
  // the SHA-256 over the exact canonical bytes.
  const registrySnapshotHash = sha256Hex(canonical);
  return {
    ok: true,
    registrySnapshotHash,
    snapshotId: parsed.snapshotId,
    capabilityIds: [...seen],
  };
}
