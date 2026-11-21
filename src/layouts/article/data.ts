/**
 * v3.9: everything an article layout shows besides the post itself (Astro side): chapters,
 * related and adjacent posts, the author, the call to action at the end.
 */
import { site } from "virtual:site";
import { allPosts, blog, blogPage, categoryName, postUrl } from "@/components/blog/data";
import { adjacentPosts, postChapters, postPhotos, relatedPosts } from "@/site/blog";
import { contactHref } from "@/sections/faq/layout";
import { t } from "@/i18n";
import type { Post } from "@/site/schema/blog";

export type ArticleLayout = NonNullable<typeof site.layout.article>;

export function articleOf(post: Post) {
  const layout = site.layout.article;
  const content: Partial<ArticleLayout["content"]> = layout?.content ?? {};
  const props: Partial<ArticleLayout["props"]> = layout?.props ?? {};
  const href = contactHref(content.ctaAction, site.pages, site.business);

  return {
    post,
    url: postUrl(post),
    category: categoryName(post.category),
    chapters: postChapters(post),
    photos: postPhotos(post),
    related: props.related === false ? [] : relatedPosts(allPosts, post, 3),
    adjacent: adjacentPosts(allPosts, post),
    author: blog?.author,
    blogTitle: blogPage?.title ?? t.blog.allPosts,
    blogPath: blog?.path ?? "/blog",
    progress: props.progress !== false,
    share: props.share !== false,
    cta: href
      ? {
          title: content.ctaTitle ?? t.blog.ctaTitle,
          text: content.ctaText ?? t.blog.ctaText,
          action: { label: content.ctaAction?.label ?? t.blog.ctaButton, href },
        }
      : undefined,
  };
}

export type Article = ReturnType<typeof articleOf>;
