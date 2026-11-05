import { z } from "zod";
import { iconNames } from "../../design-system/sprite.generated";
import { defineLayoutType } from "../../site/schema/define";
import { Action, field, HttpsUrl, multilineText, text } from "../../site/schema/fields";

const LinkGroup = z.object({
  title: text(40),
  links: z.array(Action).min(1).max(8),
});

const SocialLink = z.object({
  label: text(40),
  href: HttpsUrl,
  icon: z.enum(iconNames),
});

export const footer = defineLayoutType({
  type: "footer",
  label: "Stopka",
  description: "Site footer: name, short description, links, contact details and legal links.",
  content: z.object({
    description: field(multilineText(200).optional(), { label: "Opis", fieldType: "textarea", description: "One sentence about the business." }),
    groups: field(z.array(LinkGroup).max(4).optional(), {
      label: "Grupy linków",
      fieldType: "list",
      description: "Link columns. When empty: pages from the navigation and the legal links.",
    }),
    socialLinks: field(z.array(SocialLink).max(8).optional(), { label: "Profile społecznościowe", fieldType: "list", description: "Profiles on other sites." }),
  }),
  variants: {
    columns: {
      description: "Brand block and link columns, contact details, copyright row with legal links.",
      uses: ["description", "groups", "socialLinks"],
    },
  },
});
