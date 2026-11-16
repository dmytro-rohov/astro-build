import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Photo = z.strictObject({
  id: Id,
  image: field(imageSlot({ aspect: [4, 3], minWidth: 800 }), {
    label: "Zdjęcie",
    fieldType: "image",
    description: "Photo; landscape suits every layout, portrait photos are welcome (each layout crops around the focal point).",
  }),
  caption: field(text(100).optional(), { label: "Podpis", fieldType: "text", description: "Optional short caption." }),
  title: field(text(60).optional(), { label: "Tytuł", fieldType: "text", description: "Optional heading for the photo, e.g. the room, project or service it shows." }),
  text: field(multilineText(200).optional(), { label: "Opis", fieldType: "textarea", description: "Optional sentence or two about the photo." }),
  link: field(Action.optional(), {
    label: "Link",
    fieldType: "link",
    description: 'Optional link about the photo, e.g. { "label": "Zobacz sesję", "href": "/portfolio" }.',
  }),
});

/** Full-screen viewer, shared by every variant (on unless set to false). */
const LightboxProps = z.strictObject({
  lightbox: z.boolean().optional().describe("Open photos in a full-screen viewer with arrows and captions (default true)."),
});

export const gallery = defineSectionType({
  type: "gallery",
  label: "Galeria",
  description: "Photos of the place, work or products.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    items: field(listWithIds(Photo, 2, 24), { label: "Zdjęcia", fieldType: "list", description: "2–24 photos." }),
    link: field(Action.optional(), {
      label: "Link do galerii",
      fieldType: "link",
      description: 'Optional link to more photos, e.g. { "label": "Więcej na Instagramie", "href": "https://instagram.com/…" }.',
    }),
  }),
  variants: {
    grid: {
      description:
        "Even grid of 4:3 photos with captions below — calm and orderly, like a contact sheet; any number of photos " +
        "(2–24; 3, 6 or 8 fill full rows), mixed orientation is fine.",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
    mosaic: {
      description:
        "The first photo large, the rest in smaller tiles around it, closing a gap-free rectangle, captions on the photos — " +
        "magazine-like; for 3–12 photos, the strongest (ideally landscape) first.",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
    slider: {
      description:
        "Title with arrows on the right; the photos in pages of up to five tall, wide and small tiles, one page at a time " +
        "with dash pagination — compact for many photos (6–24) in little height; 2–5 photos make one page without controls.",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
    masonry: {
      description:
        "Columns of photos at different heights with captions on the photos (columns end level) — lively, Pinterest-like; " +
        "best for 5–24 photos, portrait photos stay tall.",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
    polaroid: {
      description:
        "Slightly tilted instant prints with white frames scattered over a two-tone band (the title on the brand color), " +
        "captions written on the frames — playful and personal; for 3–10 photos of people and moments (weddings, events, " +
        "kids, cafés).",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
    checkerboard: {
      description:
        "Square photos alternating with text tiles in a checkerboard: each photo's title (else its caption), text and link " +
        "on the tile beside it — for 2–8 photos that each need a few words (rooms, services, projects); without them the " +
        "tile shows the photo's alt text.",
      uses: ["eyebrow", "description", "items.caption", "items.title", "items.text", "items.link", "link"],
      props: LightboxProps,
    },
    explore: {
      description:
        "A tall framed panel with the eyebrow (else \"Galeria\") set vertically beside a staggered grid of portrait tiles — " +
        "bold, editorial look (fashion, beauty, studios); for 3–12 photos; with `link` the panel leads to more photos.",
      uses: ["eyebrow", "description", "items.caption", "link"],
      props: LightboxProps,
    },
  },
});
