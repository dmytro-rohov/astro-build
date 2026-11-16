/** Decisions shared by the testimonials variants (pure functions, unit-tested). */

/** Initials for a review without a photo: first and last word, "Anna K." → "AK". */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0])
    .filter((letter): letter is string => Boolean(letter));

  return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : (letters[0] ?? "")).toLocaleUpperCase();
}

/**
 * Type size of large quotes: short ones are set bigger, a 400-character one stays readable.
 * Given several, the longest decides — one size for quotes shown side by side.
 */
export function quoteSize(...quotes: string[]): "lg" | "md" | "sm" {
  const length = Math.max(...quotes.map((quote) => quote.length));
  return length <= 120 ? "lg" : length <= 260 ? "md" : "sm";
}

/** Card columns on wide screens: one row up to three, four as 2 × 2, then three. */
export function cardColumns(count: number): "1" | "2" | "3" {
  return count === 1 ? "1" : count === 2 || count === 4 ? "2" : "3";
}

export type RatingSummary = { average: number; count?: number; source?: string };

type RatingContent = {
  ratingAverage?: number;
  ratingCount?: number;
  ratingSource?: string;
  items: { rating?: number }[];
};

/**
 * Overall rating: the business profile's own figures when the content has them, else the
 * average of the reviews that carry a rating (one decimal). Undefined when nothing is rated —
 * a score is never made up.
 */
export function ratingSummary(content: RatingContent): RatingSummary | undefined {
  if (content.ratingAverage) {
    return { average: content.ratingAverage, count: content.ratingCount, source: content.ratingSource };
  }

  const ratings = content.items.flatMap((item) => (item.rating ? [item.rating] : []));
  if (!ratings.length) return undefined;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return { average: Math.round(average * 10) / 10, count: ratings.length };
}
