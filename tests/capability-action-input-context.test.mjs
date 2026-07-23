import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const decision = await readFile(new URL('../agent/contracts/workflow-decision.md', import.meta.url), 'utf8');
const ledger = await readFile(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');

test('gap-dependent role and implementation hashes retain exact route context', () => {
  assert.match(decision, /type RoleActionInvocationInputFor<R extends RoleDelegationRoute>[\s\S]+}\s*&\s*CapabilityGapRouteFieldForRole<R>/);
  assert.match(decision, /type InterfaceActionInvocationInputFor<R extends NormalInterfaceInvocationRoute>[\s\S]+}\s*&\s*CapabilityGapRouteFieldForInterface<R>/);
  assert.match(decision, /routeCorrelation:[\s\S]+R extends \{originPlanningContext: infer C extends OriginPlanningContext\}[\s\S]+\{originPlanningContext: C\}/);
  assert.match(decision, /gap-dependent Motion Planner\/Capability Builder actions[^\n]+complete mapped `capabilityGapRoute`/i);
  assert.match(decision, /project-local capability implementation[^\n]+`routeCorrelation\.originPlanningContext`[^\n]+same complete mapped proposal route/i);
  assert.match(decision, /initial and rebuild inputs cannot collide or cross/i);
  assert.match(ledger, /type PendingRoleActionFor<R extends RoleDelegationRoute>[\s\S]+invocationInput:\s*ActionInvocationInputFor<R>/);
  assert.match(ledger, /type PendingNormalInterfaceActionFor<R extends NormalInterfaceInvocationRoute>[\s\S]+invocationInput:\s*ActionInvocationInputFor<R>/);
});
