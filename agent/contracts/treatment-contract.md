# Treatment documentation contract

`TreatmentSpec@1` is the sole closed, role-readable Treatment contract. It records creative strategy between the factual Brief and frame-accurate MotionSpec. Part 1 implements no JSON Schema, validator, source hasher, catalog, or engine.

```ts
type NarrativeFunction = "hook" | "setup" | "development" | "turn" | "payoff" | "resolve" | "cta";
type TransitionFamily = "shared-element" | "camera-navigation" | "morph-into-target" | "match-on-action" | "directional-push";

type NarrativeArcStep = {
  id: string;
  function: NarrativeFunction;
  objective: string;
};

type BeatIntention = {
  id: string;
  objective: string;
  message: string;
  focalIntent: string;
  liveContinuityIntent: string;
};

type CameraTravelRationale = {
  id: string;
  fromBeatId: string;
  toBeatId: string;
  travelIntent: "hold" | "travel";
  revealedSpatialRelation: string;
};

type TreatmentSpec = {
  schemaVersion: "treatment@1";
  id: "treatment";
  projectId: string;
  briefHash: string;
  message: string;
  narrativeArc: [NarrativeArcStep, ...NarrativeArcStep[]];
  continuityPolicy: "seamless-default";
  compositionMode: "persistent-stage" | "continuous-world" | "held-shot";
  motionProfile: string;
  stylePackId: string;
  visualThesis: string;
  copyStrategy: string;
  transitionVocabulary: {
    ordinaryFamilies: [TransitionFamily, ...TransitionFamily[]];
    signatureTransition: TransitionFamily | null;
  };
  chapterCutBudget: 0 | 1;
  beatIntentions: [BeatIntention, ...BeatIntention[]];
  cameraTravelRationale: CameraTravelRationale[];
};
```

All IDs are stable, non-empty, and unique within their collection. `ordinaryFamilies` contains one to three unique values. A non-null signature transition is at most one family and is not duplicated in ordinary families. `beatIntentions` order is narrative order; every arc step and camera rationale references a real intention where applicable. `message` is the unchanged Brief message. Catalog IDs are references only and require later registry evidence.

`compositionMode` never weakens `seamless-default`. A `travel` rationale names a concrete honest spatial relationship; otherwise use `hold`. `transitionVocabulary` contains only positive-duration continuity families. A chapter cut is a separately budgeted exception outside that vocabulary; it never appears as an ordinary or signature transition family. `chapterCutBudget: 1` is permission to consider at most one honest cut, not a requirement or a waiver of cut evidence. The Treatment contains no pixels, exact frames, coordinates, React/CSS, capability implementation, audio plan, review, or approval.

For semantic revision, the top-level treatment target is `{entity:"treatment", id:"treatment"}`. Arc-step, Beat-intention, transition-vocabulary, and travel-rationale changes must be represented through stable named fields and all affected Treatment/Beat targets. Added, removed, or reordered Beat intentions are structural and require rebuild mode.
