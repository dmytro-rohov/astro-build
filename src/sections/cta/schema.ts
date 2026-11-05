import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, multilineText, text } from "../../site/schema/fields";

export const cta = defineSectionType({
  type: "cta",
  label: "Wezwanie do działania",
  description: "Short block that asks the visitor to take one action (call, book, write).",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(80), { label: "Tytuł", fieldType: "text", description: "Action-oriented headline." }),
    description: field(multilineText(220), { label: "Opis", fieldType: "textarea", description: "Why act now, one or two sentences." }),
    primaryAction: field(Action, { label: "Główny przycisk", fieldType: "link", description: "The action." }),
    secondaryAction: field(Action.optional(), { label: "Drugi link", fieldType: "link", description: "Optional secondary link." }),
  }),
  accentTone: true,
  variants: {
    boxed: {
      description: "Centered content in a highlighted box.",
      uses: ["eyebrow", "secondaryAction"],
    },
    banner: {
      description: "Full-width band: text on the left, actions on the right.",
      uses: ["eyebrow", "secondaryAction"],
    },
  },
});
