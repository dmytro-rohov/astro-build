/**
 * Building blocks for site.json schemas.
 *
 * Everything in site.json is untrusted input (it comes from an AI or a client),
 * so every field has hard limits and links accept only safe protocols.
 * Pure Zod — no Astro imports — so the schema also runs in Node scripts and Vitest.
 */
import { z } from "zod";

/** How a field is edited in the future site editor. */
export type FieldType = "text" | "textarea" | "richtext-lite" | "image" | "link" | "list" | "select" | "toggle";

export type FieldMeta = {
  /** Field label shown in the editor (Polish). */
  label: string;
  fieldType: FieldType;
  /** False for technical fields the client should not change. */
  editable?: boolean;
};

/** Attaches editor metadata and an AI-facing description to a schema. */
export function field<T extends z.ZodType>(schema: T, meta: FieldMeta & { description: string }): T {
  const { description, ...editor } = meta;
  return schema.describe(description).meta({ editor: { editable: true, ...editor } }) as T;
}

/**
 * Control characters (except tab and line breaks), zero-width space, LRM/RLM and
 * bidi overrides/isolates: invisible, break HTML parsing or spoof text direction.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const UNSAFE_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
const UNSAFE_MESSAGE = "Contains invisible control or text-direction characters — remove them.";

/** Plain single-line text with a character limit. Line breaks are not allowed. */
export const text = (max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[\r\n]/.test(value), "Must be a single line (no line breaks).")
    .refine((value) => !UNSAFE_CHARACTERS.test(value), UNSAFE_MESSAGE);

/** Multi-line plain text with a character limit. */
export const multilineText = (max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !UNSAFE_CHARACTERS.test(value), UNSAFE_MESSAGE);

/** Days of the week (business hours, class schedules). */
export const DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;
export type Day = (typeof DAYS)[number];

/** Time of day "HH:MM" (24 h). */
export const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time as "HH:MM", e.g. "09:00".');

/** Stable identifier for pages, sections and list items (also used as HTML id). */
export const Id = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,47}$/, "Use lowercase letters, digits and dashes, starting with a letter (max 48).");

/** Page path: "/" or "/segment" or "/a/b" — lowercase, no trailing slash. */
export const Slug = z
  .string()
  .regex(/^\/$|^(\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/, 'Use "/" or lowercase paths like "/about-us" (no trailing slash).');

const SAFE_PROTOCOLS = ["https:", "mailto:", "tel:"];

/**
 * Link target. Allowed: https://, mailto:, tel:, site paths ("/contact"),
 * paths with a hash ("/#features") and plain hashes ("#features").
 * Everything else (javascript:, data:, http:, protocol-relative //) is rejected.
 */
export const SafeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    // Site path: no "//" or "/\" (browsers read a backslash as a slash → another host), no spaces.
    if (/^\/(?![/\\])[^\\\s]*$/.test(value) || /^#[\w-]+$/.test(value)) {
      return true;
    }

    try {
      return SAFE_PROTOCOLS.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Links must be https://, mailto:, tel:, a site path (/page) or an anchor (#id).");

/** External https URL only (profiles in sameAs, maps links…). */
export const HttpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be an https:// URL.");

/** Reference to an image in the site's assets/assets.json, e.g. "asset:hero". */
export const AssetRef = z.string().regex(/^asset:[a-z][a-z0-9-]{0,47}$/, 'Use "asset:<id>", e.g. "asset:hero".');

/** Requirements of an image slot: the image is cropped to `aspect` (focal point aware). */
export type ImageSlot = {
  /** Width : height, e.g. [4, 3]. Omit for "any proportions" (logos). */
  aspect?: readonly [number, number];
  /** Minimum width in px of the cropped image, so it stays sharp. */
  minWidth: number;
  /** Allow SVG files (logos). */
  svg?: boolean;
};

/** Asset reference for an image slot; the loader checks size and proportions. */
export function imageSlot(slot: ImageSlot) {
  const ratio = slot.aspect ? `${slot.aspect[0]}:${slot.aspect[1]}` : "any";
  return AssetRef.describe(`Image (cropped to ${ratio}, at least ${slot.minWidth}px wide).`).meta({ imageSlot: slot });
}

/**
 * Rich text "lite": paragraphs separated by a blank line, **bold**, *italic*
 * and [links](/path). No HTML — any "<" is rejected, and links must be safe.
 */
export const richTextLite = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>]/.test(value), "HTML is not allowed. Use **bold**, *italic* and [text](/link).")
    .refine((value) => !UNSAFE_CHARACTERS.test(value), UNSAFE_MESSAGE)
    .refine(
      (value) =>
        [...value.matchAll(/\[[^\]]*\]\(((?:[^()\s]|\([^()\s]*\))*)\)/g)].every((match) => SafeUrl.safeParse(match[1]).success),
      "Every [text](link) must use https://, mailto:, tel:, a site path or an anchor.",
    );

/** Button or link: visible label + safe target. */
export const Action = z.strictObject({
  label: text(30),
  href: SafeUrl,
});

/** Adds unique-id validation to a list of items that each have an `id`. */
export function listWithIds<T extends z.ZodObject<{ id: typeof Id }>>(item: T, min: number, max: number) {
  return z
    .array(item)
    .min(min)
    .max(max)
    .superRefine((items, context) => {
      const seen = new Set<string>();

      items.forEach((entry, index) => {
        const id = (entry as { id: string }).id;

        if (seen.has(id)) {
          context.addIssue({ code: "custom", message: `Duplicate id "${id}" in this list.`, path: [index, "id"] });
        }

        seen.add(id);
      });
    });
}
