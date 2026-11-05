/**
 * Schema registry: every section type and layout type the engine supports.
 * Pure TypeScript (no .astro imports) — used by the site schema, Node scripts,
 * tests and the AI catalog. Components are mapped in src/site/components.ts.
 */
import { contact } from "../sections/contact/schema";
import { cta } from "../sections/cta/schema";
import { faq } from "../sections/faq/schema";
import { features } from "../sections/features/schema";
import { hero } from "../sections/hero/schema";
import { footer } from "../layout/footer/schema";
import { navbar } from "../layout/navbar/schema";

export const sectionTypes = [hero, features, cta, faq, contact] as const;

export const layoutTypes = { navbar, footer } as const;

/** Reserved for v3.1: sections composed from primitives directly in JSON. */
export const RESERVED_SECTION_TYPES = ["composed"] as const;
