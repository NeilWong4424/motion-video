/**
 * Deterministic frame-to-seconds formatting and free-text sanitization for the
 * offline music prompt. Integer arithmetic only; no floating-point or locale.
 */

/** formatSeconds(frame, fps): exact ms via integer round-half-up, 3 decimals. */
export function formatSeconds(frame: number, fps: number): string {
  if (!Number.isInteger(frame) || frame < 0 || !Number.isInteger(fps) || fps <= 0) {
    throw new Error('AUDIO_FORMAT_INPUT_INVALID');
  }
  const milliseconds = Math.floor((2 * frame * 1000 + fps) / (2 * fps));
  const wholeSeconds = Math.floor(milliseconds / 1000);
  const fraction = String(milliseconds % 1000).padStart(3, '0');
  return `${wholeSeconds}.${fraction}`;
}

/**
 * sanitizeText: NFC, LF-normalized, backtick→apostrophe, whitespace collapsed,
 * control/surrogate/NUL rejected, non-empty. Prevents any field from injecting
 * a new Markdown line or fence.
 */
export function sanitizeText(value: string): string {
  if (typeof value !== 'string') throw new Error('AUDIO_TEXT_INVALID');
  // Reject unpaired surrogates, NUL and non-whitespace control chars.
  for (const ch of value) {
    const cp = ch.codePointAt(0)!;
    if (cp === 0) throw new Error('AUDIO_TEXT_INVALID: NUL');
    if (cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) {
      throw new Error('AUDIO_TEXT_INVALID: control char');
    }
    if (cp >= 0xd800 && cp <= 0xdfff) throw new Error('AUDIO_TEXT_INVALID: surrogate');
  }
  let out = value.replace(/\r\n?/g, '\n').normalize('NFC').replaceAll('`', "'");
  out = out.replace(/\s+/gu, ' ').trim();
  if (out.length === 0) throw new Error('AUDIO_TEXT_EMPTY');
  return out;
}
