import { describe, expect, test } from "vitest";
import {
  adjacentPosts,
  postChapters,
  postDescription,
  postImage,
  postPath,
  postPhotos,
  postsByMonth,
  readingMinutes,
  relatedPosts,
  selectPosts,
  slugify,
  sortPosts,
} from "../../src/site/blog";
import { formatDate, monthLabel, rssDate } from "../../src/site/dates";
import { siteEmbedUrls } from "../../src/site/embeds";
import { renderRichTextInline } from "../../src/site/richtext";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import type { Post } from "../../src/site/schema/blog";
import { demoSite, writeSite } from "./helpers";

const post = (id: string, date: string, extra: Partial<Post> = {}): Post => ({
  id,
  slug: id,
  title: `Wpis ${id}`,
  excerpt: "Krótka zajawka wpisu na blogu.",
  date,
  format: "article",
  tags: [],
  body: [{ type: "paragraph", text: "Treść." }],
  seo: { noindex: false },
  ...extra,
});

describe("blog helpers", () => {
  const posts = [
    post("a", "2026-10-01", { category: "porady" }),
    post("b", "2026-11-15"),
    post("c", "2026-11-15", { category: "porady" }),
    post("d", "2026-09-20", { category: "nowosci" }),
  ];

  test("newest first; the same day: the one added later first", () => {
    expect(sortPosts(posts).map((entry) => entry.id)).toEqual(["c", "b", "a", "d"]);
  });

  test("a list takes one category and the newest N", () => {
    expect(selectPosts(posts, { limit: 2 }).map((entry) => entry.id)).toEqual(["c", "b"]);
    expect(selectPosts(posts, { category: "porady" }).map((entry) => entry.id)).toEqual(["c", "a"]);
  });

  test("related: the same category first, then the newest; older and newer neighbours", () => {
    expect(relatedPosts(posts, posts[0], 3).map((entry) => entry.id)).toEqual(["c", "b", "d"]);
    expect(adjacentPosts(posts, posts[0])).toMatchObject({ newer: { id: "b" }, older: { id: "d" } });
    expect(adjacentPosts(posts, posts[2]).newer).toBeUndefined();
  });

  test("posts by month, newest month first", () => {
    expect(postsByMonth(posts).map((group) => [group.month, group.posts.map((entry) => entry.id)])).toEqual([
      ["2026-11", ["c", "b"]],
      ["2026-10", ["a"]],
      ["2026-09", ["d"]],
    ]);
  });

  test("reading time counts the words of the text blocks, at least one minute", () => {
    const words = (count: number) => Array.from({ length: count }, () => "słowo").join(" ");
    expect(readingMinutes({ body: [{ type: "paragraph", text: "Krótko." }] })).toBe(1);
    expect(readingMinutes({ body: [{ type: "paragraph", text: words(500) }, { type: "list", ordered: false, items: [words(100)] }] })).toBe(3);
  });

  test("slugs and chapter ids from titles in any language, unique in a post", () => {
    expect(slugify("Jak dbać o włosy zimą?")).toBe("jak-dbac-o-wlosy-zima");
    expect(slugify("Догляд за волоссям")).toBe("dohliad-za-volossiam");
    const chapters = postChapters({
      body: [
        { type: "heading", level: 2, text: "Wstęp" },
        { type: "paragraph", text: "x" },
        { type: "heading", level: 3, text: "Wstęp" },
        { type: "heading", level: 2, text: "5 kroków" },
        { type: "heading", level: 2, text: "!!!" },
      ],
    });
    expect(chapters.map((chapter) => [chapter.id, chapter.level, chapter.block])).toEqual([
      ["wstep", 2, 0],
      ["wstep-2", 3, 2],
      ["r-5-krokow", 2, 3],
      ["rozdzial", 2, 4],
    ]);
  });

  test("the main photo: the cover, else the first photo or gallery photo", () => {
    expect(postImage({ cover: "asset:a", body: [] })).toBe("asset:a");
    expect(postImage({ body: [{ type: "gallery", images: ["asset:g1", "asset:g2"] }] })).toBe("asset:g1");
    expect(postPhotos({ cover: "asset:g1", body: [{ type: "gallery", images: ["asset:g1", "asset:g2"] }] })).toEqual(["asset:g1", "asset:g2"]);
    expect(postImage({ body: [{ type: "paragraph", text: "x" }] })).toBeUndefined();
  });

  test("meta description: the excerpt cut at a word to 160 characters", () => {
    const long = `${"Bardzo długa zajawka wpisu ".repeat(8)}koniec.`;
    const description = postDescription({ excerpt: long, seo: { noindex: false } });
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.endsWith("…")).toBe(true);
    expect(postDescription({ excerpt: "Krótka.", seo: { noindex: false, description: "Własny opis wpisu dla wyszukiwarek, odpowiednio długi." } })).toBe(
      "Własny opis wpisu dla wyszukiwarek, odpowiednio długi.",
    );
    expect(postPath({ path: "/blog" }, { slug: "pierwszy" })).toBe("/blog/pierwszy");
  });

  test("dates in the site's language, months as headings, RSS dates", () => {
    expect(formatDate("2026-11-15", "pl")).toBe("15 listopada 2026");
    expect(monthLabel("2026-11", "pl")).toBe("Listopad 2026");
    expect(monthLabel("2026-11-15", "uk")).toMatch(/^Листопад 2026/);
    expect(rssDate("2026-11-15")).toBe("Sun, 15 Nov 2026 12:00:00 GMT");
  });

  test("list items render inline (no <p>), escaped", () => {
    expect(renderRichTextInline("**Ściana** <b>i</b> [link](/blog)")).toBe('<strong>Ściana</strong> &lt;b&gt;i&lt;/b&gt; <a class="link" href="/blog">link</a>');
  });
});

