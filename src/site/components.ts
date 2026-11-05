/**
 * Component registry: section type + variant → Astro component.
 * Schemas live in src/site/registry.ts; every variant there needs an entry here
 * (checked by tests/unit/registry.test.ts).
 */
import ContactFormSplit from "@/sections/contact/FormSplit.astro";
import CtaBoxed from "@/sections/cta/Boxed.astro";
import FaqAccordion from "@/sections/faq/Accordion.astro";
import FeaturesCardsGrid from "@/sections/features/CardsGrid.astro";
import HeroSplitImage from "@/sections/hero/SplitImage.astro";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionComponent = (props: any) => any;

export const sectionComponents: Record<string, Record<string, SectionComponent>> = {
  hero: { "split-image": HeroSplitImage },
  features: { "cards-grid": FeaturesCardsGrid },
  cta: { boxed: CtaBoxed },
  faq: { accordion: FaqAccordion },
  contact: { "form-split": ContactFormSplit },
};
