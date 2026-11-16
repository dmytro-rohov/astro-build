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
import FeaturesBento from "@/sections/features/Bento.astro";
import FeaturesCardsGrid from "@/sections/features/CardsGrid.astro";
import FeaturesIconBadge from "@/sections/features/IconBadge.astro";
import FeaturesIconList from "@/sections/features/IconList.astro";
import FeaturesOrbit from "@/sections/features/Orbit.astro";
import FeaturesSpotlight from "@/sections/features/Spotlight.astro";
import FeaturesStaggered from "@/sections/features/Staggered.astro";
import GalleryGrid from "@/sections/gallery/Grid.astro";
import HeroCentered from "@/sections/hero/Centered.astro";
import HeroCoverImage from "@/sections/hero/CoverImage.astro";
import HeroSplitImage from "@/sections/hero/SplitImage.astro";
import HeroPanel from "@/sections/hero/Panel.astro";
import HeroMinimal from "@/sections/hero/Minimal.astro";
import ScheduleWeek from "@/sections/schedule/Week.astro";
import ScheduleTable from "@/sections/schedule/Table.astro";
import TeamCards from "@/sections/team/Cards.astro";
import TeamCompact from "@/sections/team/Compact.astro";
import Stats from "@/sections/stats/Stats.astro";
import StatsBars from "@/sections/stats/Bars.astro";
import StatsBento from "@/sections/stats/Bento.astro";
import StatsChartCards from "@/sections/stats/ChartCards.astro";
import StatsHighlight from "@/sections/stats/Highlight.astro";
import StatsRings from "@/sections/stats/Rings.astro";
import Process from "@/sections/process/Process.astro";
import ProcessChevrons from "@/sections/process/Chevrons.astro";
import ProcessSnake from "@/sections/process/Snake.astro";
import ProcessWave from "@/sections/process/Wave.astro";
import LogoCloud from "@/sections/logo-cloud/LogoCloud.astro";
import Embed from "@/sections/embed/Embed.astro";
import HoursCard from "@/sections/hours-location/Card.astro";
import HoursCompact from "@/sections/hours-location/Compact.astro";
import PricingCards from "@/sections/pricing/Cards.astro";
import PricingCompact from "@/sections/pricing/Compact.astro";
import PricingFeaturedCenter from "@/sections/pricing/FeaturedCenter.astro";
import PricingTable from "@/sections/pricing/Table.astro";
import PricingSplit from "@/sections/pricing/Split.astro";
import PricingMinimal from "@/sections/pricing/Minimal.astro";
import ServicesCards from "@/sections/services/Cards.astro";
import ServicesPriceList from "@/sections/services/PriceList.astro";
import TestimonialsCards from "@/sections/testimonials/Cards.astro";
import TestimonialsCarousel from "@/sections/testimonials/Carousel.astro";
import TestimonialsPortraits from "@/sections/testimonials/Portraits.astro";
import TestimonialsQuoteCards from "@/sections/testimonials/QuoteCards.astro";
import TestimonialsRating from "@/sections/testimonials/Rating.astro";
import TestimonialsSpotlight from "@/sections/testimonials/Spotlight.astro";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionComponent = (props: any) => any;

export const sectionComponents: Record<string, Record<string, SectionComponent>> = {
  hero: { "split-image": HeroSplitImage, centered: HeroCentered, "cover-image": HeroCoverImage, panel: HeroPanel, minimal: HeroMinimal },
  about: { "image-side": AboutImageSide, centered: AboutCentered },
  services: { cards: ServicesCards, "price-list": ServicesPriceList },
  features: { "cards-grid": FeaturesCardsGrid, "icon-list": FeaturesIconList, "icon-badge": FeaturesIconBadge, staggered: FeaturesStaggered, orbit: FeaturesOrbit, spotlight: FeaturesSpotlight, bento: FeaturesBento },
  testimonials: { cards: TestimonialsCards, spotlight: TestimonialsSpotlight, carousel: TestimonialsCarousel, portraits: TestimonialsPortraits, "quote-cards": TestimonialsQuoteCards, rating: TestimonialsRating },
  gallery: { grid: GalleryGrid, mosaic: GalleryGrid },
  pricing: { cards: PricingCards, compact: PricingCompact, "featured-center": PricingFeaturedCenter, table: PricingTable, split: PricingSplit, minimal: PricingMinimal },
  faq: { accordion: FaqAccordion, "two-column": FaqTwoColumn },
  cta: { boxed: CtaBoxed, banner: CtaBanner },
  contact: { "form-split": ContactFormSplit, "form-centered": ContactFormCentered },
  "hours-location": { card: HoursCard, compact: HoursCompact },
  schedule: { week: ScheduleWeek, table: ScheduleTable },
  team: { cards: TeamCards, compact: TeamCompact },
  stats: { row: Stats, cards: Stats, rings: StatsRings, bars: StatsBars, "chart-cards": StatsChartCards, highlight: StatsHighlight, bento: StatsBento },
  process: { steps: Process, timeline: Process, cards: Process, wave: ProcessWave, snake: ProcessSnake, chevrons: ProcessChevrons },
  "logo-cloud": { row: LogoCloud, grid: LogoCloud },
  embed: { full: Embed, split: Embed },
};
