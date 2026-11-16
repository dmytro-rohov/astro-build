interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly SITE_DIR?: string;
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:site" {
  import type { Site } from "@/site/schema/site";
  import type { Assets } from "@/site/schema/assets";

  /** Validated site.json of SITE_DIR. */
  export const site: Site;
  export const assets: Assets;
  /** Absolute path of SITE_DIR. */
  export const siteDir: string;
}

declare module "virtual:site/analytics" {
  /** GA4 Measurement ID or "" — the only site value shipped to the browser. */
  export const gaId: string;
}

declare module "virtual:section-components" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type SectionComponent = (props: any) => any;

  /** Section type → variant → component, for the variants used on the site (src/site/components.ts). */
  export const sectionComponents: Record<string, Record<string, SectionComponent>>;
}
