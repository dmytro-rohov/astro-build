/**
 * v3.9: the site's blog for the components (Astro side, reads "virtual:site"): the posts,
 * their addresses, categories and dates in the site's language. The pure rules are in src/site/blog.ts.
 */
import { site } from "virtual:site";
import { format, lang, t } from "@/i18n";
import { postPath, readingMinutes, selectPosts } from "@/site/blog";
import { formatDate } from "@/site/dates";
import type { Post } from "@/site/schema/blog";

export const blog = site.blog;

/** All posts, newest first. */
export const allPosts: Post[] = blog ? selectPosts(blog.posts) : [];

export const postUrl = (post: Post) => postPath(blog ?? { path: "/blog" }, post);

export const categoryName = (id?: string) => (id ? blog?.categories.find((category) => category.id === id)?.name : undefined);

export const postDate = (iso: string, style: "long" | "medium" | "short" = "long") => formatDate(iso, lang, style);

export const readingLabel = (post: Post) => format(t.blog.readingTime, { minutes: readingMinutes(post) });

/** Categories that the given posts use, in the blog's order. */
export const categoriesOf = (posts: readonly Post[]) =>
  (blog?.categories ?? []).filter((category) => posts.some((post) => post.category === category.id));

/** The page that lists all posts (breadcrumbs, "all posts"). */
export const blogPage = blog ? site.pages.find((page) => page.slug === blog.path) : undefined;
