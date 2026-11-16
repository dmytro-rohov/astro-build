/** Pricing helpers: the featured plan in the middle, and feature rows of the comparison table. */

type Plan = { highlighted?: boolean; features: readonly string[] };

/**
 * Plans reordered so the featured one (the highlighted plan, else the middle one) sits in
 * the middle: with an even count in the middle slot nearest to where it was. The others
 * keep their order.
 */
export function featuredOrder<T extends Plan>(plans: readonly T[]): { plans: T[]; featured: number } {
  const highlighted = plans.findIndex((plan) => plan.highlighted);
  const from = highlighted === -1 ? Math.floor(plans.length / 2) : highlighted;
  const slots = plans.length % 2 ? [(plans.length - 1) / 2] : [plans.length / 2 - 1, plans.length / 2];
  const to = slots.reduce((best, slot) => (Math.abs(slot - from) < Math.abs(best - from) ? slot : best));
  const rest = plans.filter((_, index) => index !== from);

  return { plans: [...rest.slice(0, to), plans[from], ...rest.slice(to)], featured: to };
}

const featureKey = (feature: string) => feature.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/**
 * Rows of the comparison table: every feature of every plan once (matched by text,
 * ignoring case and spacing; the first wording wins), in order of first appearance,
 * with the plans that include it.
 */
export function featureRows(plans: readonly Plan[]): { feature: string; included: boolean[] }[] {
  const rows = new Map<string, string>();

  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!rows.has(featureKey(feature))) rows.set(featureKey(feature), feature.trim());
    }
  }

  return [...rows].map(([key, feature]) => ({
    feature,
    included: plans.map((plan) => plan.features.some((item) => featureKey(item) === key)),
  }));
}
