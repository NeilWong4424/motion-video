# Revision Request

Use this input for every requested visual change after initialization. The Revision Interpreter determines the bounded SemanticPatch; this document does not authorize direct source edits.

## Request

- Project ID: `{{projectId}}`
- Current revision ID: `{{revisionId}}`
- Current RenderPlan hash, if available: `{{renderPlanHash}}`
- Requested change: `{{requestedChange}}`
- Reason or observed issue: `{{reason}}`
- Relevant review issue IDs or user instruction: `{{evidence}}`

## Locks

List every semantic lock, approved decision, timing requirement, or source constraint that must remain locked.

| Lock | Why it is locked | Evidence / authority |
| --- | --- | --- |
| `{{lock}}` | `{{rationale}}` | `{{authority}}` |

## Scope and unchanged work

- Intended affected beat, event, or artifact: `{{affectedScope}}`
- Must remain unchanged: `{{unchangedItems}}`
- All other approved work remains unchanged unless this request explicitly identifies it.
- Is a rebuild specifically requested? `{{yesOrNo}}`

## Acceptance check

- Observable result requested: `{{acceptanceCheck}}`
- New concern to avoid: `{{regressionToAvoid}}`
- Does this affect audio bindings or picture lock? `{{audioImpact}}`
