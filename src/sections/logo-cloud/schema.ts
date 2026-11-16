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
    // v3.3: shown beside the logos by split-image.
    image: field(imageSlot({ aspect: [5, 4], minWidth: 720 }).optional(), {
      label: "Zdjęcie",
      fieldType: "image",
      description: "Photo shown beside the logos (split-image): the team at work, the place or a finished project; at least 720px wide.",
    }),
    items: field(listWithIds(Logo, 2, 24), { label: "Loga", fieldType: "list", description: "2–24 logos." }),
  }),
  variants: {
    row: {
      description: "Logos in balanced rows, muted to one tone (full color on hover of a link) — a calm trust band under a hero; 3–12 logos.",
      uses: ["eyebrow", "description", "items.href"],
    },
    grid: {
      description: "Logos in their own colors on equal light tiles, in balanced columns — a tidy partner wall; 4–24 logos.",
      uses: ["eyebrow", "description", "items.href"],
    },
    coverflow: {
      description:
        "A 3D carousel: the logo in the middle on a large card, its neighbours smaller and turned away, arrows below — " +
        "showy, for 5–24 partners; 2–3 logos stand still as a fixed fan.",
      uses: ["eyebrow", "description", "items.href"],
    },
    "split-image": {
      description:
        "A photo on one side, the title and logo tiles on the other; more than six logos page in a slider with dots — " +
        "personal (\"our clients\", suppliers, certificates), 3–24 logos. Without an image the title takes the photo's side.",
      uses: ["eyebrow", "description", "image", "items.href"],
      props: z.strictObject({ imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens.") }),
    },
    marquee: {
      description:
        "An endless band of logos sliding between thin rules (pauses on hover, focus and with a button; still for reduced motion) — " +
        "lively and modern, for 5–24 logos; the eyebrow becomes a filled pill.",
      uses: ["eyebrow", "description", "items.href"],
    },
    "color-tiles": {
      description:
        "Logos knocked out in white on big tiles of strong colors made from the brand color — bold and graphic " +
        "(events, sponsors, creative studios); 3–12 logos. `palette`: shades of the brand (default) or a spectrum of hues.",
      uses: ["eyebrow", "description", "items.href"],
      props: z.strictObject({
        palette: z.enum(["brand", "spectrum"]).optional().describe("Tile colors: shades of the brand color (default) or hues around the color wheel."),
      }),
    },
  },
});