/** The demo site with a blog page, a latest-posts section and two posts (the demo photo as cover). */
function blogSite() {
  const site = demoSite();
  // The demo has a blog of its own: start without it.
  site.pages = site.pages.filter((page: { slug: string }) => page.slug !== "/blog");
  site.pages[0].sections = site.pages[0].sections.filter((section: { type: string }) => section.type !== "posts");
  delete site.blog;
  site.pages[0].sections.splice(2, 0, { id: "latest", type: "posts", variant: "carousel", props: { limit: 3 }, content: { title: "Latest posts" } });
  site.pages.push({ id: "blog", slug: "/blog", title: "Blog", sections: [{ id: "posts", type: "posts", variant: "cards", props: {}, content: { title: "Blog" } }] });
  site.layout.article = { variant: "toc", props: {}, content: {} };
  site.blog = {
    path: "/blog",
    categories: [{ id: "tips", name: "Tips" }],
    posts: [
      {
        id: "first",
        slug: "first-post",
        title: "The first post",
        excerpt: "What this blog will be about and why.",
        date: "2026-11-01",
        category: "tips",
        cover: "asset:hero",
        body: [
          { type: "heading", text: "Why" },
          { type: "paragraph", text: "Because **we can**." },
          { type: "video", url: "https://www.youtube.com/embed/aqz-KE-bpKQ", title: "A video" },
        ],
      },
      { id: "second", slug: "second", title: "Second", excerpt: "A photo post with a few words.", date: "2026-11-10", format: "short", body: [{ type: "paragraph", text: "Hello." }] },
    ],
  };
  return site;
}

function issues(change: (site: Record<string, any>) => void = () => {}) {
  const site = blogSite();
  change(site);
  try {
    loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]));
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }
  return [];
}

describe("blog in site.json", () => {
  test("a site with a blog page, posts and an article layout is valid", () => {
    expect(issues()).toEqual([]);
  });

  test("a posts section needs the blog; the blog needs its page with a posts section", () => {
    expect(issues((site) => delete site.blog)).toEqual(expect.arrayContaining([expect.stringMatching(/^pages\[0]\.sections\[2]\.type: A "posts" section needs the site's blog/)]));
    expect(issues((site) => (site.blog.path = "/news"))).toEqual(expect.arrayContaining(['blog.path: No page "/news": add the blog page (with a posts section) to pages.']));
    expect(issues((site) => (site.pages.at(-1).sections[0] = { id: "faq-x", type: "faq", variant: "accordion", props: {}, content: { title: "FAQ", items: [{ id: "q", question: "Q?", answer: "A." }] } }))).toEqual(
      expect.arrayContaining(['blog.path: The blog page "/blog" needs a "posts" section that lists the posts.']),
    );
    expect(issues((site) => (site.blog.path = "/"))).toEqual(expect.arrayContaining([expect.stringMatching(/^blog\.path: The blog needs its own page/)]));
  });

  test("post addresses are unique and free; categories exist; dates in order", () => {
    expect(issues((site) => (site.blog.posts[1].slug = "first-post"))).toEqual(expect.arrayContaining(['blog.posts[1].slug: Duplicate post slug "first-post".']));
    expect(
      issues((site) => site.pages.push({ id: "taken", slug: "/blog/second", title: "Taken", sections: [{ id: "taken-hero", type: "hero", variant: "centered", props: {}, content: { title: "Taken" } }] })),
    ).toEqual(expect.arrayContaining(['blog.posts[1].slug: "/blog/second" is already a page.']));
    expect(issues((site) => (site.blog.posts[0].category = "nope"))).toEqual(expect.arrayContaining(['blog.posts[0].category: No category "nope" in blog.categories.']));
    expect(issues((site) => (site.pages[0].sections[2].props.category = "nope"))).toEqual(
      expect.arrayContaining(['pages[0].sections[2].props.category: No category "nope" in blog.categories.']),
    );
    expect(issues((site) => (site.blog.posts[0].updated = "2026-10-01"))).toEqual(expect.arrayContaining(["blog.posts[0].updated: The update date is before the publication date."]));
  });

  test("blocks are checked: no HTML, only allowed video players, photos big enough", () => {
    expect(issues((site) => (site.blog.posts[0].body[1].text = "<script>x</script>"))).toEqual(
      expect.arrayContaining([expect.stringMatching(/^blog\.posts\[0]\.body\[1]\.text: HTML is not allowed/)]),
    );
    expect(issues((site) => (site.blog.posts[0].body[2].url = "https://example.com/video"))).toEqual(
      expect.arrayContaining([expect.stringMatching(/^blog\.posts\[0]\.body\[2]\.url: A YouTube/)]),
    );
    // The 1024 px square icon cropped to 3:2 is still wide enough; the logo slot is not a cover.
    expect(issues((site) => (site.blog.posts[0].cover = "asset:icon"))).toEqual([]);
    expect(issues((site) => site.blog.posts[1].body.unshift({ type: "gallery", images: ["asset:hero"] }))).toEqual(
      expect.arrayContaining([expect.stringMatching(/^blog\.posts\[1]\.body\[0]\.images: Too small/)]),
    );
  });

  test("the blog's videos join the site's embeds (CSP frame-src)", () => {
    const { site } = loadSite(writeSite(blogSite(), { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]));
    expect(siteEmbedUrls(site)).toContain("https://www.youtube.com/embed/aqz-KE-bpKQ");
  });
});
