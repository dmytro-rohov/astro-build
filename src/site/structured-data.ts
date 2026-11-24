/**
 * v3.12: who a site is about, as schema.org nodes for its JSON-LD @graph (src/lib/seo/schema.ts):
 * - a personal site (business.kind "personal"): a Person, plus the person's practice as a local business
 *   when it has a place (an address or a service area),
 * - a business with an address or a service area: its LocalBusiness subtype,
 * - a business without either: an Organization (Google wants an address for every LocalBusiness).
 * Pure TS (tests).
 */
import { openingHoursSpecification } from "./hours";
import type { BusinessType, Site } from "./schema/site";

export type JsonLdNode = Record<string, unknown>;

/** Removes empty strings, empty arrays and empty objects (recursively). */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(compact).filter((item) => !isEmpty(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => !isEmpty(item));

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;

  return false;
}

const absolute = (path: string, siteUrl: URL | string) => new URL(path, siteUrl).toString();

export const schemaIds = {
  organization: (siteUrl: URL | string) => absolute("/#organization", siteUrl),
  person: (siteUrl: URL | string) => absolute("/#person", siteUrl),
  website: (siteUrl: URL | string) => absolute("/#website", siteUrl),
};

/** Engine types that are no schema.org type (the nearest real ones), or a local place outside LocalBusiness. */
const LOCAL_TYPES: Partial<Record<BusinessType, string[]>> = {
  DanceSchool: ["LocalBusiness", "EducationalOrganization"],
  MusicSchool: ["LocalBusiness", "EducationalOrganization"],
  LanguageSchool: ["LocalBusiness", "EducationalOrganization"],
  YogaStudio: ["SportsActivityLocation"],
  VeterinaryCare: ["VeterinaryCare", "LocalBusiness"],
  EventVenue: ["EventVenue", "LocalBusiness"],
};

/** The same without a place: an organization of that kind where schema.org has one. */
const UNLOCATED_TYPES: Partial<Record<BusinessType, string[]>> = {
  DanceSchool: ["EducationalOrganization"],
  MusicSchool: ["EducationalOrganization"],
  LanguageSchool: ["EducationalOrganization"],
  VeterinaryCare: ["VeterinaryCare"],
};

/** Types that are organizations, not places, or places that are no LocalBusiness: they stay as they are. */
const KEPT_TYPES: readonly BusinessType[] = ["Organization", "OnlineBusiness", "OnlineStore", "EducationalOrganization", "School"];

/** schema.org Place types among the engine's: opening hours and a map belong to a place. */
const PLACE_TYPES = ["LocalBusiness", "EducationalOrganization", "School", "EventVenue", "SportsActivityLocation"];

export type OrganizationKind = {
  /** One type, or a type and LocalBusiness (a place schema.org files elsewhere). */
  types: string[];
  /** A place: opening hours and hasMap apply. */
  place: boolean;
  /** A LocalBusiness: priceRange applies. */
  local: boolean;
};

/** The schema.org types of a business, by its engine type and whether it has a place (address or service area). */
export function organizationKind(type: BusinessType, located: boolean): OrganizationKind {
  const types = KEPT_TYPES.includes(type)
    ? [type]
    : located
      ? (LOCAL_TYPES[type] ?? [type])
      : (UNLOCATED_TYPES[type] ?? ["Organization"]);
  const local = located && !KEPT_TYPES.includes(type);

  return { types, local, place: located && (local || types.some((item) => PLACE_TYPES.includes(item))) };
}

/** Google Maps links (a place's profile) among the business profiles: the map of a place. */
const MAPS_URL = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page)([/?]|$)/;

export const mapsUrl = (sameAs: readonly string[]) => sameAs.find((url) => MAPS_URL.test(url));

export type OwnerOptions = {
  site: Pick<Site, "meta" | "business">;
  siteUrl: URL | string;
  /** Absolute URL of the raster logo (meta.logo as PNG, else an uploaded icon); none for a generated monogram. */
  logo?: string;
  /** Absolute URL of a photo of the business (the hero photo or the site's own sharing image). */
  image?: string;
  /** Absolute URL of the person's portrait (personal sites). */
  portrait?: string;
};

const typeOf = (types: string[]) => (types.length === 1 ? types[0] : types);

/** @id of the site's owner: the Person of a personal site, else the organization. */
export function ownerId(site: Pick<Site, "business">, siteUrl: URL | string): string {
  return site.business.kind === "personal" ? schemaIds.person(siteUrl) : schemaIds.organization(siteUrl);
}

/** The owner's name: business.name, else the site's name. */
export const ownerName = (site: Pick<Site, "meta" | "business">) => site.business.name ?? site.meta.name;

/** The nodes of the site's owner (Person and the practice, or the organization), first the owner. */
export function ownerNodes({ site, siteUrl, logo, image, portrait }: OwnerOptions): JsonLdNode[] {
  const { business, meta } = site;
  const { address } = business;
  const hasAddress = Boolean(address?.street || address?.city);
  const located = hasAddress || Boolean(business.areaServed?.length);
  const kind = organizationKind(business.type, located);
  const name = ownerName(site);
  // The header and the footer show meta.name: when the business is called differently, both names are its.
  const alternateName = meta.name !== name ? meta.name : undefined;
  const postalAddress = hasAddress
    ? {
        "@type": "PostalAddress",
        streetAddress: address?.street,
        addressLocality: address?.city,
        postalCode: address?.postalCode,
        addressRegion: address?.region,
        addressCountry: address?.country,
      }
    : undefined;
  const url = absolute("/", siteUrl);
  const personal = business.kind === "personal";
  // A personal site's practice is a node of its own only where the place matters (a local business).
  const practice = !personal || kind.local;

  const organization = compact({
    "@type": typeOf(kind.types),
    "@id": schemaIds.organization(siteUrl),
    name,
    alternateName,
    description: meta.description,
    url,
    logo,
    image,
    email: business.email,
    telephone: business.phone,
    address: postalAddress,
    areaServed: business.areaServed,
    knowsAbout: personal ? undefined : business.knowsAbout,
    openingHoursSpecification: kind.place ? openingHoursSpecification(business.hours) : undefined,
    priceRange: kind.local ? business.priceRange : undefined,
    hasMap: kind.place ? mapsUrl(business.sameAs) : undefined,
    sameAs: business.sameAs,
    founder: personal ? { "@id": schemaIds.person(siteUrl) } : undefined,
  });

  if (!personal) return [organization];

  const person = compact({
    "@type": "Person",
    "@id": schemaIds.person(siteUrl),
    name,
    alternateName,
    description: meta.description,
    url,
    image: portrait,
    jobTitle: business.jobTitle,
    knowsAbout: business.knowsAbout,
    email: business.email,
    telephone: business.phone,
    // The address of a practice is the practice's.
    address: practice ? undefined : postalAddress,
    sameAs: business.sameAs,
    worksFor: practice ? { "@id": schemaIds.organization(siteUrl) } : undefined,
  });

  return practice ? [person, organization] : [person];
}
