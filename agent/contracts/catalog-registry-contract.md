# Local catalog and capability-registry contract

This contract closes the cold start that exists before any project-local capability receipt. The repository owns one checked-in, local, provider-free core registry resource at `catalog/core-registry.json`. The future deterministic `catalog-registry-snapshot` interface validates that exact resource and exposes its external `registrySnapshotHash`; it does not download, discover, implement, or execute anything.

Part 1 contains interface declarations only. An entry marked `part2-required` is a planning contract that Part 2 must implement before rendering; its presence never proves runtime code exists.

`DurableSemanticText` is the exact locator-safe semantic-prose alias owned by [`input-trust.md`](input-trust.md); it is referenced here without widening.

## Canonical identifiers and versions

The following opaque aliases mean “a string that has already passed the grammar below”; they are not casts and an arbitrary JavaScript string is not a member:

```ts
type SafeIdSegment = string & {readonly __safeIdSegment: unique symbol};
type SafeProjectId = SafeIdSegment & {readonly __safeProjectId: unique symbol};
type ProjectCapabilityId = string & {readonly __projectCapabilityId: unique symbol};
type CapabilityVersion = string & {readonly __canonicalSemVer: unique symbol};
type CapabilityIntentSchemaId = string & {readonly __capabilityIntentSchemaId: unique symbol};
type CapabilityResolvedSchemaId = string & {readonly __capabilityResolvedSchemaId: unique symbol};
type Sha256Hex = string & {readonly __sha256Hex: unique symbol};
type ProjectRegistrySnapshotId = string & {readonly __projectRegistrySnapshotId: unique symbol};

type CatalogMotionProfileId = "core.motion.content-adaptive@1";
type CatalogStylePackId = "core.style.adaptive-minimal@1";
type CatalogConstraintId =
  | "accessible-contrast"
  | "local-fonts-only"
  | "no-generated-media"
  | "seamless-default";

type CoreCapabilityId =
  | "core.camera.global-2d"
  | "core.effect.clip-mask"
  | "core.effect.content-transition"
  | "core.effect.opacity-transform"
  | "core.effect.path-trim"
  | "core.renderer.group"
  | "core.renderer.local-image"
  | "core.renderer.path"
  | "core.renderer.shape"
  | "core.renderer.text";

type CapabilityId = CoreCapabilityId | ProjectCapabilityId;
```

The normative safe ASCII grammar is:

```text
safe-id-segment = "[a-z0-9]" followed by 0..62 of "[a-z0-9-]", ending in "[a-z0-9]" when length > 1
safe-project-id = safe-id-segment
capability-slug = safe-id-segment *( "." safe-id-segment )
project-capability-id = "project." safe-project-id "." capability-slug
project-intent-schema-id = "project.schema." safe-project-id "." capability-slug ".intent@1"
project-resolved-schema-id = "project.schema." safe-project-id "." capability-slug ".resolved@1"
```

Every segment is 1–64 ASCII characters; a complete capability ID has a maximum of 191 characters and a project schema ID has a maximum of 209 characters. IDs are lowercase, have no empty segment, and cannot begin or end a segment with `-`. Consequently `/`, `\\`, `.`, `..`, percent encoding, whitespace, controls, Unicode confusables, URL punctuation, glob characters, and path separators cannot occur within a segment. A `ProjectCapabilityId` must embed the exact current `SafeProjectId` after `project.`; a merely prefix-similar project is invalid. Its two schema IDs are derived from that same exact project and capability slug by the grammar above, are distinct, and cannot be chosen independently. Core IDs are only the literal union above. Validation operates on decoded Unicode scalar input and accepts only exact ASCII bytes; it never normalizes a rejected value into validity.

`CapabilityVersion` is canonical SemVer 2.0.0 ASCII: `major.minor.patch`, optionally followed by `-` plus dot-separated prerelease identifiers and/or `+` plus dot-separated build identifiers. Major, minor, patch, and numeric prerelease identifiers are `0` or a non-zero digit followed by digits, so a leading zero is invalid there. Every non-numeric prerelease identifier and every build identifier contains only ASCII `[0-9A-Za-z-]` and is non-empty; SemVer-permitted leading zeros in a build identifier remain byte-significant identity. The complete version has a maximum of 128 characters. The validator round-trips the parsed value to exactly the original bytes; whitespace, `v` prefixes, signs, omitted components, Unicode, and alternative numeric spellings are invalid.

