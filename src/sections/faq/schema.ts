import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, richTextLite, text } from "../../site/schema/fields";

const FaqItem = z.strictObject({
  id: Id,
  question: field(text(140), { label: "Pytanie", fieldType: "text", description: "Question as a visitor would ask it." }),
  answer: field(richTextLite(800), { label: "Odpowiedź", fieldType: "richtext-lite", description: "Clear answer; **bold**, *italic* and [links](/path) allowed." }),
});

export const faq = defineSectionType({
  type: "faq",
  label: "Najczęstsze pytania",
  description: "Questions and answers. Also published as FAQPage structured data.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    items: field(listWithIds(FaqItem, 1, 20), { label: "Pytania", fieldType: "list", description: "1–20 questions." }),
  }),
  variants: {
    "two-column": {
      description: "All questions and answers visible in two columns — good for short answers.",
      uses: ["eyebrow", "description"],
    },
    accordion: {
      description: "Expandable questions (native details/summary, works without JavaScript).",
      uses: ["eyebrow", "description"],
      props: z.strictObject({
        style: z.enum(["default", "boxed", "minimal"]).optional().describe("Accordion look."),
        openFirst: z.boolean().optional().describe("Open the first question by default."),
      }),
    },
  },
});
