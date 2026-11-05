import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Photo = z.strictObject({
  id: Id,
  image: field(imageSlot({ aspect: [4, 3], minWidth: 800 }), { label: "Zdjęcie", fieldType: "image", description: "Photo (cropped to 4:3)." }),
  caption: field(text(100).optional(), { label: "Podpis", fieldType: "text", description: "Optional short caption." }),
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
  }),
  variants: {
    grid: {
      description: "Even grid of photos with captions below.",
      uses: ["eyebrow", "description", "items.caption"],
    },
    mosaic: {
      description: "First photo large, the rest smaller around it.",
      uses: ["eyebrow", "description", "items.caption"],
    },
  },
});
