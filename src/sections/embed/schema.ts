import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, multilineText, text } from "../../site/schema/fields";
import { EMBED_PROVIDERS, embedProvider } from "../../site/embeds";

const providers = EMBED_PROVIDERS.map((provider) => provider.label).join(", ");

export const embed = defineSectionType({
  type: "embed",
  label: "Mapa / rezerwacje / wideo",
  description: `Embedded map, booking calendar or video (${providers}). Loads only after a click (no third-party cookies before).`,
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90).optional(), { label: "Tytuł sekcji", fieldType: "text", description: "Optional headline, e.g. Book online." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short text next to or above the embed." }),
    url: field(
      z
        .string()
        .trim()
        .max(2048)
        .refine((value) => Boolean(embedProvider(value)), `Embed URL from an allowed provider: ${providers} (the provider's "embed" link).`),
      {
        label: "Adres do osadzenia",
        fieldType: "link",
        description:
          "Embed link: https://www.openstreetmap.org/export/embed.html?…, https://www.google.com/maps/embed?…, https://www.youtube.com/embed/<id>, https://player.vimeo.com/video/<id>, https://calendly.com/<user>[/<event>].",
      },
    ),
    frameTitle: field(text(80), { label: "Opis dla czytników", fieldType: "text", description: 'What the embed shows, for screen readers, e.g. "Map: ul. Długa 42, Kraków".' }),
  }),
  variants: {
    full: {
      description: "Header above a wide embed.",
      uses: ["eyebrow", "title", "description"],
    },
    split: {
      description: "Text on one side, the embed on the other (stacked on phones).",
      uses: ["eyebrow", "title", "description"],
      props: z.strictObject({
        embedPosition: z.enum(["left", "right"]).optional().describe("Embed side on wide screens."),
      }),
    },
  },
});
