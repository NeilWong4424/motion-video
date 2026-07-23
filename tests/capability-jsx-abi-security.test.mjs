import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ledger = await readFile(new URL('../agent/contracts/workflow-ledger.md', import.meta.url), 'utf8');

test('project-local TSX capabilities cannot escape through DOM media or raw props', () => {
  assert.match(ledger, /TSX\/JSX is closed by an allowlist, not a denylist/i);
  for (const element of ['video', 'audio', 'img', 'iframe', 'script', 'canvas', 'foreignObject']) {
    assert.match(ledger, new RegExp(`\\b${element}\\b`, 'i'));
  }
  for (const primitive of ['MotionGroup', 'MotionRect', 'MotionPath', 'MotionText', 'MotionAsset', 'MotionClip']) {
    assert.match(ledger, new RegExp(`\\b${primitive}\\b`));
  }
  for (const prop of ['dangerouslySetInnerHTML', 'style', 'src', 'srcSet', 'href', 'poster']) {
    assert.match(ledger, new RegExp(`\\b${prop}\\b`));
  }
  assert.match(ledger, /any `on\*` event property/);
  assert.match(ledger, /`MotionAsset` accepts only[^\n]+accepted `assetId`[^\n]+allowed render use/i);
  assert.match(ledger, /`MotionText` accepts only[^\n]+MotionSpec `copyId`/i);
  assert.match(ledger, /design values accept only[^\n]+MotionSpec token IDs/i);
  assert.match(ledger, /No primitive accepts a URL, data URI, path, filename, CSS string, markup string/i);
  assert.match(ledger, /Mechanical AST\/type validation resolves every asset\/copy\/token reference/i);
});
