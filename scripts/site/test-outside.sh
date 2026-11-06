#!/usr/bin/env bash
# The orchestrator builds into its own workspace: --out outside the project must
# work for both contact modes, and the result must run with `node server.mjs`.
set -uo pipefail

WORK=$(mktemp -d)
PORT=4592
trap 'rm -rf "$WORK"; [ -n "${PID:-}" ] && kill "$PID" 2>/dev/null' EXIT

fail() { echo "FAIL: $1"; exit 1; }

for site in sites/_demo sites/_fixtures/auto-corporate; do
  out="$WORK/$(basename "$site")"
  npx tsx scripts/site/build.ts --site "$site" --out "$out" >"$WORK/build.log" 2>&1 || { tail -30 "$WORK/build.log"; fail "build of $site into $out"; }

  OUT_DIR="$out" SITE_DIR="$site" HOST=localhost node server.mjs "$PORT" >/dev/null 2>&1 &
  PID=$!
  for _ in $(seq 1 40); do curl -fs "http://localhost:$PORT/" >/dev/null && break; sleep 0.25; done
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/")
  kill "$PID"; PID=""
  [ "$status" = "200" ] || fail "$site served from $out answered $status"
done

echo "Outside-output check passed: local and remote builds outside the project build and run."
