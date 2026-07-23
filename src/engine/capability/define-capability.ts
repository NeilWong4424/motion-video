import {
  CAPABILITY_ID_PATTERN,
  CAPABILITY_VERSION_PATTERN,
  type MotionCapabilityDefinition,
} from './types.js';

export function defineCapability<I, R>(
  definition: MotionCapabilityDefinition<I, R>,
): MotionCapabilityDefinition<I, R> {
  if (!CAPABILITY_ID_PATTERN.test(definition.id)) {
    throw new Error('CAPABILITY_ID_INVALID');
  }
  if (!CAPABILITY_VERSION_PATTERN.test(definition.version)) {
    throw new Error('CAPABILITY_VERSION_INVALID');
  }
  if (definition.supportedNodeKinds.length === 0) {
    throw new Error('CAPABILITY_KINDS_EMPTY');
  }
  // Unique owned channels.
  if (new Set(definition.ownedChannels).size !== definition.ownedChannels.length) {
    throw new Error('CAPABILITY_CHANNEL_DUPLICATE');
  }
  if (definition.ownedChannels.length === 0) {
    throw new Error('CAPABILITY_CHANNEL_EMPTY');
  }
  // Positive performance budget.
  if (definition.performanceBudget.maxDomNodes <= 0 || definition.performanceBudget.maxSvgPaths < 0) {
    throw new Error('CAPABILITY_BUDGET_INVALID');
  }
  // Stable-root continuity metadata.
  if (definition.continuity.stableRoot !== true) {
    throw new Error('CAPABILITY_CONTINUITY_INVALID');
  }
  // Fixture intent must pass its own schema.
  const fixtureResult = definition.intentSchema.safeParse(definition.fixture.intent);
  if (!fixtureResult.success) {
    throw new Error('CAPABILITY_FIXTURE_INVALID');
  }
  return definition;
}
