import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const FeatureItem = z.strictObject({
  id: Id,
  eyebrow: field(text(24).optional(), { label: "Etykieta", fieldType: "text", description: "Tiny label above the item title." }),
  title: field(text(60), { label: "Tytuł", fieldType: "text", description: "Feature or benefit name." }),
  description: field(multilineText(200), { label: "Opis", fieldType: "textarea", description: "One or two sentences." }),
  icon: field(z.enum(ICON_NAMES).optional(), { label: "Ikona", fieldType: "select", description: "Icon from the built-in set (see icons in catalog.json: category and keywords)." }),
  link: field(Action.optional(), { label: "Link", fieldType: "link", description: 'Optional link under the item, e.g. "Więcej" to a service page.' }),
});

/** 1-based item that the spotlight and bento variants emphasize. */
const Highlight = z.number().int().min(1).max(12).optional();

export const features = defineSectionType({
  type: "features",
  label: "Zalety / funkcje",
  description: "Grid of benefits, features or reasons to choose the business.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    image: field(imageSlot({ aspect: [1, 1], minWidth: 480, svg: true }).optional(), {
      label: "Obraz w centrum",
      fieldType: "image",
      description: "Optional square photo (product, place) or SVG logo in the middle of the orbit variant.",
    }),
    items: field(listWithIds(FeatureItem, 2, 12), { label: "Elementy", fieldType: "list", description: "2–12 features; 3 or 6 look best." }),
  }),
  accentTone: false,
  variants: {
    "icon-list": {
      description: "Two-column list with an icon per item, no cards — light and compact.",
      uses: ["eyebrow", "description", "items.icon"],
    },
    "cards-grid": {
      description: "Cards in a responsive grid (1 column on phones); a short last row is centered.",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon", "items.link"],
      props: z.strictObject({
        columns: z.enum(["2", "3", "4"]).optional().describe("Number of columns on wide screens (default: by item count)."),
      }),
    },
    "icon-badge": {
      description:
        "Cards with a round icon badge sitting on their top edge and an optional link each — friendly and clear; " +
        "good for 3–8 services or benefits that lead to more pages.",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon", "items.link"],
      props: z.strictObject({
        columns: z.enum(["2", "3", "4"]).optional().describe("Number of columns on wide screens (default: by item count)."),
      }),
    },
    staggered: {
      description:
        "Centered cards offset up and down in a zigzag over a colored band — dynamic and eye-catching; " +
        "best with 3–4 short items (programs, offers, areas).",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon", "items.link"],
    },
    orbit: {
      description:
        "Items arranged left and right of a central circle holding the title (or the optional image: product photo or logo), " +
        "joined by thin lines — a striking overview of 4–8 short points; a clean list on phones and tablets. " +
        "Keep the title short and the description to one sentence.",
      uses: ["eyebrow", "description", "image", "items.eyebrow", "items.icon"],
    },
    spotlight: {
      description:
        "A row of cards where one (the middle one, or the item in `highlight`) is raised, larger and underlined in the accent " +
        "color — for 3–4 items with one key advantage.",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon", "items.link"],
      props: z.strictObject({
        highlight: Highlight.describe("Number of the item to emphasize (1 = first); default: the middle of the first row."),
      }),
    },
    bento: {
      description:
        "Bento grid of tiles in different sizes: a large first tile, one tile in the accent color, the rest small — " +
        "modern and editorial; works for 3–12 items.",
      uses: ["eyebrow", "description", "items.eyebrow", "items.icon", "items.link"],
      props: z.strictObject({
        highlight: Highlight.describe("Number of the item shown on the accent tile (1 = the large first tile); default: 3."),
      }),
    },
  },
});
