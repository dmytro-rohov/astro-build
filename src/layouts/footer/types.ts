/** What Footer.astro hands to the component of the site's footer variant (src/layouts/footer/). */
export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  analyticsLabel?: string;
};

export type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

export type SocialLink = {
  label: string;
  href: string;
  icon: string;
};

export type FooterContact = {
  /** One line: "ul. Długa 1, 31-146 Kraków". */
  address?: string;
  phone?: string;
  phoneHref?: string;
  email?: string;
};

export type FooterProps = {
  brandLabel: string;
  brandHref: string;
  description?: string;
  groups: FooterLinkGroup[];
  socialLinks: SocialLink[];
  contact: FooterContact;
};
