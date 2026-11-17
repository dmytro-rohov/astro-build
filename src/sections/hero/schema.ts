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
      description: "Up to 3 short facts: under the actions (minimal, panel), on the card over the photo (title-below), in the bottom bar (bold-type).",
    }),
    word: field(text(12).optional(), {
      label: "Wielkie słowo",
      fieldType: "text",
      description: 'One short word set huge across the hero in giant-word, e.g. "BOKS", "KAWA", "TANIEC" — 3–8 letters, the essence of the business.',
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
    "title-below": {
      description:
        "Photo first across the page with a floating card of up to 3 key facts and the buttons; the big headline and the text sit " +
        "under the photo — calm and spacious; good for real estate, architecture, interiors, travel and hotels. Needs an image " +
        "(without one a brand-colored band takes its place); best with highlights and a headline of up to ~7 words.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image", "highlights"],
    },
    band: {
      description:
        "Centered headline, text and buttons above a wide photo band reaching the screen edges — open and welcoming; good for " +
        "hotels, restaurants, travel, real estate and schools. Needs a wide, calm image (a place, a landscape, an interior); " +
        "without one it is a centered headline.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
    "offset-card": {
      description:
        "Large headline on top, a wide photo under it and the text with the buttons on a card cut into the photo's corner — " +
        "architectural and editorial; good for architects, interior designers, construction, photographers and law firms. " +
        "Needs an image (without one the headline and the card sit side by side); headline up to ~7 words.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
    "rounded-card": {
      description:
        "The hero is a large rounded card inset from the screen edges: the photo fills it and a frosted arch rises behind the " +
        "centered headline, text and buttons — soft and premium; good for travel, spa, wellness, wedding venues and hotels. " +
        "Works without an image (a brand gradient card); headline up to ~6 words.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
    "bold-type": {
      description:
        "Huge uppercase headline across the page with the main button as a pill in its last line, the text beside it, a photo " +
        "card and up to 3 facts in a bar below — loud and confident; good for gyms, sport, events, travel and youth brands. " +
        "A short headline (3–6 words) works best; image and highlights are optional.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image", "highlights"],
    },
    "giant-word": {
      description:
        "One oversized word (word, else the eyebrow) across the page with the photo standing among its letters, the headline, " +
        "text and buttons centered below — a dramatic poster; good for boxing and gyms, dance, barbers, tattoo, cafes and events. " +
        "Needs word (3–8 letters) and an image with the subject in the middle (a person, a cup, a tool).",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image", "word"],
    },
  },
});
