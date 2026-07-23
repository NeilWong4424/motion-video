/**
 * Render-only network/nondeterminism guard. Activates only when Remotion's
 * isRendering signal is true, never in Studio (so local HMR keeps working). It
 * replaces network-capable browser APIs with deterministic
 * RUNTIME_NETWORK_FORBIDDEN failures for every non-local target.
 *
 * This module is browser-side; it touches only globalThis, never Node modules.
 */

let installed = false;

function isLocalTarget(url: string): boolean {
  return (
    url.startsWith('blob:') ||
    url.startsWith('data:') ||
    url.startsWith('/') ||
    url.startsWith('./') ||
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1')
  );
}

/** Install the render-only network guard. Idempotent. */
export function installOfflineGuard(): void {
  if (installed) return;
  installed = true;

  const g = globalThis as unknown as Record<string, unknown>;

  const forbid = (label: string) => {
    return () => {
      throw new Error(`RUNTIME_NETWORK_FORBIDDEN: ${label}`);
    };
  };

  g.fetch = forbid('fetch');
  g.XMLHttpRequest = class {
    open(_method: string, url: string) {
      if (!isLocalTarget(String(url))) throw new Error('RUNTIME_NETWORK_FORBIDDEN: XMLHttpRequest');
    }
  };
  g.WebSocket = forbid('WebSocket');
  g.EventSource = forbid('EventSource');

  const nav = (globalThis as unknown as {navigator?: {sendBeacon?: unknown}}).navigator;
  if (nav) {
    nav.sendBeacon = forbid('sendBeacon');
  }
}

/** Whether a URL would be permitted by the guard (for tests). */
export function isLocalRenderTarget(url: string): boolean {
  return isLocalTarget(url);
}
