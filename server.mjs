/**
 * Production server with security and caching headers on EVERY response.
 *
 * - contact.mode "local": wraps Astro's Node handler (static files + /api/contact)
 * - contact.mode "remote": the build has no server; static files are served
 *   from the output directory (same headers — also the model for a Caddyfile)
 *
 * Usage: node server.mjs          (PORT, HOST, SITE_URL, OUT_DIR from the environment)
 *        node server.mjs 4331     (port as an argument)
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.ASTRO_NODE_AUTOSTART = "disabled";

const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const host = process.env.HOST ?? "localhost";
const outDir = path.resolve(process.env.OUT_DIR || "dist");
const entry = path.join(outDir, "server", "entry.mjs");

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
  if (pathname.startsWith("/_astro/")) return IMMUTABLE;
  // Font and sprite file names contain a content hash (see build-fonts / build-icons).
  if (/^\/fonts\/.+\.[0-9a-f]{8}\.woff2$/.test(pathname)) return IMMUTABLE;
  if (/^\/icons\/sprite\.[0-9a-f]{8}\.svg$/.test(pathname)) return IMMUTABLE;
  if (/^\/(favicon\.(ico|svg)|site\.webmanifest|icons\/.+\.png|og-cover\.jpg)$/.test(pathname)) {
    return "public, max-age=86400";
  }

  return undefined;
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/vnd.microsoft.icon",
  ".woff2": "font/woff2",
};

/** Static mode (no Astro server): file, then <path>/index.html, else 404.html. */
function staticHandler(root) {
  const resolve = (pathname) => {
    const decoded = decodeURIComponent(pathname);
    const candidates = [decoded, path.join(decoded, "index.html")];

    for (const candidate of candidates) {
      const file = path.join(root, path.normalize(candidate));
      // Never serve anything outside the output directory.
      if (!file.startsWith(root + path.sep)) return undefined;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    }

    return undefined;
  };

  return (req, res, pathname) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }

    // One URL form (trailingSlash "never"): /contact/ → /contact
    if (pathname.length > 1 && pathname.endsWith("/")) {
      res.writeHead(301, { Location: pathname.replace(/\/+$/, "") }).end();
      return;
    }

    let file;
    try {
      file = resolve(pathname);
    } catch {
      file = undefined;
    }

    const status = file ? 200 : 404;
    file ??= path.join(root, "404.html");

    res.writeHead(status, { "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(file).pipe(res);
  };
}

const astroHandler = fs.existsSync(entry) ? (await import(pathToFileURL(entry).href)).handler : undefined;
const serveStatic = astroHandler ? undefined : staticHandler(outDir);

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
    res.setHeader = (name, value) => (name.toLowerCase() === "cache-control" ? res : setHeader(name, value));
  }

  if (astroHandler) astroHandler(req, res);
  else serveStatic(req, res, pathname);
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port} (${astroHandler ? "Astro server" : "static files"})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
