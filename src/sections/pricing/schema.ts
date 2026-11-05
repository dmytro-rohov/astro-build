import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Plan = z.object({
  id: Id,
  name: field(text(40), { label: "Nazwa pakietu", fieldType: "text", description: "Plan or package name." }),
  price: field(text(24), { label: "Cena", fieldType: "text", description: 'e.g. "199 zł".' }),
  period: field(text(24).optional(), { label: "Okres", fieldType: "text", description: 'e.g. "/ miesiąc", "za wizytę".' }),
  description: field(text(160).optional(), { label: "Opis", fieldType: "text", description: "Who it is for, one sentence." }),
  features: field(z.array(text(80)).max(10).default([]), { label: "Co zawiera", fieldType: "list", description: "Up to 10 short points." }),
  action: field(Action.optional(), { label: "Przycisk", fieldType: "link", description: "Call to action for this plan." }),
  highlighted: field(z.boolean().optional(), { label: "Wyróżniony", fieldType: "toggle", description: "Mark as the most popular plan (at most one)." }),
});

export const pricing = defineSectionType({
  type: "pricing",
  label: "Cennik",
  description: "Price plans or packages.",
  content: z.object({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    plans: field(
      listWithIds(Plan, 1, 4).refine((plans) => plans.filter((plan) => plan.highlighted).length <= 1, "At most one plan can be highlighted."),
      { label: "Pakiety", fieldType: "list", description: "1–4 plans." },
    ),
    note: field(text(240).optional(), { label: "Uwaga", fieldType: "text", description: 'Footnote, e.g. "Ceny brutto."' }),
  }),
  variants: {
    cards: {
      description: "Plans side by side as cards; the highlighted one stands out.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
    compact: {
      description: "Plans as rows: name and description, price on the right, features below.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "note"],
    },
  },
});
