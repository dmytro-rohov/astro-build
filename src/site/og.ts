/**
 * Open Graph image URL for a page: page.seo.image, then meta.seo.image
 * (cropped to 1200×630 at build time), then the generated /og-cover.jpg.
 */
import { getImage } from "astro:assets";
import { site } from "virtual:site";
import { getAsset } from "@/site/assets";
import type { Page } from "@/site/schema/site";
import { focalToPosition } from "@/site/focal";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export async function ogImageFor(page?: Page): Promise<string> {
  const ref = page?.seo.image ?? site.meta.seo.image;

  if (!ref) {
    return "/og-cover.jpg";
  }

  const { image, focal } = getAsset(ref);
  const result = await getImage({
    src: image,
    ...OG_SIZE,
    fit: "cover",
    position: focalToPosition(focal),
    format: "jpg",
  });

  return result.src;
}
