#!/usr/bin/env bash
# Builds the demo in contact.mode "remote" and checks that the result is a
# purely static site: no Node server, no /api/contact, the form posts to the
# form service with siteId, the CSP allows that origin, and server.mjs serves
# the files with the security headers.
set -uo pipefail

SITE=".generated/remote-demo"
OUT=".generated/remote-dist"
PORT=4591
ENDPOINT="https://forms.example.com/v1/submit"

rm -rf "$SITE" "$OUT"
mkdir -p "$SITE"
cp -r sites/_demo/assets "$SITE/"
node -e '
  const fs = require("fs");
  const site = JSON.parse(fs.readFileSync("sites/_demo/site.json", "utf8"));
  site.siteId = "remote-demo";
  site.contact = { mode: "remote", endpoint: process.argv[1] };
  fs.writeFileSync(process.argv[2] + "/site.json", JSON.stringify(site));
' "$ENDPOINT" "$SITE"

fail() { echo "FAIL: $1"; [ -n "${PID:-}" ] && kill "$PID" 2>/dev/null; exit 1; }

npx tsx scripts/site/build.ts --site "$SITE" --out "$OUT" >/dev/null 2>&1 || fail "build failed"

[ -e "$OUT/server/entry.mjs" ] && fail "remote build contains a Node server"
[ -f "$OUT/index.html" ] || fail "no static index.html"
grep -q "action=\"$ENDPOINT\"" "$OUT/contact/index.html" || fail "form does not post to the form service"
grep -q 'name="siteId" value="remote-demo"' "$OUT/contact/index.html" || fail "form does not send siteId"
grep -q "form-action 'self' https://forms.example.com" "$OUT/contact/index.html" || fail "CSP does not allow the form service"

OUT_DIR="$OUT" PORT=$PORT HOST=localhost node server.mjs >/dev/null 2>&1 &
PID=$!
for _ in $(seq 1 20); do curl -fs -o /dev/null "http://localhost:$PORT/" && break; sleep 0.5; done

headers=$(curl -fsI "http://localhost:$PORT/contact")
grep -qi "^x-frame-options: DENY" <<<"$headers" || fail "security headers missing in static mode"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/contact")" = "404" ] || fail "/api/contact exists in remote mode"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/nope")" = "404" ] || fail "missing page is not 404"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/contact/")" = "301" ] || fail "trailing slash not redirected"
[ "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is "http://localhost:$PORT/../package.json")" = "404" ] || fail "path traversal not blocked"

kill "$PID"
echo "Remote mode check passed: static output, form → $ENDPOINT, headers OK."
