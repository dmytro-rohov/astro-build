import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineLayoutType } from "../../site/schema/define";
import { Action, field, HttpsUrl, imageSlot, multilineText, text } from "../../site/schema/fields";

const LinkGroup = z.strictObject({
  title: text(40),
  links: z.array(Action).min(1).max(8),
});

const SocialLink = z.strictObject({
  label: text(40),
  href: HttpsUrl,
  icon: z.enum(ICON_NAMES),
});

// v3.5: the footer's own colors in every variant (replaces the section tones it ignored).
const FooterProps = z.strictObject({
  tone: z
    .enum(["auto", "light", "dark", "brand"])
    .optional()
    .describe(
      'Footer colors: "auto" = the site\'s colors (rounded-card: a dark card), "light" / "dark" = that palette on any site, "brand" = the accent color.',
    ),
});

export const footer = defineLayoutType({
  type: "footer",
  label: "Stopka",
  description: "Site footer: name, short description, links, contact details and legal links.",
  content: z.strictObject({
    description: field(multilineText(200).optional(), { label: "Opis", fieldType: "textarea", description: "One sentence about the business." }),
    groups: field(z.array(LinkGroup).max(4).optional(), {
      label: "Grupy linków",
      fieldType: "list",
      description: "Link columns. When empty: pages from the navigation and the legal links.",
    }),
    socialLinks: field(z.array(SocialLink).max(8).optional(), { label: "Profile społecznościowe", fieldType: "list", description: "Profiles on other sites." }),
    ctaTitle: field(text(70).optional(), {
      label: "Wezwanie w stopce",
      fieldType: "text",
      description: 'Short invitation: the band title in cta-band (e.g. "Umów pierwszą wizytę"), the contact heading in contact-first.',
    }),
    ctaText: field(multilineText(160).optional(), { label: "Tekst wezwania", fieldType: "textarea", description: "One sentence under the band title (cta-band)." }),
    ctaAction: field(Action.optional(), {
      label: "Przycisk wezwania",
      fieldType: "link",
      description: "Band button (cta-band): booking page, contact section or a tel: link. Default: the contact section, else the phone number.",
    }),
    ctaImage: field(imageSlot({ aspect: [3, 1], minWidth: 1280 }).optional(), {
      label: "Zdjęcie pasa",
      fieldType: "image",
      description: "Wide photo (3:1) behind the band (cta-band), darkened under the text; without it the band is a brand gradient.",
    }),
    wordmark: field(text(16).optional(), {
      label: "Duży napis",
      fieldType: "text",
      description: "Word shown huge across the bottom (big-name). Default: the business name; set a short form for names over 12 characters.",
    }),
  }),
  variants: {
    columns: {
      description: "Brand block and link columns, contact details, copyright row with legal links.",
      uses: ["description", "groups", "socialLinks"],
      props: FooterProps,
    },
    simple: {
      description: "One compact row: logo, all links inline, copyright below.",
      uses: ["socialLinks"],
      props: FooterProps,
    },
    centered: {
      description: "Everything centered: logo, description, social icons, links, copyright.",
      uses: ["description", "socialLinks"],
      props: FooterProps,
    },
    "cta-band": {
      description:
        "A wide band on top (brand gradient, or a darkened photo from ctaImage) with a short call to action and one button, then " +
        "the columns, then legal links in the bottom row — for businesses that want one more booking or call at the end of every " +
        "page (salons, clinics, trades, studios). Best with ctaTitle and ctaAction; never a newsletter.",
      uses: ["description", "groups", "socialLinks", "ctaTitle", "ctaText", "ctaAction", "ctaImage"],
      props: FooterProps,
    },
    cards: {
      description:
        "Brand row (logo, description, social icons), then every link group and the contact details as separate rounded cards — " +
        "structured and modern; good with 2–4 link groups (services, company, help) for agencies, IT, B2B and larger offers.",
      uses: ["description", "groups", "socialLinks"],
      props: FooterProps,
    },
    "contact-first": {
      description:
        "A big contact block — address, phone and e-mail in large type, opening hours with a live open-now status — beside the " +
        "logo, description and round social icons; the links follow as one quiet row. For local businesses visited or called " +
        "(restaurants, salons, workshops, clinics). Needs business contact details; ctaTitle replaces the heading.",
      uses: ["description", "groups", "socialLinks", "ctaTitle"],
      props: FooterProps,
    },
    "big-name": {
      description:
        "Description, links and contact in a calm row, then the business name in giant letters across the full width — bold and " +
        "modern, for brands with a short name (studios, shops, creative work). Set wordmark when the name is long.",
      uses: ["description", "groups", "socialLinks", "wordmark"],
      props: FooterProps,
    },
    "rounded-card": {
      description:
        "The whole footer as a rounded card inset from the screen edges (dark by default): logo and social icons on top, link " +
        "columns and contact below — elegant and contained; suits light, airy sites (beauty, wellness, architecture, premium services).",
      uses: ["description", "groups", "socialLinks"],
      props: FooterProps,
    },
  },
});
