import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, text } from "../../site/schema/fields";

const Service = z.strictObject({
  id: Id,
  title: field(text(60), { label: "Nazwa", fieldType: "text", description: "Service name." }),
  description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "One or two sentences." }),
  price: field(text(24).optional(), { label: "Cena", fieldType: "text", description: 'Price as text, e.g. "od 120 zł", "150 zł / h".' }),
  icon: field(z.enum(ICON_NAMES).optional(), { label: "Ikona", fieldType: "select", description: "Icon from the built-in set (see icons in catalog.json: category and keywords)." }),
  image: field(imageSlot({ aspect: [3, 2], minWidth: 600 }).optional(), { label: "Zdjęcie", fieldType: "image", description: "Optional photo (3:2)." }),
  action: field(Action.optional(), { label: "Link", fieldType: "link", description: "Optional link, e.g. booking." }),
});

export const services = defineSectionType({
  type: "services",
  label: "Usługi / oferta",
  description: "What the business offers, optionally with prices.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    items: field(listWithIds(Service, 1, 12), { label: "Usługi", fieldType: "list", description: "1–12 services." }),
  }),
  variants: {
    cards: {
      description: "Cards in a grid with optional photo, icon, price and link.",
      uses: ["eyebrow", "description", "items.description", "items.price", "items.icon", "items.image", "items.action"],
      props: z.strictObject({ columns: z.enum(["2", "3"]).optional().describe("Columns on wide screens.") }),
    },
    "price-list": {
      description: "Menu-style list: name and description on the left, price on the right.",
      uses: ["eyebrow", "description", "items.description", "items.price"],
    },
  },
});
