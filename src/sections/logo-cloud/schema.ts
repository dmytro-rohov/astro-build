import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { field, HttpsUrl, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Logo = z.strictObject({
  id: Id,
  name: field(text(60), { label: "Nazwa", fieldType: "text", description: "Brand or partner name (alt text of the logo)." }),
  logo: field(imageSlot({ minWidth: 120, svg: true }), {
    label: "Logo",
    fieldType: "image",
    description: "Logo file (SVG preferred, or PNG with transparent background, at least 120px wide).",
  }),
  href: field(HttpsUrl.optional(), { label: "Link", fieldType: "link", description: "Optional https link to the partner." }),
});

export const logoCloud = defineSectionType({
  type: "logo-cloud",
  label: "Loga partnerów",
  description: "Logos of clients, partners, brands used or certificates.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90).optional(), { label: "Tytuł sekcji", fieldType: "text", description: 'Optional headline, e.g. "Trusted by".' }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    items: field(listWithIds(Logo, 2, 24), { label: "Loga", fieldType: "list", description: "2–24 logos." }),
  }),
  variants: {
    row: {
      description: "Logos in a wrapping row, muted to one tone — a light trust band.",
      uses: ["eyebrow", "description", "items.href"],
    },
    grid: {
      description: "Logos in equal tiles, in their own colors.",
      uses: ["eyebrow", "description", "items.href"],
    },
  },
});
