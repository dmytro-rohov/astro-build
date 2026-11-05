/**
 * assets/assets.json — images of a site, referenced from site.json as "asset:<id>".
 * Stage 2 extends entries with aspect ratio, minimum size and focal point.
 */
import { z } from "zod";
import { text } from "./fields";

export const AssetEntry = z.strictObject({
  file: z
    .string()
    // Lowercase only: the build resolves files case-sensitively (Hero.JPG would pass here and fail there).
    .regex(/^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|avif|svg)$/, "Lowercase file name inside assets/, e.g. hero.jpg (no folders, lowercase extension)."),
  alt: text(200, 0).describe('Image description for screen readers; "" only for decorative images.'),
  focal: z
    .strictObject({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional()
    .describe("Focal point in % (0–100) kept visible when the image is cropped. Default: center."),
});

export const AssetsSchema = z.record(z.string().regex(/^[a-z][a-z0-9-]{0,47}$/, "Asset id: lowercase, digits, dashes."), AssetEntry);

export type Assets = z.infer<typeof AssetsSchema>;
