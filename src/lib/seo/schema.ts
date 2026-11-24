/**
 * Schema.org structured data (JSON-LD) built from siteConfig.
 * BaseLayout renders these on every page as one @graph.
 */
import { site } from "virtual:site";
import { siteConfig } from "@/config/site";
import { lang } from "@/i18n";
import { compact, ownerId, ownerName, ownerNodes, schemaIds, type OwnerOptions } from "@/site/structured-data";

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

const absolute = (path: string, siteUrl: URL | string) =>
  new URL(path, siteUrl).toString();

export { schemaIds };

/** v3.12: reference to the site's owner (the Person of a personal site, else the organization), with its name and home page. */
export function ownerReference(siteUrl: URL | string): JsonLdNode {
  return { "@id": ownerId(site, siteUrl), name: ownerName(site), url: absolute("/", siteUrl) };
}

/**
 * The site's owner (src/site/structured-data.ts): a Person (personal sites), a LocalBusiness subtype (with an
 * address or a service area) or an Organization; v3.12 with the raster logo, a photo instead of the app icon,
 * hasMap and alternateName.
 */
export function ownerSchema(options: Omit<OwnerOptions, "site">): JsonLdNode[] {
  return ownerNodes({ site, ...options });
}

export function websiteSchema(siteUrl: URL | string): JsonLdNode {
  return compact({
    "@type": "WebSite",
    "@id": schemaIds.website(siteUrl),
    url: absolute("/", siteUrl),
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: lang,
    publisher: { "@id": ownerId(site, siteUrl) },
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
    about: { "@id": ownerId(site, options.siteUrl) },
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

/**
 * v3.9: one blog post (BlogPosting): its page, dates, image, author and the owner as publisher. v3.12: dates with
 * the time and the zone, the author's page (url) when the site has one.
 */
export function blogPostingSchema(options: {
  url: string;
  title: string;
  description: string;
  image?: string;
  /** ISO 8601 date and time with the zone, e.g. "2026-11-18T12:00:00+01:00". */
  published: string;
  modified?: string;
  section?: string;
  tags: string[];
  words: number;
  /** The blog's author; without one the owner wrote it. */
  author?: { name: string; role?: string; image?: string; url?: string };
  siteUrl: URL | string;
}): JsonLdNode {
  const owner = ownerReference(options.siteUrl);
  // The author of a personal site's blog is usually the person: then the Person node, with the role and photo.
  const isOwner = site.business.kind === "personal" && options.author?.name === ownerName(site);

  return compact({
    "@type": "BlogPosting",
    "@id": `${options.url}#article`,
    mainEntityOfPage: { "@id": `${options.url}#webpage` },
    url: options.url,
    headline: options.title,
    description: options.description,
    image: options.image ? [options.image] : undefined,
    datePublished: options.published,
    dateModified: options.modified ?? options.published,
    articleSection: options.section,
    keywords: options.tags.join(", "),
    wordCount: options.words,
    inLanguage: lang,
    author: options.author
      ? {
          "@type": "Person",
          ...(isOwner ? { "@id": schemaIds.person(options.siteUrl) } : {}),
          name: options.author.name,
          url: isOwner ? owner.url : options.author.url,
          jobTitle: options.author.role,
          image: options.author.image,
          worksFor: site.business.kind === "personal" ? undefined : { "@id": schemaIds.organization(options.siteUrl) },
        }
      : owner,
    publisher: owner,
    isPartOf: { "@id": schemaIds.website(options.siteUrl) },
  });
}

/** v3.9: the blog page (Blog) with its posts. */
export function blogSchema(options: { url: string; title: string; posts: { title: string; url: string; published: string }[]; siteUrl: URL | string }): JsonLdNode {
  return compact({
    "@type": "Blog",
    "@id": `${options.url}#blog`,
    url: options.url,
    name: options.title,
    inLanguage: lang,
    publisher: { "@id": ownerId(site, options.siteUrl) },
    blogPost: options.posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: post.url, datePublished: post.published })),
  });
}
