import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, richTextLite, text } from "../../site/schema/fields";

const Highlight = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short number or fact, e.g. "15 lat", "2000+".' }),
  label: field(text(48), { label: "Opis", fieldType: "text", description: 'What the value means, e.g. "doświadczenia".' }),
});

export const about = defineSectionType({
  type: "about",
  label: "O nas",
  description: "Story of the business: who they are, why they do it, what makes them different.",
  accentTone: true,
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    body: field(richTextLite(1500), { label: "Treść", fieldType: "richtext-lite", description: "1–3 short paragraphs (blank line between paragraphs)." }),
    image: field(imageSlot({ aspect: [4, 5], minWidth: 720 }).optional(), { label: "Zdjęcie", fieldType: "image", description: "Portrait photo (4:5) of the team, owner or place." }),
    highlights: field(listWithIds(Highlight, 1, 4).optional(), { label: "Liczby", fieldType: "list", description: "Up to 4 short facts (years, clients, awards)." }),
    action: field(Action.optional(), { label: "Przycisk", fieldType: "link", description: "Optional link, e.g. to the contact page." }),
  }),
  variants: {
    "image-side": {
      description: "Text next to a portrait photo; facts in a row below the text.",
      uses: ["eyebrow", "image", "highlights", "action"],
      props: z.strictObject({ imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens.") }),
    },
    centered: {
      description: "Centered narrow text column with facts in a row — no photo.",
      uses: ["eyebrow", "highlights", "action"],
    },
  },
});
