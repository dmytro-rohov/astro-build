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
    // v3.5: five clearly different bars (colour, shape, logo position, menu, icons).
    "brand-bar": {
      description:
        "The whole bar in the brand colour with light links and an outlined button, like an app or SaaS site. " +
        "Bold and recognisable: for brands with a strong colour (bold, energetic, corporate); the colours are checked like accent sections.",
      uses: ["cta"],
      props: NavbarProps,
    },
    "dark-bar": {
      description:
        "A dark bar on every site (news-portal style): the name in a block of the brand colour, links as separated cells. " +
        "For services that want a firm, technical look (car repair, IT, sport); also frames a light site with a strong top edge.",
      uses: ["cta"],
      props: NavbarProps,
    },
    split: {
      description:
        "Logo in the middle, links split to its left and right, the button at the right end (wide screens). " +
        "Elegant and symmetric: restaurants, cafés, hotels, salons, fashion; looks best with 2–6 links and a short name or a logo.",
      uses: ["cta"],
      props: NavbarProps,
    },
    floating: {
      description:
        "A rounded bar floating with a gap from the top and the edges, with a soft shadow; compact while scrolling. " +
        "Modern and light: studios, startups, beauty, wellness, portfolios; best with up to 6 links.",
      uses: ["cta"],
      props: NavbarProps,
    },
    minimal: {
      description:
        "A large name and only the button and Menu in the bar: the links open in a full-screen menu on every screen. " +
        "Calm, editorial: architects, photographers, artists, premium brands; suits any number of links.",
      uses: ["cta"],
      props: NavbarProps,
    },
  },
});
