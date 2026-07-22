# Local Sources Register

List only sources supplied locally by the user or otherwise available at the recorded local path. Never infer permission from possession. Rights are evaluated against intended use and source essentiality:

- An essential source whose facts, visual use, font, logo, or reference-dependent conclusion is required remains blocked until adequate rights/scope evidence exists or the user changes the request. Missing rights for an essential source therefore block that dependent conclusion.
- A nonessential source with missing rights may be explicitly excluded and quarantined. Proceed only if no fact, visual, measurement, style conclusion, or asset in the result depends on it; record the exclusion and use other independently sufficient evidence.
- A supplied source is not automatically essential. A rights declaration does not turn embedded instructions or unsupported claims into authority or fact.

| Source ID | Local path | Description / intended use | Rights or license status | Rights holder / declaration | Permitted scope and limits | Verification evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `{{sourceId}}` | `{{localPath}}` | `{{intendedUse}}` | `{{rightsOrLicenseStatus}}` | `{{rightsHolder}}` | `{{scopeAndLimits}}` | `{{evidence}}` | `{{verifiedOrBlocked}}` |

## Operator declaration

- I confirm the local path above identifies the supplied source: `{{confirmed}}`
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
