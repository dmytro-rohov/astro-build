import { z } from "zod";
import { defineLayoutType } from "../../site/schema/define";
import { Action, field } from "../../site/schema/fields";

// v3.3: the phone menu button (word "Menu" + icon, or the icon alone) and a header that hides
// while scrolling down and comes back when scrolling up.
const NavbarProps = z.strictObject({
  sticky: z.boolean().optional().describe("Keep the header visible while scrolling."),
  hideOnScroll: z.boolean().optional().describe("Sticky header that slides away when scrolling down and returns when scrolling up."),
  menuButton: z.enum(["label", "icon"]).optional().describe('Phone menu button: "label" = the word Menu with the icon (default), "icon" = the icon alone.'),
});

export const navbar = defineLayoutType({
  type: "navbar",
  label: "Nawigacja",
  description: "Site header with the business name and the main menu (built from pages[].nav).",
  content: z.strictObject({
    cta: field(Action.optional(), { label: "Przycisk w menu", fieldType: "link", description: "Optional highlighted button in the menu." }),
  }),
  variants: {
    simple: {
      description: "Name on the left, links on the right; menu button on phones.",
      uses: ["cta"],
      props: NavbarProps,
    },
    centered: {
      description: "Logo centered on top, links centered below it (wide screens); menu button on phones.",
      uses: ["cta"],
      props: NavbarProps,
    },
    topbar: {
      description: "Thin bar with phone and email above the simple header — for local services.",
      uses: ["cta"],
      props: NavbarProps,
    },
  },
});
