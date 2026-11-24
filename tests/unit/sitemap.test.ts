import { expect, test } from "vitest";
import { sitemapDates } from "../../src/site/sitemap";
import { demoSite } from "./helpers";
import { SiteSchema } from "../../src/site/schema/site";

const parse = (change: (site: Record<string, any>) => void) => {
  const site = demoSite();
  change(site);
  return SiteSchema.parse(site);
};

test("posts: updated, else date; noindex posts are not listed", () => {
  const dates = sitemapDates(
    parse((site) => {
      site.blog.posts[0].updated = "2026-11-22";
      site.blog.posts[1].seo = { noindex: true };
    }),
  );
  const [first, second] = demoSite().blog.posts;

  expect(dates.get(`/blog/${first.slug}`)).toBe("2026-11-22");
  expect(dates.has(`/blog/${second.slug}`)).toBe(false);
});

test("pages: their own updated date, a page listing posts its newest post, others none", () => {
  const dates = sitemapDates(
    parse((site) => {
      site.pages.find((page: { slug: string }) => page.slug === "/contact").updated = "2026-10-01";
      site.blog.posts[0].updated = "2026-11-22";
    }),
  );

  expect(dates.get("/contact")).toBe("2026-10-01");
  // The blog page and the home page (latest posts) list the posts.
  expect(dates.get("/blog")).toBe("2026-11-22");
  expect(dates.get("/")).toBe("2026-11-22");

  // Without posts or dates: no lastmod at all (never the build date).
  expect(sitemapDates(parse((site) => (site.blog.posts = []))).size).toBe(0);
});
