/**
 * v3.12: the IndexNow key file at /<meta.indexNow>.txt, which holds the key itself: it proves the site owns the
 * key when a publish pings IndexNow (Bing, Yandex, Seznam…) with changed URLs. Only sites with a key have it, and
 * no SITE_NOINDEX build (no search engine should hear about a preview).
 */
import { noindex, site } from "virtual:site";

export const prerender = true;

export function getStaticPaths() {
  return site.meta.indexNow && !noindex ? [{ params: { indexnow: site.meta.indexNow } }] : [];
}

export function GET() {
  return new Response(site.meta.indexNow, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