## Accepted project capability intent-schema meta-model

Project-local props are not made safe merely by storing a schema file. An accepted intent schema itself has this closed meta-schema:

```ts
type CapabilityIntentFieldDefinition =
  | {fieldId: SafeIdSegment; kind: "node-id"; semanticRole: "node-reference"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "copy-id"; semanticRole: "authored-copy-reference"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "token-id"; semanticRole: "design-token-reference"; tokenRole: "color" | "font-family" | "font-size" | "font-weight" | "line-height" | "spacing" | "stroke-width" | "corner-radius" | "opacity" | "scalar" | "enum"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "asset-id"; semanticRole: "local-asset-reference"; assetKind: "image" | "font" | "data"; assetUse: "render-image" | "render-font" | "render-data"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "track-id"; semanticRole: "declared-track-reference"; trackKind: "geometry" | "style" | "content" | "visible"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "path-state-id"; semanticRole: "numeric-path-state-reference"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "number"; semanticRole: "bounded-numeric-control"; minimum: number; maximum: number; numericPurpose: "normalized-progress" | "normalized-coordinate" | "pixel-distance" | "angle-degrees" | "frame-count" | "opacity" | "scalar"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "boolean"; semanticRole: "closed-toggle"; required: boolean}
  | {fieldId: SafeIdSegment; kind: "enum-id"; semanticRole: "closed-enum-selection"; allowedValueIds: [SafeIdSegment, ...SafeIdSegment[]]; required: boolean};

type CapabilityIntentSchema = {
  schemaVersion: "capability-intent-schema@1";
  schemaId: CapabilityIntentSchemaId;
  capabilityId: ProjectCapabilityId;
  capabilityVersion: CapabilityVersion;
  capabilityKind: "renderer" | "effect";
  additionalFields: false;
  limits: {
    maxFieldCount: 32;
    maxEnumMembersPerField: 32;
    maxCanonicalPayloadBytes: 8192;
  };
  fields: CapabilityIntentFieldDefinition[];
};
```

`fieldId` and every enum value use `safe-id-segment`; fields are unique and ascending by raw ASCII `fieldId`, and enum members are unique and ascending. There are 1–32 fields and 1–32 enum members where applicable. Numeric bounds and values are finite and within `[-1_000_000, 1_000_000]`, `minimum <= maximum`, and `numericPurpose` fixes their interpretation; frame counts are non-negative integers, normalized coordinates/progress and opacity stay in `[0,1]`, and a declared range cannot weaken those purpose bounds. Asset kind/use is an exact matrix (`image/render-image`, `font/render-font`, `data/render-data`) and the referenced accepted local asset must authorize that use. The schema ID is the derived safe non-locator ID above and is bound to the exact schema bytes by the accepted implementation receipt.

The schema document and its JCS-encoded props are exact objects with `additionalProperties: false`. The canonical props payload is at most 8192 bytes and has exactly one value for every required field, at most one for every optional field, no undeclared field, and the same ascending order as the schema. Neither a field definition nor a value can carry an arbitrary string/blob. A URL, filesystem path, traversal, import or executable text, media bytes, base64/data payload, SVG/path markup, CSS resource function, or literal copy is invalid. This is a deny-by-construction vocabulary, not a substring sanitizer.

