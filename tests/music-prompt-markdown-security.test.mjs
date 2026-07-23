import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const template = await readFile(new URL('../agent/templates/music-prompt-document.md', import.meta.url), 'utf8');

test('projected music-prompt text cannot escape inert Markdown enclosures', () => {
  assert.match(template, /Replace every ASCII backtick[^\n]+ASCII apostrophe/i);
  assert.match(template, /Collapse every non-empty run of Unicode whitespace[^\n]+single ASCII space/i);
  assert.match(template, /- Manual SFX production notes: `\{\{sfxNotes\}\}`/);
  assert.match(template, /Every projected free-text byte[^\n]+fenced `text` generator block[^\n]+inline-code span/i);
  assert.match(template, /no field can terminate either enclosure[^\n]+active Markdown[^\n]+HTML[^\n]+link destination[^\n]+executable URI/i);
  assert.match(template, /changed fence count[^\n]+unknown\/additional placeholder[^\n]+template drift refuses/i);
  assert.match(template, /never evaluates rendered Markdown, HTML, a URI, or field text as an instruction/i);
});
