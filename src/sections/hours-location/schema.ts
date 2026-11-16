import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, HttpsUrl, imageSlot, multilineText, text } from "../../site/schema/fields";
import { EMBED_PROVIDERS, embedProvider } from "../../site/embeds";

const mapProviders = EMBED_PROVIDERS.filter((provider) => provider.kind === "map").map((provider) => provider.label).join(" or ");

export const hoursLocation = defineSectionType({
  type: "hours-location",
  label: "Godziny i dojazd",
  description:
    "Opening hours, address and phone of the place. Data comes from business (hours, address, phone); " +
    "pick a variant by what the business has: hours and an address, hours only (online / mobile services) or an address only.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90).optional(), { label: "Tytuł", fieldType: "text", description: "Headline; a default from the dictionary is used when empty." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "e.g. parking or how to find the entrance." }),
    mapUrl: field(HttpsUrl.optional(), { label: "Link do mapy", fieldType: "link", description: "Google Maps / OpenStreetMap link to the place." }),
    mapEmbed: field(
      z
        .string()
        .trim()
        .max(2048)
        .refine((value) => embedProvider(value)?.kind === "map", `Map embed link from ${mapProviders}.`)
        .optional(),
      {
        label: "Mapa do osadzenia",
        fieldType: "link",
        description:
          'Map shown by the "map" variant after a click: https://www.openstreetmap.org/export/embed.html?bbox=…&marker=… or https://www.google.com/maps/embed?pb=… ' +
          "(the provider's embed / share link). Leave empty when unsure — a drawn map with the address is shown instead.",
      },
    ),
    image: field(imageSlot({ aspect: [4, 3], minWidth: 960 }).optional(), {
      label: "Zdjęcie miejsca",
      fieldType: "image",
      description: "Photo of the place (4:3): the shop front, the entrance or the room.",
    }),
    showPhone: field(z.boolean().default(true), { label: "Pokaż telefon", fieldType: "toggle", description: "Show the phone number from business." }),
  }),
  variants: {
    card: {
      description:
        "Two cards side by side: opening hours (days with the same hours grouped, e.g. Mon–Fri) and the address with phone, " +
        "directions and map buttons. Universal and calm; one card when the business has only hours or only an address.",
      uses: ["eyebrow", "description", "mapUrl", "showPhone"],
    },
    compact: {
      description:
        "Slim contact bar without a visible title: grouped hours, address and phone in one framed row (stacked on phones). " +
        "Fits between other sections or at the end of a page; works with any part of the data.",
      uses: ["mapUrl", "showPhone"],
    },
    today: {
      description:
        "Centered 'door sign' card: the whole week day by day with today's row highlighted and a live status on top " +
        "('Open now · until 18:00' / 'Closed · opens tomorrow at 9:00', computed in the visitor's browser in the business time zone), " +
        "address and phone below. For shops, cafés, clinics with regular hours; needs business.hours (without JavaScript the plain week is shown).",
      uses: ["eyebrow", "description", "mapUrl", "showPhone"],
    },
    map: {
      description:
        "Location first: a large map (loads only after a click) with a side panel of address, directions button, phone and grouped hours. " +
        "Needs business.address; the map comes from mapEmbed (OpenStreetMap / Google Maps embed link), without it a drawn map with a pin " +
        "and the street is shown. Without an address only the panel is shown.",
      uses: ["eyebrow", "description", "mapUrl", "mapEmbed", "showPhone"],
    },
    "image-side": {
      description:
        "Photo of the place (image: shop front, salon, studio) with a card of hours, address and the section title overlapping it. " +
        "Warm and inviting, for cafés, bakeries, salons; without a photo the card sits on a brand-colored panel.",
      uses: ["eyebrow", "description", "mapUrl", "image", "showPhone"],
      props: z.strictObject({ imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens (default left).") }),
    },
    "week-strip": {
      description:
        "Light band: seven day tiles in a row (open–close times, closed days muted, today marked in the browser with a live status above) " +
        "and the address and phone in one line below. Shows the whole week at a glance, best when hours differ by day; needs business.hours.",
      uses: ["eyebrow", "description", "mapUrl", "showPhone"],
    },
  },
});
