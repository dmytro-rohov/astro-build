/**
 * Contact details shown by the contact variants — phone, e-mail, address and a one-line
 * summary of the opening hours — always from business (pure functions, unit-tested).
 */
import type { Dictionary } from "../../i18n/dictionaries";
import { hoursRows } from "../../site/hours";
import type { Site } from "../../site/schema/site";

type Business = Site["business"];

export type ContactDetail = {
  kind: "phone" | "email" | "address" | "hours";
  /** Sprite icon, decorative. */
  icon: string;
  label: string;
  value: string;
  href?: string;
  /** Opening hours: one line per row of the hours table (closed days too). */
  lines?: string[];
};

/** Eyebrow, title and description, with the dictionary's defaults (a contact section always has a heading). */
export function contactHeader(content: { eyebrow?: string; title?: string; description?: string }, t: Dictionary) {
  const m = t.contactForm;
  return { eyebrow: content.eyebrow ?? m.eyebrow, title: content.title ?? m.title, description: content.description ?? m.description };
}

/** "ul. Długa 42, 31-000 Kraków": street, then postal code and city. */
export function addressLine(address: Business["address"]): string {
  return [address?.street, [address?.postalCode, address?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

/**
 * "Pn–Pt 08:00–20:00 · Sb 09:00–14:00": open days only ("" without hours). A line wraps only
 * between days: no-break space and word joiners around the dashes keep "Sb 09:00–14:00" whole.
 */
export function hoursSummary(hours: Business["hours"], t: Dictionary): string {
  return hoursRows(hours, t)
    .filter((row) => !row.closed)
    .map((row) => `${row.days}\u00a0${row.value}`.replaceAll("–", "\u2060–\u2060"))
    .join(" · ");
}

const isMapProfile = (value: string) => {
  const { hostname, pathname } = new URL(value);
  return (
    hostname === "maps.app.goo.gl" ||
    hostname === "www.openstreetmap.org" ||
    (["www.google.com", "google.com", "maps.google.com", "goo.gl"].includes(hostname) && pathname.startsWith("/maps"))
  );
};

/**
 * Where "directions" leads: the business's own map profile from sameAs (Google Maps,
 * OpenStreetMap), else a Google Maps search for the address (opens the app on phones).
 */
export function directionsHref(business: Pick<Business, "address" | "sameAs">): string | undefined {
  const profile = business.sameAs.find(isMapProfile);
  const line = addressLine(business.address);

  if (profile) return profile;
  if (!line) return undefined;

  const query = [line, business.address?.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** The details a business has, phone first; links for phone and e-mail, directions for the address. */
export function contactDetails(business: Business, t: Dictionary): ContactDetail[] {
  const m = t.contactForm;
  const address = addressLine(business.address);
  const hours = hoursSummary(business.hours, t);
  const details: (ContactDetail | false | undefined | "")[] = [
    business.phone && { kind: "phone", icon: "phone", label: m.phoneLabel, value: business.phone, href: `tel:${business.phone.replace(/[^\d+]/g, "")}` },
    business.email && { kind: "email", icon: "mail", label: m.emailLabel, value: business.email, href: `mailto:${business.email}` },
    address && { kind: "address", icon: "map-pin", label: m.addressLabel, value: address, href: directionsHref(business) },
    hours && {
      kind: "hours",
      icon: "clock",
      label: t.sections.hoursTitle,
      value: hours,
      lines: hoursRows(business.hours, t).map((row) => `${row.days} ${row.value}`),
    },
  ];

  return details.filter((detail): detail is ContactDetail => Boolean(detail));
}

export type ContactMethod = {
  kind: "phone" | "email" | "address";
  icon: string;
  title: string;
  lines: string[];
  action: { label: string; href: string };
};

/** Ways to get in touch ("methods" variant): call, write, visit. The hours go with the phone, or with the address without one. */
export function contactMethods(details: ContactDetail[], t: Dictionary): ContactMethod[] {
  const m = t.contactForm;
  const find = (kind: ContactDetail["kind"]) => details.find((detail) => detail.kind === kind);
  const [phone, email, address, hours] = [find("phone"), find("email"), find("address"), find("hours")];
  const methods: (ContactMethod | false | undefined | "")[] = [
    phone?.href && { kind: "phone", icon: phone.icon, title: m.callTitle, lines: hours ? [hours.value] : [], action: { label: phone.value, href: phone.href } },
    email?.href && { kind: "email", icon: email.icon, title: m.writeTitle, lines: [], action: { label: email.value, href: email.href } },
    address?.href && {
      kind: "address",
      icon: address.icon,
      title: m.visitTitle,
      lines: [address.value, ...(hours && !phone ? [hours.value] : [])],
      action: { label: m.directions, href: address.href },
    },
  ];

  return methods.filter((method): method is ContactMethod => Boolean(method));
}
