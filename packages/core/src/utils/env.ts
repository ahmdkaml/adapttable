/**
 * Whether a DOM `window` is available. Returns `false` under SSR / in a
 * plain Node environment, so callers can fall back to non-DOM behaviour.
 *
 * Reads through a cast because the DOM lib types declare `window` as
 * always present, which it isn't on the server.
 *
 * @returns `true` when running in a browser-like environment.
 */
export function isBrowser(): boolean {
  return (globalThis as { window?: unknown }).window !== undefined;
}
