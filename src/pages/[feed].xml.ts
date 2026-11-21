/**
 * v3.9: the blog's RSS 2.0 feed at /rss.xml: every post, newest first (title, link, date, excerpt,
 * category). Only sites with posts have it (no path otherwise).
 */
import type { APIContext } from "astro";
import { site } from "virtual:site";
import { getDictionary } from "@/i18n/dictionaries";
import { postDescription, postPath, selectPosts } from "@/site/blog";
import { rssDate } from "@/site/dates";

export const prerender = true;

export function getStaticPaths() {
  return site.blog?.posts.length ? [{ params: { feed: "rss" } }] : [];
}

const escape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export function GET({ site: siteUrl }: APIContext) {
  const blog = site.blog!;
  const t = getDictionary(site.lang).blog;
  const absolute = (path: string) => new URL(path, siteUrl).href;
  const page = site.pages.find((entry) => entry.slug === blog.path);
  const posts = selectPosts(blog.posts).filter((post) => !post.seo.noindex);
  const category = (id?: string) => blog.categories.find((entry) => entry.id === id)?.name;

  const items = posts.map((post) => {
    const link = absolute(postPath(blog, post));
    const name = category(post.category);
    return [
      "    <item>",
      `      <title>${escape(post.title)}</title>`,
      `      <link>${escape(link)}</link>`,
      `      <guid isPermaLink="true">${escape(link)}</guid>`,
      `      <pubDate>${rssDate(post.date)}</pubDate>`,
      `      <description>${escape(postDescription(post))}</description>`,
      ...(name ? [`      <category>${escape(name)}</category>`] : []),
      "    </item>",
    ].join("\n");
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escape(`${site.meta.name}: ${page?.title ?? "Blog"}`)}</title>`,
    `    <link>${escape(absolute(blog.path))}</link>`,
    `    <description>${escape(t.feedDescription.replace("{siteName}", site.meta.name))}</description>`,
    `    <language>${site.lang}</language>`,
    ...(posts[0] ? [`    <lastBuildDate>${rssDate(posts[0].updated ?? posts[0].date)}</lastBuildDate>`] : []),
    `    <atom:link href="${escape(absolute("/rss.xml"))}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
