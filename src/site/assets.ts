/**
 * Resolves "asset:<id>" references to images of the site being built.
 * Files come from SITE_DIR/assets (alias @site), metadata from assets.json.
 */
import type { ImageMetadata } from "astro";
import { assets } from "virtual:site";

const files = import.meta.glob<ImageMetadata>("@site/assets/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default",
});

const imagesByFile = new Map(
  Object.entries(files).map(([filePath, image]) => [filePath.split("/").pop() ?? filePath, image]),
);

export type ResolvedAsset = {
  image: ImageMetadata;
  alt: string;
};

/** Image + alt for "asset:<id>". The loader has already checked that it exists. */
export function getAsset(ref: string): ResolvedAsset {
  const id = ref.replace(/^asset:/, "");
  const entry = assets[id];
  const image = entry ? imagesByFile.get(entry.file) : undefined;

  if (!entry || !image) {
    throw new Error(`[site] Unknown asset "${ref}".`);
  }

  return { image, alt: entry.alt };
}
