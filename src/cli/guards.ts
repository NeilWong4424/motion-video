/** Reject URL-like inputs before any filesystem action. */
export function rejectUrlLike(value: string): void {
  if (/^(?:https?|data|file|ftp):/i.test(value)) {
    throw new Error('URL_INPUT_FORBIDDEN');
  }
}
