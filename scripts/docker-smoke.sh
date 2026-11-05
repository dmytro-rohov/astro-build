#!/usr/bin/env bash
# Builds the production Docker image and checks that it really runs in
# production mode: HSTS is sent for an https SITE_URL, the contact form refuses
# to "send" without CONTACT_DELIVERY_MODE, and headers/caching are in place.
# Usage: bash scripts/docker-smoke.sh
set -euo pipefail

IMAGE="astro-starter:smoke"
NAME="astro-starter-smoke"
PORT=4590
ORIGIN="http://localhost:${PORT}"

docker build --quiet --build-arg SITE_URL=https://example.com -t "$IMAGE" . >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p "127.0.0.1:${PORT}:4321" "$IMAGE" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  curl -fs -o /dev/null "$ORIGIN/" && break
  sleep 1
done

fail() { echo "FAIL: $1"; docker logs "$NAME" | tail -20; exit 1; }

headers=$(curl -fsI "$ORIGIN/")
grep -qi "^strict-transport-security: max-age=31536000" <<<"$headers" || fail "HSTS header missing (build not in production mode?)"
grep -qi "^x-frame-options: DENY" <<<"$headers" || fail "X-Frame-Options missing"

status=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: $ORIGIN" -H "Host: localhost:${PORT}" \
  -H "Accept: application/json" \
  -F name=Jan -F email=jan@example.com -F message="Hello from the smoke test" -F privacy=on \
  "$ORIGIN/api/contact")
[ "$status" = "500" ] || fail "contact form without CONTACT_DELIVERY_MODE returned $status, expected 500"

html=$(curl -fs "$ORIGIN/")
grep -q "debug_mode:!0" <<<"$html" && fail "GA debug mode is enabled in the production build"

font=$(grep -oE '/fonts/[^"]+\.woff2' <<<"$html" | head -1)
curl -fsI "$ORIGIN$font" | grep -qi "^cache-control: public, max-age=31536000, immutable" || fail "font is not cached as immutable"

echo "Docker smoke test passed."
