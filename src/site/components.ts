/**
 * Component registry: section type + variant → Astro component.
 * Schemas live in src/site/registry.ts; every variant there needs an entry here
 * (checked by tests/unit/registry.test.ts).
 */
import AboutCentered from "@/sections/about/Centered.astro";
import AboutImageSide from "@/sections/about/ImageSide.astro";
import ContactFormCentered from "@/sections/contact/FormCentered.astro";
import ContactFormSplit from "@/sections/contact/FormSplit.astro";
import CtaBanner from "@/sections/cta/Banner.astro";
import CtaBoxed from "@/sections/cta/Boxed.astro";
import FaqAccordion from "@/sections/faq/Accordion.astro";
import FaqTwoColumn from "@/sections/faq/TwoColumn.astro";
import FeaturesCardsGrid from "@/sections/features/CardsGrid.astro";
import FeaturesIconList from "@/sections/features/IconList.astro";
import GalleryGrid from "@/sections/gallery/Grid.astro";
import GalleryMosaic from "@/sections/gallery/Mosaic.astro";
import HeroCentered from "@/sections/hero/Centered.astro";
import HeroCoverImage from "@/sections/hero/CoverImage.astro";
import HeroSplitImage from "@/sections/hero/SplitImage.astro";
import HoursCard from "@/sections/hours-location/Card.astro";
import HoursCompact from "@/sections/hours-location/Compact.astro";
import PricingCards from "@/sections/pricing/Cards.astro";
import PricingCompact from "@/sections/pricing/Compact.astro";
import ServicesCards from "@/sections/services/Cards.astro";
import ServicesPriceList from "@/sections/services/PriceList.astro";
import TestimonialsCards from "@/sections/testimonials/Cards.astro";
import TestimonialsSpotlight from "@/sections/testimonials/Spotlight.astro";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionComponent = (props: any) => any;

export const sectionComponents: Record<string, Record<string, SectionComponent>> = {
  hero: { "split-image": HeroSplitImage, centered: HeroCentered, "cover-image": HeroCoverImage },
  about: { "image-side": AboutImageSide, centered: AboutCentered },
  services: { cards: ServicesCards, "price-list": ServicesPriceList },
  features: { "cards-grid": FeaturesCardsGrid, "icon-list": FeaturesIconList },
  testimonials: { cards: TestimonialsCards, spotlight: TestimonialsSpotlight },
  gallery: { grid: GalleryGrid, mosaic: GalleryMosaic },
  pricing: { cards: PricingCards, compact: PricingCompact },
  faq: { accordion: FaqAccordion, "two-column": FaqTwoColumn },
  cta: { boxed: CtaBoxed, banner: CtaBanner },
  contact: { "form-split": ContactFormSplit, "form-centered": ContactFormCentered },
  "hours-location": { card: HoursCard, compact: HoursCompact },
};
