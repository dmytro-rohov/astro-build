/**
 * assets/assets.json — images of a site, referenced from site.json as "asset:<id>".
 * Stage 2 extends entries with aspect ratio, minimum size and focal point.
 */
import { z } from "zod";
import { text } from "./fields";

export const AssetEntry = z.object({
  file: z
    .string()
    .regex(/^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|avif|svg)$/i, "File name inside assets/, e.g. hero.jpg (no folders)."),
  alt: text(200, 0).describe('Image description for screen readers; "" only for decorative images.'),
});

export const AssetsSchema = z.record(z.string().regex(/^[a-z][a-z0-9-]{0,47}$/, "Asset id: lowercase, digits, dashes."), AssetEntry);

export type Assets = z.infer<typeof AssetsSchema>;
