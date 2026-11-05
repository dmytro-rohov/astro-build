import { z } from "zod";
import { iconNames } from "../../design-system/sprite.generated";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const FeatureItem = z.object({
  id: Id,
  eyebrow: field(text(24).optional(), { label: "Etykieta", fieldType: "text", description: "Tiny label above the item title." }),
  title: field(text(60), { label: "Tytuł", fieldType: "text", description: "Feature or benefit name." }),
  description: field(multilineText(200), { label: "Opis", fieldType: "textarea", description: "One or two sentences." }),
  icon: field(z.enum(iconNames).optional(), { label: "Ikona", fieldType: "select", description: "Icon from the built-in set." }),
});

export const features = defineSectionType({
  type: "features",
  label: "Zalety / funkcje",
  description: "Grid of benefits, features or reasons to choose the business.",
  content: z.object({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    items: field(listWithIds(FeatureItem, 2, 12), { label: "Elementy", fieldType: "list", description: "2–12 features; 3 or 6 look best." }),
  }),
  variants: {
    "cards-grid": {
      description: "Cards in a responsive grid (1 column on phones).",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon"],
      props: z.object({
        columns: z.enum(["2", "3", "4"]).optional().describe("Number of columns on wide screens."),
      }),
    },
  },
});
