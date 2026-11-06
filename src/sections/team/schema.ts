import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Member = z.strictObject({
  id: Id,
  name: field(text(60), { label: "Imię i nazwisko", fieldType: "text", description: "Person's name." }),
  role: field(text(60), { label: "Rola", fieldType: "text", description: "Role or specialty, e.g. Salsa instructor." }),
  bio: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "One or two sentences about the person." }),
  photo: field(imageSlot({ aspect: [4, 5], minWidth: 480 }).optional(), {
    label: "Zdjęcie",
    fieldType: "image",
    description: "Portrait photo, cropped to 4:5 (circle in compact); at least 480px wide.",
  }),
});

export const team = defineSectionType({
  type: "team",
  label: "Zespół",
  description: "People of the business: instructors, specialists, staff.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    members: field(listWithIds(Member, 1, 12), { label: "Osoby", fieldType: "list", description: "1–12 people; 3, 4 or 6 look best." }),
  }),
  variants: {
    cards: {
      description: "Portrait cards in a grid: photo, name, role and bio.",
      uses: ["eyebrow", "description", "members.bio", "members.photo"],
    },
    compact: {
      description: "Round photos with name and role — many people in little space, no bios.",
      uses: ["eyebrow", "description", "members.photo"],
    },
  },
});
