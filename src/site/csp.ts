/**
 * Content Security Policy built from site.json: only the hosts a site really
 * uses are allowed — Google Analytics when analytics is configured, the form
 * service in remote contact mode, the providers of the site's embeds (embed
 * sections, contact and hours-location maps; frames are blocked otherwise). Used by astro.config.mjs.
 */
import { embedProvider, siteEmbedUrls } from "./embeds";
import type { Site } from "./schema/site";

const GA = {
  script: ["https://www.googletagmanager.com"],
  img: ["https://www.googletagmanager.com", "https://*.google-analytics.com"],
  connect: ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"],
};

type DirectiveName =
  | "default-src" | "img-src" | "connect-src" | "font-src" | "manifest-src"
  | "object-src" | "base-uri" | "form-action" | "frame-src";

/** Matches Astro's CspDirective type ("<directive> <sources>"). */
export type Directive = `${DirectiveName}${string}`;

export type SiteCsp = { directives: Directive[]; scriptResources: string[] };

/** Origins of the embeds of a site (maps, booking, video). */
export function embedOrigins(site: Pick<Site, "pages"> & Partial<Pick<Site, "blog">>): string[] {
  const urls = siteEmbedUrls(site);
  return [...new Set(urls.map((url) => embedProvider(url)?.origin).filter((origin): origin is string => Boolean(origin)))].sort();
}

export function cspForSite(site: Pick<Site, "contact" | "pages"> & Partial<Pick<Site, "blog">>, gaId: string): SiteCsp {
  const analytics = Boolean(gaId);
  const frames = embedOrigins(site);
  const formOrigin = site.contact.mode === "remote" ? new URL(site.contact.endpoint).origin : undefined;

  const list = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(" ");
  const directive = (name: DirectiveName, ...values: (string | false | undefined)[]): Directive => `${name} ${list(...values)}`;

  return {
    directives: [
      directive("default-src", "'self'"),
      directive("img-src", "'self'", "data:", ...(analytics ? GA.img : [])),
      directive("connect-src", "'self'", ...(analytics ? GA.connect : []), formOrigin),
      directive("font-src", "'self'"),
      directive("manifest-src", "'self'"),
      directive("object-src", "'none'"),
      directive("base-uri", "'self'"),
      directive("form-action", "'self'", formOrigin),
      directive("frame-src", ...(frames.length ? frames : ["'none'"])),
      // frame-ancestors is not used: prerendered pages get the policy in a <meta>
      // tag, where browsers ignore it. Framing is blocked by X-Frame-Options instead.
    ],
    scriptResources: ["'self'", ...(analytics ? GA.script : [])],
  };
}
