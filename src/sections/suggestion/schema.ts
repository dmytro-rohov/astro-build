import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, multilineText, text } from "../../site/schema/fields";

/**
 * A section the generator recommends but cannot build yet: the client has not given the information it needs
 * (reviews, numbers, steps, prices…). Shown on previews in its place, with why it is worth having, what is missing
 * and links to the client's panel to add the information or dismiss it. Never part of a published site: the
 * generator removes it before publishing.
 */
export const suggestion = defineSectionType({
  type: "suggestion",
  label: "Sugerowana sekcja",
  description: "Preview only, never published: a recommended section that cannot be built yet. Says why it is worth adding, what information is missing and links to add it or dismiss it. Not for site content.",
  content: z.strictObject({
    eyebrow: field(text(40), { label: "Nadtytuł", fieldType: "text", description: 'e.g. "Sugerowana sekcja".' }),
    title: field(text(80), { label: "Tytuł", fieldType: "text", description: "The section that is missing, e.g. Opinie klientów." }),
    reason: field(multilineText(400), { label: "Dlaczego warto", fieldType: "textarea", description: "Why this section helps to win clients." }),
    missingTitle: field(text(60), { label: "Nagłówek listy braków", fieldType: "text", description: 'e.g. "Czego potrzebujemy".' }),
    missing: field(z.array(text(160)).min(1).max(6), { label: "Czego brakuje", fieldType: "list", description: "The information needed to build the section." }),
    addAction: field(Action.optional(), { label: "Uzupełnij", fieldType: "link", description: "Link to the client's panel to add the information." }),
    dismissAction: field(Action.optional(), { label: "Odrzuć", fieldType: "link", description: "Link to the client's panel to dismiss the section." }),
  }),
  variants: {
    box: {
      description: "A dashed, softly striped box in the section's place with the reason, the missing information and two links.",
      uses: ["addAction", "dismissAction"],
    },
  },
});
