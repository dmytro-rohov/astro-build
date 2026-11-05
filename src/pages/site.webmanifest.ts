import { siteConfig } from "@/config/site";
import { dir, lang } from "@/i18n";
import { semanticColors } from "@/design-system/tokens/semantic/color-semantic";

export const prerender = true;

export function GET() {
  const manifest = {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang,
    dir,
    start_url: "/",
    display: "browser",
    theme_color: semanticColors.action.primary,
    background_color: semanticColors.background.primary,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}
