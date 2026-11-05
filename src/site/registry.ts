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
import { about } from "../sections/about/schema";
import { services } from "../sections/services/schema";
import { testimonials } from "../sections/testimonials/schema";
import { gallery } from "../sections/gallery/schema";
import { pricing } from "../sections/pricing/schema";
import { hoursLocation } from "../sections/hours-location/schema";
import { footer } from "../layout/footer/schema";
import { navbar } from "../layout/navbar/schema";

export const sectionTypes = [hero, about, services, features, testimonials, gallery, pricing, faq, cta, contact, hoursLocation] as const;

export const layoutTypes = { navbar, footer } as const;

/** Reserved for v3.1: sections composed from primitives directly in JSON. */
export const RESERVED_SECTION_TYPES = ["composed"] as const;
