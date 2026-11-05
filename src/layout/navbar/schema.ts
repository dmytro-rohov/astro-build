import { z } from "zod";
import { defineLayoutType } from "../../site/schema/define";
import { Action, field } from "../../site/schema/fields";

export const navbar = defineLayoutType({
  type: "navbar",
  label: "Nawigacja",
  description: "Site header with the business name and the main menu (built from pages[].nav).",
  content: z.object({
    cta: field(Action.optional(), { label: "Przycisk w menu", fieldType: "link", description: "Optional highlighted button in the menu." }),
  }),
  variants: {
    simple: {
      description: "Name on the left, links on the right; menu button on phones.",
      uses: ["cta"],
      props: z.object({ sticky: z.boolean().optional().describe("Keep the header visible while scrolling.") }),
    },
  },
});
