import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Plan = z.strictObject({
  id: Id,
  name: field(text(40), { label: "Nazwa pakietu", fieldType: "text", description: "Plan or package name." }),
  price: field(text(24), { label: "Cena", fieldType: "text", description: 'e.g. "199 zł".' }),
  period: field(text(24).optional(), { label: "Okres", fieldType: "text", description: 'e.g. "/ miesiąc", "za wizytę".' }),
  description: field(text(160).optional(), { label: "Opis", fieldType: "text", description: "Who it is for, one sentence." }),
  features: field(z.array(text(80)).max(10).default([]), {
    label: "Co zawiera",
    fieldType: "list",
    description: "Up to 10 short points. Word a feature the same way in every plan that has it (the table variant compares plans by these texts).",
  }),
  action: field(Action.optional(), { label: "Przycisk", fieldType: "link", description: "Call to action for this plan." }),
  highlighted: field(z.boolean().optional(), { label: "Wyróżniony", fieldType: "toggle", description: "Mark as the most popular plan (at most one)." }),
});

export const pricing = defineSectionType({
  type: "pricing",
  label: "Cennik",
  description: "Price plans or packages.",
  content: z.strictObject({
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
      description: "Plans as rows in one narrow column: name and description, price on the right, features below in two columns.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
    "featured-center": {
      description:
        "Three tiles, the recommended plan in the middle: larger, taller, on the brand color with a badge; the plans beside it are quieter. " +
        "Best for 3 plans (basic – most chosen – pro), also 2 or 4. The highlighted plan is moved to the middle (without one, the middle plan is featured).",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
    table: {
      description:
        "Comparison table: plans as columns with price and button, features as rows with a check or a dash. Rows are the union of the plans' feature " +
        "texts — write a feature with the SAME words in every plan that has it, and list shared features in every plan. For 2–4 plans that differ by features.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
    split: {
      description:
        "Two columns: title, intro and note on the left; plans as stacked rows on the right with the price aligned right and features as a short inline list. " +
        "For 1–4 plans or packages with few features.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
    minimal: {
      description:
        "Typographic columns without cards, divided by thin rules: big prices, quiet feature lists, the highlighted plan marked with an accent line. " +
        "Elegant, for premium or minimal brands; 2–4 plans.",
      uses: ["eyebrow", "description", "plans.period", "plans.description", "plans.features", "plans.action", "plans.highlighted", "note"],
    },
  },
});
