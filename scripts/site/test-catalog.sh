#!/usr/bin/env bash
# Builds the generated catalog site in several archetypes and layout variants
# and runs the boundary + axe tests on each.
# Usage: bash scripts/site/test-catalog.sh [archetype...]
set -uo pipefail

failed=()

ARCHETYPES=("$@")
[ ${#ARCHETYPES[@]} -gt 0 ] || ARCHETYPES=(default minimal elegant bold warm premium-dark corporate energetic)
NAVBARS=(simple centered topbar)
FOOTERS=(columns simple centered)
LANGS=(pl en uk)

for index in "${!ARCHETYPES[@]}"; do
  archetype="${ARCHETYPES[$index]}"
  navbar="${NAVBARS[$((index % 3))]}"
  footer="${FOOTERS[$((index % 3))]}"
  lang="${LANGS[$((index % 3))]}"
  # Cyrillic needs a font pair with Cyrillic glyphs; archetypes without one use Polish.
  if [ "$lang" = "uk" ] && [[ "$archetype" =~ ^(minimal|warm|energetic)$ ]]; then lang="pl"; fi

  dir=".generated/catalog-$archetype"
  echo "▶ catalog: archetype=$archetype navbar=$navbar footer=$footer lang=$lang"
  npx tsx scripts/site/make-catalog.ts --out "$dir" --archetype "$archetype" --navbar "$navbar" --footer "$footer" --lang "$lang" >/dev/null \
    || { failed+=("$archetype (generator)"); continue; }
  CATALOG=1 SITE_DIR="$dir" npx playwright test catalog --project=desktop || failed+=("$archetype")
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "✖ Catalog failed for: ${failed[*]}"
  exit 1
fi

echo "✔ Catalog passed for: ${ARCHETYPES[*]}"
