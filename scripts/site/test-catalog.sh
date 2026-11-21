#!/usr/bin/env bash
# Builds the generated catalog site in several archetypes and layout variants
# and runs the boundary + axe tests on each.
# Usage: bash scripts/site/test-catalog.sh [archetype...]
set -uo pipefail

failed=()

ARCHETYPES=("$@")
[ ${#ARCHETYPES[@]} -gt 0 ] || ARCHETYPES=(default minimal elegant bold warm premium-dark corporate energetic)
NAVBARS=(simple centered topbar brand-bar dark-bar split floating minimal)
# v3.5: one navbar and one footer variant per archetype (all eight of each covered), the footer tone rotating too.
FOOTERS=(columns simple centered cta-band cards contact-first big-name rounded-card)
FOOTER_TONES=(auto light dark brand)
# v3.9: the blog's article layout, one per archetype (all seven covered).
ARTICLES=(toc classic cover split editorial author photo)
LANGS=(pl en uk)

for index in "${!ARCHETYPES[@]}"; do
  archetype="${ARCHETYPES[$index]}"
  navbar="${NAVBARS[$((index % ${#NAVBARS[@]}))]}"
  footer="${FOOTERS[$((index % ${#FOOTERS[@]}))]}"
  footer_tone="${FOOTER_TONES[$((index % ${#FOOTER_TONES[@]}))]}"
  article="${ARTICLES[$((index % ${#ARTICLES[@]}))]}"
  lang="${LANGS[$((index % 3))]}"
  # Cyrillic needs a font pair with Cyrillic glyphs; archetypes without one use Polish.
  if [ "$lang" = "uk" ] && [[ "$archetype" =~ ^(minimal|warm|energetic)$ ]]; then lang="pl"; fi

  dir=".generated/catalog-$archetype"
  echo "▶ catalog: archetype=$archetype navbar=$navbar footer=$footer ($footer_tone) article=$article lang=$lang"
  npx tsx scripts/site/make-catalog.ts --out "$dir" --archetype "$archetype" --navbar "$navbar" --footer "$footer" \
    --footer-tone "$footer_tone" --article "$article" --lang "$lang" >/dev/null \
    || { failed+=("$archetype (generator)"); continue; }
  SITE_SMOKE=1 SITE_DIR="$dir" npx playwright test site.spec --project=desktop || failed+=("$archetype")
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "✖ Catalog failed for: ${failed[*]}"
  exit 1
fi

echo "✔ Catalog passed for: ${ARCHETYPES[*]}"
