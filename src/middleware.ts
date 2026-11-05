import { defineMiddleware } from "astro:middleware";

/**
 * Security headers for every server-rendered response.
 * Content-Security-Policy itself is set by Astro (security.csp in astro.config).
 * Static files (fonts, images, /_astro) are served before middleware runs —
 * set the same headers in the reverse proxy (Caddy) for full coverage.
 */
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // CSP frame-ancestors is ignored in <meta>, so block framing with a header.
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

const isHttpsSite = (import.meta.env.SITE ?? "").startsWith("https://");

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  for (const [name, value] of Object.entries(securityHeaders)) {
    if (!response.headers.has(name)) {
      response.headers.set(name, value);
    }
  }

  if (import.meta.env.PROD && isHttpsSite) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  return response;
});
