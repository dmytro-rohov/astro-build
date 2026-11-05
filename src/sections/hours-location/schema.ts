import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, HttpsUrl, multilineText, text } from "../../site/schema/fields";

export const hoursLocation = defineSectionType({
  type: "hours-location",
  label: "Godziny i dojazd",
  description: "Opening hours, address and a map link. Data comes from business (hours, address, phone).",
  content: z.object({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90).optional(), { label: "Tytuł", fieldType: "text", description: "Headline; a default from the dictionary is used when empty." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "e.g. parking or how to find the entrance." }),
    mapUrl: field(HttpsUrl.optional(), { label: "Link do mapy", fieldType: "link", description: "Google Maps / OpenStreetMap link to the place." }),
    showPhone: field(z.boolean().default(true), { label: "Pokaż telefon", fieldType: "toggle", description: "Show the phone number from business." }),
  }),
  variants: {
    card: {
      description: "Two cards: opening hours table and address with a map button.",
      uses: ["eyebrow", "description", "mapUrl", "showPhone"],
    },
    compact: {
      description: "One band with hours and address side by side.",
      uses: ["mapUrl", "showPhone"],
    },
  },
});