```ts
type CoreMotionProfile = {
  id: CatalogMotionProfileId;
  description: DurableSemanticText;
  timingPolicy: "content-adaptive";
};

type CoreStylePack = {
  id: CatalogStylePackId;
  description: DurableSemanticText;
  constraints: [CatalogConstraintId, ...CatalogConstraintId[]];
};

type CoreCapability = {
  id: CoreCapabilityId;
  version: CapabilityVersion;
  kind: "renderer" | "effect" | "camera";
  implementationStatus: "part2-required";
  intentSchemaId: string;
  resolvedSchemaId: string;
  intent: DurableSemanticText;
};

type ProjectCatalogCapability = {
  id: ProjectCapabilityId;
  version: CapabilityVersion;
  kind: "renderer" | "effect";
  implementationStatus: "project-local-accepted";
  intentSchemaId: CapabilityIntentSchemaId;
  resolvedSchemaId: CapabilityResolvedSchemaId;
  intentSchemaHash: Sha256Hex;
  resolvedSchemaHash: Sha256Hex;
  implementationBindingHash: Sha256Hex;
  intent: DurableSemanticText;
};

type CoreCatalogRegistrySnapshot = {
  schemaVersion: "catalog-registry-snapshot@1";
  snapshotId: "core-registry-v1";
  scope: "core";
  parentSnapshotHash: null;
  implementationBindingHashes: [];
  motionProfiles: [CoreMotionProfile, ...CoreMotionProfile[]];
  stylePacks: [CoreStylePack, ...CoreStylePack[]];
  capabilities: [CoreCapability, ...CoreCapability[]];
};

type ProjectCatalogRegistrySnapshot = {
  schemaVersion: "catalog-registry-snapshot@1";
  snapshotId: ProjectRegistrySnapshotId;
  scope: "project";
  projectId: SafeProjectId;
  parentSnapshotHash: Sha256Hex;
  implementationBindingHashes: [Sha256Hex, ...Sha256Hex[]];
  motionProfiles: [CoreMotionProfile, ...CoreMotionProfile[]];
  stylePacks: [CoreStylePack, ...CoreStylePack[]];
  capabilities: [CoreCapability | ProjectCatalogCapability, ...(CoreCapability | ProjectCatalogCapability)[]];
};

type CatalogRegistrySnapshot = CoreCatalogRegistrySnapshot | ProjectCatalogRegistrySnapshot;
```

All snapshot members are exact-object schemas with `additionalProperties: false`. All IDs are non-empty, stable, and unique within their collection. Capability `(id, version)` pairs are unique. Every `intentSchemaId` and every `resolvedSchemaId` is also non-empty and globally unique in its respective schema-ID set. Arrays are in ascending raw-ASCII ID order, with canonical capability version bytes as the secondary key. No value contains a URL, provider, host path, secret, executable import, dynamic resource, generated-media reference, or implementation claim. The core snapshot has no project-local receipts, project ID, project capabilities, resource collection, or self-hash field.

The checked-in core schema IDs are a closed exact declared mapping, not discoverable locations:

| Capability `(id, version)` | `intentSchemaId` | `resolvedSchemaId` | MotionSpec binding |
|---|---|---|---|
| `core.camera.global-2d`, `1.0.0` | `core.schema.camera.global-2d.intent@1` | `core.schema.camera.global-2d.resolved@1` | `CameraTrack.capability` plus closed camera segments |
| `core.effect.clip-mask`, `1.0.0` | `core.schema.effect.clip-mask.intent@1` | `core.schema.effect.clip-mask.resolved@1` | `CoreClipMaskEffectBinding` |
| `core.effect.content-transition`, `1.0.0` | `core.schema.effect.content-transition.intent@1` | `core.schema.effect.content-transition.resolved@1` | `CoreContentTransitionEffectBinding` |
| `core.effect.opacity-transform`, `1.0.0` | `core.schema.effect.opacity-transform.intent@1` | `core.schema.effect.opacity-transform.resolved@1` | `CoreOpacityTransformEffectBinding` |
| `core.effect.path-trim`, `1.0.0` | `core.schema.effect.path-trim.intent@1` | `core.schema.effect.path-trim.resolved@1` | `CorePathTrimEffectBinding` |
| `core.renderer.group`, `1.0.0` | `core.schema.renderer.group.intent@1` | `core.schema.renderer.group.resolved@1` | `CoreGroupRendererBinding` |
| `core.renderer.local-image`, `1.0.0` | `core.schema.renderer.local-image.intent@1` | `core.schema.renderer.local-image.resolved@1` | `CoreLocalImageRendererBinding` |
| `core.renderer.path`, `1.0.0` | `core.schema.renderer.path.intent@1` | `core.schema.renderer.path.resolved@1` | `CorePathRendererBinding` |
| `core.renderer.shape`, `1.0.0` | `core.schema.renderer.shape.intent@1` | `core.schema.renderer.shape.resolved@1` | `CoreShapeRendererBinding` |
| `core.renderer.text`, `1.0.0` | `core.schema.renderer.text.intent@1` | `core.schema.renderer.text.resolved@1` | `CoreTextRendererBinding` |

These IDs name the closed documentation shapes in `motion-spec-contract.md`; they are not URLs, files, executable schema loaders, or proof that Part 2 exists. The future snapshot validator compares every core entry against this exact declared mapping and refuses an absent, extra, duplicated, renamed, cross-wired, or mismatched schema ID, including the camera member. It also rejects a MotionSpec binding whose four-part `(id, version, intentSchemaId, resolvedSchemaId)` tuple is not identical to one entry in the bound snapshot.

