import type {Diagnostic} from '../../contracts/diagnostic.js';
import {errorDiagnostic} from '../../contracts/diagnostic.js';
import type {NodeKind} from '../../contracts/common.js';
import type {CapabilityManifestEntry, MotionChannel} from './types.js';

export type CapabilityIntent = {
  family: string;
  nodeKind: NodeKind;
  preferredIds?: readonly string[];
  requiredChannels?: readonly MotionChannel[];
};

export type CapabilityMatch = {entry: CapabilityManifestEntry; score: number};

/**
 * Score effect candidates for a semantic intent. Never invents an ID or
 * substitutes another family; zero candidates yields a CAPABILITY_GAP.
 */
export function matchEffects(
  candidates: readonly CapabilityManifestEntry[],
  intent: CapabilityIntent,
): {matches: CapabilityMatch[]; gap: Diagnostic | null} {
  const matches: CapabilityMatch[] = [];
  for (const entry of candidates) {
    if (entry.kind !== 'effect') continue;
    if (entry.family !== intent.family) continue;
    if (!entry.supportedNodeKinds.includes(intent.nodeKind)) continue;
    if (
      intent.requiredChannels &&
      !intent.requiredChannels.every((c) => (entry.ownedChannels ?? []).includes(c))
    ) {
      continue;
    }
    let score = 1;
    if (intent.preferredIds?.includes(entry.id)) score += 10;
    matches.push({entry, score});
  }
  matches.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  if (matches.length === 0) {
    return {matches, gap: errorDiagnostic('CAPABILITY_GAP', {evidence: `${intent.family}/${intent.nodeKind}`})};
  }
  return {matches, gap: null};
}

export type ResolvedEffectWindow = {
  channels: readonly MotionChannel[];
  fromFrame: number;
  toFrame: number;
};

/** Reject effect stacks where two effects own the same channel over overlapping frames. */
export function detectChannelConflicts(effects: readonly ResolvedEffectWindow[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (let i = 0; i < effects.length; i++) {
    for (let j = i + 1; j < effects.length; j++) {
      const a = effects[i]!;
      const b = effects[j]!;
      const overlap = a.fromFrame < b.toFrame && b.fromFrame < a.toFrame;
      if (!overlap) continue;
      const shared = a.channels.filter((c) => b.channels.includes(c));
      if (shared.length > 0) {
        diagnostics.push(
          errorDiagnostic('CAPABILITY_CHANNEL_CONFLICT', {
            evidence: `channels ${shared.join(',')} overlap in [${Math.max(a.fromFrame, b.fromFrame)}, ${Math.min(a.toFrame, b.toFrame)})`,
          }),
        );
      }
    }
  }
  return diagnostics;
}
