/**
 * Production server: Astro's Node handler (static files + on-demand routes)
 * wrapped with security and caching headers for EVERY response — pages,
 * prerendered 404, static files and the contact API alike.
 *
 * Usage: node server.mjs          (PORT, HOST, SITE_URL from the environment)
 *        node server.mjs 4331     (port as an argument)
 */
import http from "node:http";

process.env.ASTRO_NODE_AUTOSTART = "disabled";

const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const host = process.env.HOST ?? "localhost";

const { handler } = await import("./dist/server/entry.mjs");

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // CSP frame-ancestors is ignored in <meta> policies, so framing is blocked here.
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

if (process.env.NODE_ENV === "production" && (process.env.SITE_URL ?? "").startsWith("https://")) {
  securityHeaders["Strict-Transport-Security"] = "max-age=31536000";
}

const IMMUTABLE = "public, max-age=31536000, immutable";

/** Cache policy for files whose names are not handled by Astro's /_astro/ folder. */
function cacheControlFor(pathname) {
  // Font and sprite file names contain a content hash (see build-fonts / build-icons).
  if (/^\/fonts\/.+\.[0-9a-f]{8}\.woff2$/.test(pathname)) return IMMUTABLE;
  if (/^\/icons\/sprite\.[0-9a-f]{8}\.svg$/.test(pathname)) return IMMUTABLE;
  if (/^\/(favicon\.ico|site\.webmanifest|icons\/.+\.png|og-cover\.jpg)$/.test(pathname)) {
    return "public, max-age=86400";
  }

  return undefined;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  // All pages are prerendered, so images are generated at build time.
  // The on-demand image endpoint would let anyone trigger expensive re-encoding.
  if (pathname.startsWith("/_image")) {
    res.writeHead(404, securityHeaders).end();
    return;
  }

  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }

  const cacheControl = cacheControlFor(pathname);

  if (cacheControl) {
    const setHeader = res.setHeader.bind(res);
    setHeader("Cache-Control", cacheControl);
    // Keep our value when the static file handler tries to set its own.
    res.setHeader = (name, value) =>
      name.toLowerCase() === "cache-control" ? res : setHeader(name, value);
  }

  handler(req, res);
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
