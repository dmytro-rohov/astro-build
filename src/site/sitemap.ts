/**
 * v3.12: <lastmod> of the sitemap: when a page really changed, never the build time (which would say every page
 * changes on every build, and search engines stop trusting it). Pure TS (astro.config.mjs, tests).
 */
import { postPath } from "./blog";
import type { Site } from "./schema/site";

/**
 * Path → "YYYY-MM-DD": a post's `updated`, else its `date`; a page's `updated`. A page listing posts (a posts
 * section) changes with its newest post too. Paths without a date are missing: no lastmod is better than a guess.
 */
export function sitemapDates(site: Pick<Site, "pages" | "blog">): Map<string, string> {
  const dates = new Map<string, string>();
  const { blog } = site;
  const posts = (blog?.posts ?? []).filter((post) => !post.seo.noindex);
  const changed = (post: (typeof posts)[number]) => post.updated ?? post.date;

  if (blog) {
    for (const post of posts) dates.set(postPath(blog, post), changed(post));
  }

  for (const page of site.pages) {
    const listed = page.sections.flatMap((section) => {
      if (section.type !== "posts") return [];
      const category = (section.props as { category?: string }).category;
      return posts.filter((post) => !category || post.category === category).map(changed);
    });
    const latest = [page.updated, ...listed].filter((date): date is string => Boolean(date)).sort().at(-1);

    if (latest) dates.set(page.slug, latest);
  }

  return dates;
}