`registrySnapshotHash` is raw lowercase SHA-256 of the RFC 8785 serialization of the complete parsed resource. The interface refuses non-conforming JSON, duplicate/unsorted IDs, duplicate schema IDs, changed schema/snapshot identity, a non-empty core implementation-binding list, unsupported kinds/status, a schema tuple outside the exact mapping above, an unexpected key, or any remote/dynamic/executable value. It returns the exact resource path and hash as durable interface-result evidence while remaining in the same workflow state.

Creative Direction may select only `motionProfile` and `stylePackId` values present in the validated snapshot. Motion Planner may select only capability IDs/versions present in that same snapshot and binds its `registrySnapshotHash`. A missing or unvalidated resource produces a same-state deferred-interface pause; neither role invents a catalog ID.

## Project descendant validation

A later separately authorized project-local implementation may produce one `ProjectCatalogRegistrySnapshot` through the existing capability implementation receipt flow. Its `parentSnapshotHash` is the external SHA-256 identity of the complete accepted parent bytes. The parent is either the validated core snapshot or an already accepted project snapshot with the same exact `projectId`; arbitrary ancestry and cross-project parenting are invalid. `Sha256Hex` is exactly 64 lowercase hexadecimal ASCII characters.

The child is a monotonic exact descendant:

- Its `motionProfiles` and `stylePacks` arrays are byte-for-byte identical to the parent arrays, including order. Every inherited capability entry is byte-for-byte identical to its parent member and occurs exactly once. Every inherited core entry must also remain byte-for-byte identical to `catalog/core-registry.json`, even if a claimed parent is malformed.
- It adds one or more `ProjectCatalogCapability` entries and changes nothing else. Every addition belongs to the snapshot's exact project namespace and has a unique `(id, version)`. Deletion, replacement, shadowing, changed core/project entries, extra or changed motion profile, style pack, or resource data is invalid. There is no `resources` key in either exact-object schema; any resource collection or other unexpected property is invalid.
- Every added project entry is backed by one `CapabilityImplementationBinding@1` projection from the same implementation attempt. Its exact project/capability/version/schema-ID tuple equals the entry, its schema-evidence hashes equal `intentSchemaHash` and `resolvedSchemaHash`, and its externally recomputed `implementationBindingHash` equals the entry. The projection deliberately omits the future child snapshot's content hash, as closed in `artifact-acceptance.md`; it is not the final receipt hash and therefore creates no snapshot↔receipt self-reference. The child snapshot becomes usable only after the enclosing `CapabilityImplementationReceipt@1`, including this exact child as registry evidence, is externally accepted. An authorization, advisory, unaccepted receipt candidate, or merely matching prose is insufficient for MotionSpec use.
- Project capability entries and `implementationBindingHashes` form a bijection: each entry's `implementationBindingHash` occurs exactly once in the unique ascending list and every list member belongs to exactly one entry. The child list is the exact parent binding set plus the binding hashes for its new entries, sorted by raw lowercase hash bytes; it cannot omit, reorder, duplicate, or add an unrelated hash. Final accepted receipt hashes are tracked separately by MotionSpec and its `capabilityReceiptSetHash`; they never appear inside the snapshot they attest.
- Each accepted intent-schema document validates as the exact `CapabilityIntentSchema@1` meta-model above, binds the same project capability tuple, and hashes to the entry's `intentSchemaHash`. The resolved schema may only close deterministic output further; it cannot add authored arbitrary-string, locator, executable, media, or resource-loading channels that bypass the intent schema.

`snapshotId` is the exact ASCII string `project.<projectId>.registry.<bindingSetHash>`, where `bindingSetHash` is lowercase SHA-256 of the RFC 8785 serialization of the complete `implementationBindingHashes` array. The independently computed external `registrySnapshotHash` remains SHA-256 of the entire RFC 8785 snapshot. Neither value is trusted from prose, neither is a path, and neither permits a self-hash field.

Project descendant validation is atomic: it loads the accepted parent and every referenced accepted receipt/schema by durable identity, recomputes all hashes and exact equality rules above, and rejects before exposing a new `registrySnapshotHash` if any member fails. It never mutates `catalog/core-registry.json`, promotes a project-local entry into core, or treats a snapshot claim as implementation proof.
