/**
 * Starts the production build on a given port (used by Lighthouse CI).
 * Usage: node scripts/serve-dist.js [port]
 */
process.env.PORT = process.argv[2] ?? process.env.PORT ?? "4321";
process.env.HOST ??= "localhost";

await import("../dist/server/entry.mjs");
