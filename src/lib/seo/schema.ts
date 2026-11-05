/**
 * Schema.org structured data (JSON-LD) built from siteConfig.
 * BaseLayout renders these on every page as one @graph.
 */
import { siteConfig } from "@/config/site";
import { lang } from "@/i18n";

type JsonLdNode = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  /** Path, e.g. "/contact". */
  path: string;
};

export type FaqEntry = {
  question: string;
  answer: string;
};

/** Removes empty strings, empty arrays and empty objects (recursively). */
function compact<T>(value: T): T {
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

const absolute = (path: string, siteUrl: URL | string) =>
  new URL(path, siteUrl).toString();

export const schemaIds = {
  organization: (siteUrl: URL | string) => absolute("/#organization", siteUrl),
  website: (siteUrl: URL | string) => absolute("/#website", siteUrl),
};

export function organizationSchema(siteUrl: URL | string): JsonLdNode {
  const org = siteConfig.organization;
  const { address } = org;
  const hasAddress = Boolean(address.street || address.city);

  return compact({
    "@type": org.type,
    "@id": schemaIds.organization(siteUrl),
    name: org.name || siteConfig.name,
    url: absolute("/", siteUrl),
    logo: org.logo ? absolute(org.logo, siteUrl) : "",
    image: org.logo ? absolute(org.logo, siteUrl) : "",
    email: org.email,
    telephone: org.phone,
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: address.street,
          addressLocality: address.city,
          postalCode: address.postalCode,
          addressRegion: address.region,
          addressCountry: address.country,
        }
      : undefined,
    openingHours: org.openingHours,
    priceRange: org.priceRange,
    sameAs: org.sameAs,
  });
}

export function websiteSchema(siteUrl: URL | string): JsonLdNode {
  return compact({
    "@type": "WebSite",
    "@id": schemaIds.website(siteUrl),
    url: absolute("/", siteUrl),
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: lang,
    publisher: { "@id": schemaIds.organization(siteUrl) },
  });
}

export function webPageSchema(options: {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteUrl: URL | string;
  breadcrumbId?: string;
}): JsonLdNode {
  return compact({
    "@type": "WebPage",
    "@id": `${options.url}#webpage`,
    url: options.url,
    name: options.title,
    description: options.description,
    inLanguage: lang,
    isPartOf: { "@id": schemaIds.website(options.siteUrl) },
    about: { "@id": schemaIds.organization(options.siteUrl) },
    primaryImageOfPage: options.image
      ? { "@type": "ImageObject", url: options.image }
      : undefined,
    breadcrumb: options.breadcrumbId ? { "@id": options.breadcrumbId } : undefined,
  });
}

export function breadcrumbSchema(
  items: BreadcrumbItem[],
  pageUrl: string,
  siteUrl: URL | string,
): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path, siteUrl),
    })),
  };
}

export function faqSchema(entries: FaqEntry[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function schemaGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" in content. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
