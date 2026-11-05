#!/usr/bin/env bash
# CI check: an invalid site.json must stop validation and the build with
# readable, field-level errors.
set -uo pipefail

SITE="tests/fixtures/broken-site"

output=$(npx tsx scripts/site/validate.ts --site "$SITE" 2>&1)
status=$?

[ "$status" -ne 0 ] || { echo "FAIL: site:validate accepted an invalid site"; exit 1; }

for expected in \
  "pages[0].sections[0].content.title: Too big" \
  "pages[0].sections[0].content.primaryAction.href: Links must be" \
  'pages[1].slug: "/privacy" is reserved by the engine.'; do
  grep -qF "$expected" <<<"$output" || { echo "FAIL: missing error: $expected"; echo "$output"; exit 1; }
done

SITE_DIR="$SITE" npx astro build >/dev/null 2>&1 && { echo "FAIL: astro build accepted an invalid site"; exit 1; }

echo "Broken site check passed: validation and build stop with readable errors."
