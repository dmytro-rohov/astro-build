/** Layout decisions shared by the about variants (pure functions, unit-tested). */

/**
 * The title cut around its highlighted words (titleHighlight): the first match, in any letter
 * case. Words that are not in the title highlight nothing.
 */
export function titleParts(title: string, highlight?: string): { before: string; mark?: string; after: string } {
  const phrase = highlight?.trim();
  const match = phrase ? new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu").exec(title) : null;
  if (!match) return { before: title, after: "" };

  return { before: title.slice(0, match.index), mark: match[0], after: title.slice(match.index + match[0].length) };
}

/** First paragraph of a rich text (the lead) and the paragraphs after it ("" when there are none). */
export function splitLead(body: string): { lead: string; rest: string } {
  const [lead, ...rest] = body.trim().split(/\n\s*\n/);
  return { lead, rest: rest.join("\n\n") };
}

type Stop = { id: string; year: string; title: string; text?: string };

/** Stops of the milestones timeline: the milestones, else the highlights (the value is the "year"). */
export function timelineStops(content: { milestones?: Stop[]; highlights?: { id: string; value: string; label: string }[] }): Stop[] {
  if (content.milestones?.length) return content.milestones;
  return (content.highlights ?? []).map((item) => ({ id: item.id, year: item.value, title: item.label }));
}
