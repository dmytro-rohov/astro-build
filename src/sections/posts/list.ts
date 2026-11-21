/** v3.9: what a posts section shows, for every list layout (Astro side). */
import { allPosts, categoriesOf } from "@/components/blog/data";
import type { SectionOf } from "@/site/types";

/** Posts shown before "show more" when the section does not set perPage. */
export const PER_PAGE = 9;

export function postsList(section: SectionOf<"posts">, headingLevel: "h1" | "h2", options: { filter?: boolean } = {}) {
  const { props } = section;
  const posts = allPosts.filter((post) => !props.category || post.category === props.category).slice(0, props.limit ?? undefined);
  const categories = categoriesOf(posts);
  // Category buttons only make sense for the whole blog and when there is something to choose.
  const filter = (options.filter ?? true) && (props.filter ?? (!props.limit && !props.category)) && categories.length >= 2;

  return {
    posts,
    categories: filter ? categories : [],
    perPage: props.perPage ?? PER_PAGE,
    itemHeading: headingLevel === "h1" ? ("h2" as const) : ("h3" as const),
  };
}
