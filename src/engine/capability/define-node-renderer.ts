import {CAPABILITY_ID_PATTERN, CAPABILITY_VERSION_PATTERN, type NodeRendererDefinition} from './types.js';

export function defineNodeRenderer<P>(
  definition: NodeRendererDefinition<P>,
): NodeRendererDefinition<P> {
  if (!CAPABILITY_ID_PATTERN.test(definition.id)) {
    throw new Error('CAPABILITY_ID_INVALID');
  }
  if (!CAPABILITY_VERSION_PATTERN.test(definition.version)) {
    throw new Error('CAPABILITY_VERSION_INVALID');
  }
  if (definition.supportedNodeKinds.length === 0) {
    throw new Error('CAPABILITY_KINDS_EMPTY');
  }
  return definition;
}
