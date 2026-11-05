import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, AssetRef, field, multilineText, text } from "../../site/schema/fields";

export const hero = defineSectionType({
  type: "hero",
  label: "Sekcja powitalna",
  description: "First section of a page: main headline, short pitch and call to action.",
  content: z.object({
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
    image: field(AssetRef.optional(), {
      label: "Zdjęcie",
      fieldType: "image",
      description: "Hero image (landscape 4:3).",
    }),
  }),
  variants: {
    "split-image": {
      description: "Text on the left, image on the right; single column on phones. Without an image the text is full width.",
      uses: ["eyebrow", "description", "primaryAction", "secondaryAction", "image"],
    },
  },
});
