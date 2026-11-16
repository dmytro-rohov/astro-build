/**
 * Decisions shared by the faq variants (pure functions, unit-tested). No Astro imports: the
 * search script of the "search" variant bundles normalizeSearch() and matchesSearch().
 */

export type FaqGroup<Item> = { name: string; items: Item[] };

/**
 * Questions grouped by `category`, the groups in the order they first appear; questions
 * without one form the last group, named `other`. Fewer than two groups means the questions
 * are not categorized at all: an empty list.
 */
export function faqGroups<Item extends { category?: string }>(items: Item[], other: string): FaqGroup<Item>[] {
  const groups = new Map<string, Item[]>();
  const rest: Item[] = [];

  for (const item of items) {
    const name = item.category?.trim();
    if (!name) rest.push(item);
    else groups.set(name, [...(groups.get(name) ?? []), item]);
  }

  const result = [...groups].map(([name, grouped]) => ({ name, items: grouped }));
  if (rest.length) result.push({ name: other, items: rest });

  return result.length > 1 ? result : [];
}

/**
 * Text as the search compares it: lower case, without diacritics (ł, ø and đ have no
 * decomposition) and with runs of spaces and punctuation as one space — "Ile kosztuje
 * wizyta?" and "ILE kosztuje… WIZYTA" match, so does "zrodlo" for "Źródło".
 */
export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l")
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Every word of the query is part of the (normalized) text; an empty query matches everything. */
export function matchesSearch(normalizedText: string, query: string): boolean {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  return words.every((word) => normalizedText.includes(word));
}

type ContactPage = { slug: string; sections: { id: string; type: string }[] };
type Business = { email?: string; phone?: string };

/**
 * Where "ask us" points when the questions do not help: the section's own action, else the
 * site's (first) contact section, else the business e-mail, else its phone; undefined when
 * the site has none of them.
 */
export function contactHref(action: { href: string } | undefined, pages: ContactPage[], business: Business): string | undefined {
  if (action) return action.href;

  for (const page of pages) {
    const contact = page.sections.find((section) => section.type === "contact");
    if (contact) return `${page.slug}#${contact.id}`;
  }

  if (business.email) return `mailto:${business.email}`;
  return business.phone ? `tel:${business.phone.replace(/[^\d+]/g, "")}` : undefined;
}
