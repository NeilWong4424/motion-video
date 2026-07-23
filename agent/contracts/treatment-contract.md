# Treatment documentation contract

`TreatmentSpec@1` is the sole closed, role-readable Treatment contract. It records creative strategy between the factual Brief and frame-accurate MotionSpec. Part 1 implements no JSON Schema, validator, source hasher, catalog, or engine. `DurableSemanticText` is the exact locator-safe alias in `input-trust.md`; `CatalogMotionProfileId` and `CatalogStylePackId` are the closed registry aliases in `catalog-registry-contract.md`. None is widened here.

```ts
type NarrativeFunction = "hook" | "setup" | "development" | "turn" | "payoff" | "resolve" | "cta";
type TransitionFamily = "shared-element" | "camera-navigation" | "morph-into-target" | "match-on-action" | "directional-push";

type NarrativeArcStep = {
  id: string;
  function: NarrativeFunction;
  objective: DurableSemanticText;
};

type BeatIntention = {
  id: string;
  objective: DurableSemanticText;
  message: DurableSemanticText;
  focalIntent: DurableSemanticText;
  liveContinuityIntent: DurableSemanticText;
};

type CameraTravelRationale = {
  id: string;
  fromBeatId: string;
  toBeatId: string;
  travelIntent: "hold" | "travel";
  revealedSpatialRelation: DurableSemanticText;
};

type TreatmentSpec = {
  schemaVersion: "treatment@1";
  id: "treatment";
  projectId: string;
  briefHash: string;
  researchFindingsHash: string | null;
  assetManifestHash: string | null;
  catalogRegistrySnapshotHash: string;
  message: DurableSemanticText;
  narrativeArc: [NarrativeArcStep, ...NarrativeArcStep[]];
  continuityPolicy: "seamless-default";
  compositionMode: "persistent-stage" | "continuous-world" | "held-shot";
  motionProfile: CatalogMotionProfileId;
  stylePackId: CatalogStylePackId;
  visualThesis: DurableSemanticText;
  copyStrategy: DurableSemanticText;
  transitionVocabulary: {
    ordinaryFamilies: [TransitionFamily, ...TransitionFamily[]];
    signatureTransition: TransitionFamily | null;
  };
  chapterCutBudget: 0 | 1;
  beatIntentions: [BeatIntention, ...BeatIntention[]];
  cameraTravelRationale: CameraTravelRationale[];
};
```

All IDs are stable, non-empty, and unique within their collection. `ordinaryFamilies` contains one to three unique values. A non-null signature transition is at most one family and is not duplicated in ordinary families. `beatIntentions` order is narrative order. `message` is the unchanged Brief message. `briefHash` binds the exact accepted Brief. `researchFindingsHash` and `assetManifestHash` must exactly equal that Brief's declared parent values; a Treatment cannot silently add, remove, or replace local evidence. Catalog IDs are references only and require later registry evidence.

`catalogRegistrySnapshotHash` is the external identity returned by `catalog-registry-snapshot` for the exact catalog from which `motionProfile` and `stylePackId` were selected. Both IDs must exist in that snapshot. `cameraTravelRationale` is the complete boundary-intent registry. It contains exactly one `CameraTravelRationale` for every adjacent ordered `BeatIntention` pair. Its `fromBeatId` and `toBeatId` fields name those exact Treatment Beat-intention IDs despite the historical field names. The rationales occur in the same order as the adjacent intention pairs, with no missing member, no extra member, and no duplicate pair or rationale ID. A one-intention Treatment therefore has an empty rationale array; otherwise its length is exactly `beatIntentions.length - 1`.

`compositionMode` never weakens `seamless-default`. A `travel` rationale names a concrete honest spatial relationship that a later `camera-navigation` bridge must reveal exactly; otherwise use `hold` and record why holding the global camera across that boundary is the truthful choice. A hold rationale authorizes node/content continuity but no boundary camera travel. `transitionVocabulary` contains only positive-duration continuity families. A chapter cut is a separately budgeted exception outside that vocabulary; it never appears as an ordinary or signature transition family. `chapterCutBudget: 1` is permission to consider at most one honest cut, not a requirement or a waiver of cut evidence. The Treatment contains no pixels, exact frames, coordinates, React/CSS, capability implementation, audio plan, review, or approval.

For semantic revision, the top-level treatment target is `{entity:"treatment", id:"treatment"}`. Arc-step, Beat-intention, transition-vocabulary, and travel-rationale changes must be represented through stable named fields and all affected Treatment/Beat targets. Added, removed, or reordered Beat intentions are structural and require rebuild mode.
