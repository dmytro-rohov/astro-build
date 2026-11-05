import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, multilineText, text } from "../../site/schema/fields";

export const contact = defineSectionType({
  type: "contact",
  label: "Kontakt",
  description: "Contact form with the business contact details (email, phone, address come from business).",
  content: z.object({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(80).optional(), { label: "Tytuł", fieldType: "text", description: "Headline; a default from the language dictionary is used when empty." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short invitation to get in touch." }),
    showDetails: field(z.boolean().default(true), { label: "Pokaż dane kontaktowe", fieldType: "toggle", description: "Show email/phone/address from business next to the form." }),
  }),
  variants: {
    "form-split": {
      description: "Text and contact details on one side, form in a card on the other.",
      uses: ["eyebrow", "description", "showDetails"],
    },
    "form-centered": {
      description: "Narrow centered form with the contact details listed below.",
      uses: ["eyebrow", "description", "showDetails"],
    },
  },
});
