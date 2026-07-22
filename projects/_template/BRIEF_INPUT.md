# Brief Input

Use this operator input before the Brief Planner records a canonical brief. Mark unknowns as unknown; do not present an assumption as a verified fact.

## Fast input

One-sentence request:

`{{oneSentenceRequest}}`

Desired project ID, if any: `{{projectId}}`

If omitted, the orchestrator follows the deterministic local slug/collision rule in `agent/contracts/workflow-decision.md`; every collision suffix receives its own budget and every final ID remains at most 64 characters. If format/fps/duration are omitted, Fast input assumes `1920×1080`, 30 fps, and 20 seconds; the operator can override any of them below.

## Structured brief

| Field | Operator input |
| --- | --- |
| Audience and purpose | `{{audienceAndPurpose}}` |
| Core message | `{{coreMessage}}` |
| Desired duration or range | `{{duration}}` |
| Required words, names, numbers, or calls to action | `{{requiredContent}}` |
| Tone and style constraints | `{{toneAndStyle}}` |
| Visual constraints or supplied assets | `{{visualConstraints}}` |
| Accessibility, brand, or delivery constraints | `{{deliveryConstraints}}` |
| Explicit exclusions | `{{exclusions}}` |

## Verified facts

Record each verified fact with the evidence that supports it. Unverified claims belong in questions or assumptions, not here.

| Verified fact | Evidence or local source | Verified by / date |
| --- | --- | --- |
| `{{fact}}` | `{{evidence}}` | `{{verifierAndDate}}` |

## Questions and assumptions

- Open question: `{{question}}`
- Safe creative assumption if no answer is needed for truth: `{{assumption}}`

## Locks

- Semantic lock or non-negotiable constraint: `{{lock}}`
- Approval authority or policy, if supplied: `{{approvalAuthority}}`
