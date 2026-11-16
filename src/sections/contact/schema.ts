import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, multilineText, text } from "../../site/schema/fields";
import { EMBED_PROVIDERS, embedProvider } from "../../site/embeds";

const mapProviders = EMBED_PROVIDERS.filter((provider) => provider.kind === "map")
  .map((provider) => provider.label)
  .join(", ");

export const contact = defineSectionType({
  type: "contact",
  label: "Kontakt",
  description: "Contact form with the business contact details (email, phone, address and opening hours come from business).",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(80).optional(), { label: "Tytuł", fieldType: "text", description: "Headline; a default from the language dictionary is used when empty." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short invitation to get in touch." }),
    showDetails: field(z.boolean().default(true), { label: "Pokaż dane kontaktowe", fieldType: "toggle", description: "Show email/phone/address/hours from business next to the form." }),
    mapUrl: field(
      z
        .string()
        .trim()
        .max(2048)
        .refine((value) => embedProvider(value)?.kind === "map", `Map embed link from ${mapProviders} (the provider's "embed" link).`)
        .optional(),
      {
        label: "Mapa (link do osadzenia)",
        fieldType: "link",
        description:
          "Map of the place, loaded only after a click: https://www.openstreetmap.org/export/embed.html?bbox=…&marker=… or https://www.google.com/maps/embed?pb=…. " +
          "Without it the map variant shows an illustrated map with a directions link to the business address.",
      },
    ),
  }),
  variants: {
    "form-split": {
      description: "Classic two columns: heading and the contact details as an icon list on the left (stays in view), the form in a card on the right.",
      uses: ["eyebrow", "description", "showDetails"],
    },
    "form-centered": {
      description:
        "Centered heading above one wide card: the contact details on a brand-colored panel on the left, the form on the right. " +
        "Strong and compact; without details only the form card.",
      uses: ["eyebrow", "description", "showDetails"],
    },
    "info-columns": {
      description:
        "Centered heading and an open form (no card) on top, below a band of large icon columns — phone, e-mail, address, opening hours — over a strip of " +
        "the brand color. For businesses that are reached as often by phone or in person as by the form.",
      uses: ["eyebrow", "description", "showDetails"],
    },
    "big-card": {
      description:
        "One large rounded card on a soft brand-colored gradient: a big heading, text and a short details list on the left, the form on the right. " +
        "Friendly and airy, works as the whole contact page.",
      uses: ["eyebrow", "description", "showDetails"],
    },
    methods: {
      description:
        "Ways to reach the business as action cards on the left (call with the hours, write an e-mail, visit with directions), the form on a panel " +
        "on the right over a deep brand block reaching the screen edge. Best when phone and address matter (clinics, services, shops).",
      uses: ["eyebrow", "description", "showDetails"],
    },
    map: {
      description:
        "Form on the left, a tall map on the right with the address, hours and directions on a card over it. The map is mapUrl (OpenStreetMap / Google Maps " +
        "embed, loaded after a click) or an illustrated map; needs business.address or mapUrl. For places visitors come to.",
      uses: ["eyebrow", "description", "showDetails", "mapUrl"],
    },
  },
});
