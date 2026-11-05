/**
 * Simple in-memory rate limit for the contact form (per client IP).
 * Good enough for a single Node process; counters reset on restart.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(clientId: string, now = Date.now()): boolean {
  const recent = (hits.get(clientId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS) {
    hits.set(clientId, recent);
    return true;
  }

  recent.push(now);
  hits.set(clientId, recent);

  // Drop stale entries so the map does not grow forever.
  if (hits.size > 1000) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) {
        hits.delete(key);
      }
    }
  }

  return false;
}

/**
 * The app runs behind a reverse proxy (Caddy) and listens only on 127.0.0.1,
 * so the first X-Forwarded-For entry is the real visitor address.
 */
export function getClientId(request: Request, clientAddress: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return forwardedFor?.split(",")[0]?.trim() || clientAddress;
}
