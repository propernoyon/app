/**
 * Stub for the `server-only` package used by the test runner.
 *
 * `server-only` throws on import unless the bundler resolves the React Server
 * Components condition — which is exactly what we want in the app, but it makes
 * server modules untestable. Vitest aliases the package to this empty module so
 * server-side units (the API client, guards) can still be exercised directly.
 */
export {};
