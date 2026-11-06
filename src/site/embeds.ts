/**
 * Embeds allowed in site.json (section "embed"): maps, booking and video
 * players from a fixed list of providers. Each embed loads only after a click
 * (privacy: no third-party cookies before the visitor asks for it), and the
 * site's CSP allows exactly the providers it uses. Pure TS (schema, CSP, tests).
 *
 * Script-based widgets (e.g. Booksy) are not embeddable safely — link to them
 * with a button (cta / hero action) instead.
 */
export type EmbedProvider = {
  id: string;
  label: string;
  kind: "map" | "booking" | "video";
  /** Origin used in frame-src. */
  origin: string;
  /** Accepts the URL (already parsed, https). */
  matches: (url: URL) => boolean;
  /** URL put into the iframe (e.g. youtube.com → youtube-nocookie.com). */
  frameUrl: (url: URL) => string;
  aspect: "16:9" | "4:3" | "tall";
};

export const EMBED_PROVIDERS: readonly EmbedProvider[] = [
  {
    id: "openstreetmap",
    label: "OpenStreetMap",
    kind: "map",
    origin: "https://www.openstreetmap.org",
    matches: (url) => url.hostname === "www.openstreetmap.org" && url.pathname === "/export/embed.html",
    frameUrl: (url) => url.href,
    aspect: "4:3",
  },
  {
    id: "google-maps",
    label: "Google Maps",
    kind: "map",
    origin: "https://www.google.com",
    matches: (url) => url.hostname === "www.google.com" && url.pathname.startsWith("/maps/embed"),
    frameUrl: (url) => url.href,
    aspect: "4:3",
  },
  {
    id: "youtube",
    label: "YouTube",
    kind: "video",
    origin: "https://www.youtube-nocookie.com",
    matches: (url) => ["www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname) && /^\/embed\/[\w-]+$/.test(url.pathname),
    frameUrl: (url) => `https://www.youtube-nocookie.com${url.pathname}${url.search}`,
    aspect: "16:9",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    kind: "video",
    origin: "https://player.vimeo.com",
    matches: (url) => url.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(url.pathname),
    frameUrl: (url) => `${url.href}${url.search ? "&" : "?"}dnt=1`,
    aspect: "16:9",
  },
  {
    id: "calendly",
    label: "Calendly",
    kind: "booking",
    origin: "https://calendly.com",
    matches: (url) => url.hostname === "calendly.com" && /^\/[\w-]+(\/[\w-]+)?\/?$/.test(url.pathname),
    frameUrl: (url) => `${url.origin}${url.pathname}?embed_type=Inline&hide_gdpr_banner=1`,
    aspect: "tall",
  },
];

/** Provider of an embed URL, or undefined when it is not allowed. */
export function embedProvider(value: string): EmbedProvider | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? EMBED_PROVIDERS.find((provider) => provider.matches(url)) : undefined;
  } catch {
    return undefined;
  }
}
