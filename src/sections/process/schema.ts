import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Step = z.strictObject({
  id: Id,
  title: field(text(60), { label: "Krok", fieldType: "text", description: "Step name, e.g. Free consultation." }),
  description: field(multilineText(240), { label: "Opis", fieldType: "textarea", description: "What happens in this step." }),
  icon: field(z.enum(ICON_NAMES).optional(), { label: "Ikona", fieldType: "select", description: "Icon from the built-in set (steps are numbered without one)." }),
});

export const processSteps = defineSectionType({
  type: "process",
  label: "Jak działamy",
  description: "Steps of working with the business: from first contact to the result.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline, e.g. How it works." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    steps: field(listWithIds(Step, 2, 8), { label: "Kroki", fieldType: "list", description: "2–8 steps in order; 3 or 4 read best." }),
  }),
  variants: {
    steps: {
      description: "Numbered steps side by side (stacked on phones).",
      uses: ["eyebrow", "description", "steps.icon"],
    },
    timeline: {
      description: "Vertical timeline with numbers on a line — good for longer descriptions.",
      uses: ["eyebrow", "description", "steps.icon"],
    },
  },
});
