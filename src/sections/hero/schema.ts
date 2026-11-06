import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Highlight = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short fact, e.g. "15 lat", "4,9/5".' }),
  label: field(text(40), { label: "Opis", fieldType: "text", description: "What the value means." }),
});

export const hero = defineSectionType({
  type: "hero",
  label: "Sekcja powitalna",
  description: "First section of a page: main headline, short pitch and call to action.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), {
      label: "Nadtytuł",
      fieldType: "text",
      description: "Short label above the headline, e.g. the business category. 1–4 words.",
    }),
    title: field(text(80), {
      label: "Nagłówek",
      fieldType: "text",
      description: "Main headline (h1 on the home page). Clear benefit, max ~8 words.",
    }),
    description: field(multilineText(240).optional(), {
      label: "Opis",
      fieldType: "textarea",
      description: "One or two sentences that support the headline.",
    }),
    primaryAction: field(Action.optional(), {
      label: "Główny przycisk",
      fieldType: "link",
      description: "Main call to action, e.g. book a visit.",
    }),
    secondaryAction: field(Action.optional(), {
      label: "Drugi link",
      fieldType: "link",
      description: "Secondary, less prominent link.",
    }),
    image: field(imageSlot({ aspect: [4, 3], minWidth: 960 }).optional(), {
      label: "Zdjęcie",
      fieldType: "image",
      description: "Hero image, cropped to 4:3 around the focal point; at least 960px wide.",
    }),
    highlights: field(listWithIds(Highlight, 1, 3).optional(), {
      label: "Wyróżniki",
      fieldType: "list",
      description: "Up to 3 short facts shown under the actions (minimal and panel variants).",
    }),
  }),
  accentTone: true,
  variants: {
    "split-image": {
      description: "Text on the left, image on the right; single column on phones. Without an image the text is full width.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
    centered: {
      description: "Large centered headline and actions, no image. Calm and typographic.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction"],
    },
    "cover-image": {
      description: "Full-width photo behind the text with a dark overlay — bold and atmospheric. Needs an image.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
    panel: {
      description: "Edge-to-edge split: text on a colored panel, the photo filling the other half up to the screen edge. Needs an image.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image", "highlights"],
      props: z.strictObject({ imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens.") }),
    },
    minimal: {
      description: "Oversized left-aligned headline, a thin rule and key facts — editorial and confident, no image.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "highlights"],
    },
  },
});
