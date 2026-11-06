#!/usr/bin/env bash
# Tests the realistic fixture sites (sites/_fixtures): every site is validated,
# built and checked with the generic site tests (one h1, JSON-LD, no overflow at
# 320/768/1440 px, axe). A few representative sites also get the full quality
# report — axe in every scheme, Lighthouse thresholds, screenshots.
# Usage: bash scripts/site/test-fixtures.sh [site-id...]
set -uo pipefail

# Multi-page + local contact, remote contact, dark scheme.
REPORTED=(dance-elegant auto-corporate cafe-premium-dark)

SITES=("$@")
if [ ${#SITES[@]} -eq 0 ]; then
  for dir in sites/_fixtures/*/; do SITES+=("$(basename "$dir")"); done
fi

failed=()

for site in "${SITES[@]}"; do
  dir="sites/_fixtures/$site"
  echo "▶ fixture: $site"

  npx tsx scripts/site/validate.ts --site "$dir" || { failed+=("$site (validate)"); continue; }
  # CI=1: never reuse a server that may be serving another site.
  CI=1 SITE_SMOKE=1 SITE_DIR="$dir" npx playwright test site.spec --project=desktop --reporter=line || failed+=("$site (site tests)")

  if [[ " ${REPORTED[*]} " == *" $site "* ]]; then
    npx tsx scripts/site/report.ts --site "$dir" --out ".generated/fixtures/$site" || failed+=("$site (report gates)")
  fi
done

# Each business has two designs from the same content: they must look clearly different.
for pair in "dance-elegant dance-energetic" "auto-corporate auto-bold" "cafe-warm cafe-premium-dark"; do
  read -r a b <<<"$pair"
  [ -d "sites/_fixtures/$a" ] && [ -d "sites/_fixtures/$b" ] || continue
  npx tsx scripts/site/compare.ts --site "sites/_fixtures/$a" --site "sites/_fixtures/$b" >/dev/null || failed+=("$a vs $b (too similar)")
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "✖ Fixtures failed: ${failed[*]}"
  exit 1
fi

echo "✔ Fixtures passed: ${SITES[*]}"
