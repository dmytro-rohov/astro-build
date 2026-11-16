import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Highlight = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short fact, e.g. "24 h", "4,9/5", "0 zł".' }),
  label: field(text(48), { label: "Opis", fieldType: "text", description: 'What the value means, e.g. "na wycenę naprawy".' }),
});

export const cta = defineSectionType({
  type: "cta",
  label: "Wezwanie do działania",
  description: "Short block that asks the visitor to take one action (call, book, write).",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(80), { label: "Tytuł", fieldType: "text", description: "Action-oriented headline." }),
    description: field(multilineText(220).optional(), { label: "Opis", fieldType: "textarea", description: "Why act now, one or two sentences." }),
    primaryAction: field(Action, { label: "Główny przycisk", fieldType: "link", description: "The action." }),
    secondaryAction: field(Action.optional(), { label: "Drugi link", fieldType: "link", description: "Optional secondary link." }),
    highlights: field(listWithIds(Highlight, 1, 3).optional(), {
      label: "Wyróżniki",
      fieldType: "list",
      description: "Up to 3 short facts that remove doubt (response time, rating, free quote), on floating cards in gradient-cards.",
    }),
    images: field(z.array(imageSlot({ aspect: [1, 1], minWidth: 240 })).min(1).max(8).optional(), {
      label: "Zdjęcia wokół",
      fieldType: "list",
      description:
        "Up to 8 square photos from the client (happy customers, students, the team — never stock), shown as small decorative circles around the card in faces.",
    }),
  }),
  accentTone: true,
  variants: {
    boxed: {
      description: "Centered content in a highlighted box.",
      uses: ["eyebrow", "description", "secondaryAction"],
    },
    banner: {
      description: "Full-width band: text on the left, actions on the right.",
      uses: ["eyebrow", "description", "secondaryAction"],
    },
    rings: {
      description:
        "Brand-colored card with concentric circles on its right side, text and two buttons on the left — bold and confident; " +
        "good for a phone call or booking on business, auto and service sites.",
      uses: ["eyebrow", "description", "secondaryAction"],
    },
    "gradient-cards": {
      description:
        "Gradient band with a fine wave pattern, text on the left and up to 3 short facts on floating cards on the right — " +
        "modern and persuasive; best with highlights (e.g. reply in 24 h, 4.9 rating, free quote).",
      uses: ["eyebrow", "description", "secondaryAction", "highlights"],
    },
    faces: {
      description:
        "Light centered card with round photos of real clients or the team floating around it (decorative circles without photos) — " +
        "warm and personal; good for schools, studios, clinics and communities.",
      uses: ["eyebrow", "description", "secondaryAction", "images"],
    },
    "band-card": {
      description:
        "Full-width brand-colored band with a centered light card and a spaced uppercase title — calm and clear; " +
        "works for short titles (2–6 words) such as sign-ups, bookings or a free consultation.",
      uses: ["eyebrow", "description", "secondaryAction"],
    },
  },
});
