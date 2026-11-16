/**
 * Component registry: section type + variant → Astro component.
 * Schemas live in src/site/registry.ts; every variant there needs an entry here
 * (checked by tests/unit/registry.test.ts).
 */
import AboutCentered from "@/sections/about/Centered.astro";
import AboutImageSide from "@/sections/about/ImageSide.astro";
import ContactBigCard from "@/sections/contact/BigCard.astro";
import ContactFormCentered from "@/sections/contact/FormCentered.astro";
import ContactFormSplit from "@/sections/contact/FormSplit.astro";
import ContactInfoColumns from "@/sections/contact/InfoColumns.astro";
import ContactMap from "@/sections/contact/Map.astro";
import ContactMethods from "@/sections/contact/Methods.astro";
import CtaBandCard from "@/sections/cta/BandCard.astro";
import CtaBanner from "@/sections/cta/Banner.astro";
import CtaBoxed from "@/sections/cta/Boxed.astro";
import CtaFaces from "@/sections/cta/Faces.astro";
import CtaGradientCards from "@/sections/cta/GradientCards.astro";
import CtaRings from "@/sections/cta/Rings.astro";
import FaqAccordion from "@/sections/faq/Accordion.astro";
import FaqCategories from "@/sections/faq/Categories.astro";
import FaqSearch from "@/sections/faq/Search.astro";
import FaqSplitContact from "@/sections/faq/SplitContact.astro";
import FaqTwoColumn from "@/sections/faq/TwoColumn.astro";
import FaqWithImage from "@/sections/faq/WithImage.astro";
import FeaturesBento from "@/sections/features/Bento.astro";
import FeaturesCardsGrid from "@/sections/features/CardsGrid.astro";
import FeaturesIconBadge from "@/sections/features/IconBadge.astro";
import FeaturesIconList from "@/sections/features/IconList.astro";
import FeaturesOrbit from "@/sections/features/Orbit.astro";
import FeaturesSpotlight from "@/sections/features/Spotlight.astro";
import FeaturesStaggered from "@/sections/features/Staggered.astro";
import GalleryCheckerboard from "@/sections/gallery/Checkerboard.astro";
import GalleryExplore from "@/sections/gallery/Explore.astro";
import GalleryGrid from "@/sections/gallery/Grid.astro";
import GalleryMasonry from "@/sections/gallery/Masonry.astro";
import GalleryMosaic from "@/sections/gallery/Mosaic.astro";
import GalleryPolaroid from "@/sections/gallery/Polaroid.astro";
import GallerySlider from "@/sections/gallery/Slider.astro";
import HeroCentered from "@/sections/hero/Centered.astro";
import HeroCoverImage from "@/sections/hero/CoverImage.astro";
import HeroSplitImage from "@/sections/hero/SplitImage.astro";
import HeroPanel from "@/sections/hero/Panel.astro";
import HeroMinimal from "@/sections/hero/Minimal.astro";
import ScheduleAgenda from "@/sections/schedule/Agenda.astro";
import ScheduleDayColumns from "@/sections/schedule/DayColumns.astro";
import ScheduleMatrix from "@/sections/schedule/Matrix.astro";
import ScheduleTable from "@/sections/schedule/Table.astro";
import ScheduleTabs from "@/sections/schedule/Tabs.astro";
import ScheduleWeek from "@/sections/schedule/Week.astro";
import TeamCards from "@/sections/team/Cards.astro";
import TeamColorTiles from "@/sections/team/ColorTiles.astro";
import TeamCompact from "@/sections/team/Compact.astro";
import TeamDirectory from "@/sections/team/Directory.astro";
import TeamSocialCards from "@/sections/team/SocialCards.astro";
import TeamSpotlight from "@/sections/team/Spotlight.astro";
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
import LogoCloudColorTiles from "@/sections/logo-cloud/ColorTiles.astro";
import LogoCloudCoverflow from "@/sections/logo-cloud/Coverflow.astro";
import LogoCloudMarquee from "@/sections/logo-cloud/Marquee.astro";
import LogoCloudSplitImage from "@/sections/logo-cloud/SplitImage.astro";
import Embed from "@/sections/embed/Embed.astro";
import HoursCard from "@/sections/hours-location/Card.astro";
import HoursCompact from "@/sections/hours-location/Compact.astro";
import HoursImageSide from "@/sections/hours-location/ImageSide.astro";
import HoursMap from "@/sections/hours-location/Map.astro";
import HoursToday from "@/sections/hours-location/Today.astro";
import HoursWeekStrip from "@/sections/hours-location/WeekStrip.astro";
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
  gallery: { grid: GalleryGrid, mosaic: GalleryMosaic, slider: GallerySlider, masonry: GalleryMasonry, polaroid: GalleryPolaroid, checkerboard: GalleryCheckerboard, explore: GalleryExplore },
  pricing: { cards: PricingCards, compact: PricingCompact, "featured-center": PricingFeaturedCenter, table: PricingTable, split: PricingSplit, minimal: PricingMinimal },
  faq: { accordion: FaqAccordion, "two-column": FaqTwoColumn, "split-contact": FaqSplitContact, categories: FaqCategories, "with-image": FaqWithImage, search: FaqSearch },
  cta: { boxed: CtaBoxed, banner: CtaBanner, rings: CtaRings, "gradient-cards": CtaGradientCards, faces: CtaFaces, "band-card": CtaBandCard },
  contact: { "form-split": ContactFormSplit, "form-centered": ContactFormCentered, "info-columns": ContactInfoColumns, "big-card": ContactBigCard, methods: ContactMethods, map: ContactMap },
  "hours-location": { card: HoursCard, compact: HoursCompact, today: HoursToday, map: HoursMap, "image-side": HoursImageSide, "week-strip": HoursWeekStrip },
  schedule: { week: ScheduleWeek, table: ScheduleTable, "day-columns": ScheduleDayColumns, matrix: ScheduleMatrix, tabs: ScheduleTabs, agenda: ScheduleAgenda },
  team: { cards: TeamCards, compact: TeamCompact, "social-cards": TeamSocialCards, spotlight: TeamSpotlight, "color-tiles": TeamColorTiles, directory: TeamDirectory },
  stats: { row: Stats, cards: Stats, rings: StatsRings, bars: StatsBars, "chart-cards": StatsChartCards, highlight: StatsHighlight, bento: StatsBento },
  process: { steps: Process, timeline: Process, cards: Process, wave: ProcessWave, snake: ProcessSnake, chevrons: ProcessChevrons },
  "logo-cloud": { row: LogoCloud, grid: LogoCloud, coverflow: LogoCloudCoverflow, "split-image": LogoCloudSplitImage, marquee: LogoCloudMarquee, "color-tiles": LogoCloudColorTiles },
  embed: { full: Embed, split: Embed },
};
