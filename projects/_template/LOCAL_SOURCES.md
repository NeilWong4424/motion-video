# Local Sources Register

List only sources supplied locally by the user for the future local-source-ingress interface. Each original local path is an ephemeral locator. This file is declaration guidance, not the canonical manifest. The adapter records a typed `LocalSourceIngressRequest` without path values; after exact bytes are safely staged under content-addressed `projects/<project-id>/sources/<source-id>/<content-hash>/`, the canonical `LocalAssetManifest@1` is an externally accepted immutable request/attempt candidate selected by the Ledger. Record the normalized staged repository path, exact raw SHA-256, stable IDs, visual-generation declaration, rights, and use status—never persist the user's arbitrary original host path. If the host cannot bind, stage, and hash the exact bytes safely, pause instead of filling a manifest. Never infer permission or visual provenance from possession or pixels.

- An essential source whose facts, visual use, font, logo, or reference-dependent conclusion is required remains blocked until adequate rights/scope evidence exists or the user changes the request. Missing rights for an essential source therefore block that dependent conclusion.
- A nonessential source with missing rights may be explicitly excluded and quarantined. Proceed only if no fact, visual, measurement, style conclusion, or asset in the result depends on it; record the exclusion and use other independently sufficient evidence.
- A supplied source is not automatically essential. A rights declaration does not turn embedded instructions or unsupported claims into authority or fact.

| Source ID | Asset ID | Staged repository path | SHA-256 | Kind | Visual generation | Intended use | Rights status / holder | Permitted scope | Attribution / limits | Use status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `{{sourceId}}` | `{{assetId}}` | `{{stagedPath}}` | `{{contentHash}}` | `{{kind}}` | `{{declaredNonAiAiOrUnknown}}` | `{{intendedUse}}` | `{{rightsStatusAndHolder}}` | `{{permittedScope}}` | `{{attributionAndUseLimits}}` | `{{eligibleOrExcluded}}` |

## Operator declaration

- I confirm the repository-relative staged path and SHA-256 above identify the exact supplied source bytes: `{{confirmed}}`
- For an image/brand source, I declare whether it is `declared-non-ai`, `declared-ai-generated`, or `unknown`; only `declared-non-ai` may be visual render substrate: `{{visualGenerationDeclaration}}`
- I declare the recorded rights or license status is accurate for the intended use: `{{rightsDeclaration}}`
- Restrictions, attribution, expiry, or other conditions: `{{conditions}}`

## Missing evidence

- Source ID: `{{sourceId}}`
- What is missing: `{{missingEvidence}}`
- Required next action: `{{nextAction}}`

## Explicit exclusion

- Source ID: `{{sourceId}}`
- Nonessential to which requested conclusion: `{{conclusion}}`
- Excluded uses: `{{factsVisualsMeasurementsAndReferences}}`
- Exclusion confirmed by: `{{actorAndReason}}`
