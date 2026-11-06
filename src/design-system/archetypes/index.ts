/**
 * Archetypes: style presets a site picks with theme.archetype.
 * An archetype sets colors (neutral scale + default accent), fonts, shapes,
 * spacing density, heading style, image style and default section tones.
 * Descriptions and tags are published in the AI catalog.
 */
import type { FontPairId } from "../fonts/library";
import type { NeutralName } from "../theme/neutrals";

export type SectionTone = "default" | "muted" | "inverse" | "accent";

export type Archetype = {
  label: string;
  description: string;
  /** "Fits" tags for the AI catalog (industries, moods). */
  tags: readonly string[];
  colorScheme: "light" | "dark";
  accent: string;
  /**
   * Accents that suit the archetype, each from a different color family (the
   * first is `accent`). The orchestrator picks from here when the brief has no
   * brand color, so two designs never share a family.
   */
  recommendedAccents: readonly string[];
  neutral: NeutralName;
  /** 0–0.06: how much of the accent tints light backgrounds (warmer, branded feel). */
  tint: number;
  fontPair: FontPairId;
  radius: "none" | "sm" | "md" | "lg" | "xl";
  buttonShape: "square" | "rounded" | "pill";
  imageStyle: "sharp" | "rounded" | "shadow" | "border";
  density: "compact" | "normal" | "airy";
  heading: { weight: 500 | 600 | 700 | 800; case: "none" | "uppercase"; tracking: "tight" | "normal" | "wide" };
  /** Card look: soft shadow or a thin border. */
  cards: "shadow" | "border";
  /** Default tone per section type when a section does not set props.tone. */
  sectionTones: Partial<Record<string, SectionTone>>;
};

export const archetypes = {
  default: {
    label: "Domyślny",
    description: "Neutral, clean starter look (the v2 design).",
    tags: ["neutral", "any"],
    colorScheme: "light",
    accent: "#2563eb",
    recommendedAccents: ["#2563eb", "#0f766e", "#7c3aed", "#e11d48"],
    neutral: "gray",
    tint: 0,
    fontPair: "inter",
    radius: "md",
    buttonShape: "rounded",
    imageStyle: "shadow",
    density: "normal",
    heading: { weight: 700, case: "none", tracking: "tight" },
    cards: "shadow",
    sectionTones: {},
  },
  minimal: {
    label: "Minimalistyczny",
    description: "Lots of white space, near-black accent, thin lines and sharp images.",
    tags: ["architecture", "design studio", "photography", "consulting", "minimal"],
    colorScheme: "light",
    accent: "#18181b",
    recommendedAccents: ["#18181b", "#2563eb", "#15803d", "#c2410c"],
    neutral: "zinc",
    tint: 0,
    fontPair: "dm-sans",
    radius: "sm",
    buttonShape: "square",
    imageStyle: "sharp",
    density: "airy",
    heading: { weight: 600, case: "none", tracking: "tight" },
    cards: "border",
    sectionTones: {},
  },
  elegant: {
    label: "Elegancki",
    description: "Serif headings, warm neutrals, bronze accent and framed images.",
    tags: ["beauty salon", "spa", "wedding", "jewellery", "restaurant", "luxury"],
    colorScheme: "light",
    accent: "#8a5a2b",
    recommendedAccents: ["#8a5a2b", "#9b3d6b", "#1f3a5f", "#4d6b2f"],
    neutral: "stone",
    tint: 0.02,
    fontPair: "cormorant-garamond+manrope",
    radius: "none",
    buttonShape: "square",
    imageStyle: "border",
    density: "airy",
    heading: { weight: 600, case: "none", tracking: "normal" },
    cards: "border",
    sectionTones: { features: "muted", cta: "inverse" },
  },
  bold: {
    label: "Wyrazisty",
    description: "Condensed uppercase headings, strong red accent, hard edges and contrast blocks.",
    tags: ["automotive", "gym", "sport", "construction", "barber", "bold"],
    colorScheme: "light",
    accent: "#dc2626",
    recommendedAccents: ["#dc2626", "#ca8a04", "#2563eb", "#16a34a"],
    neutral: "neutral",
    tint: 0,
    fontPair: "oswald+inter",
    radius: "none",
    buttonShape: "square",
    imageStyle: "sharp",
    density: "normal",
    heading: { weight: 700, case: "uppercase", tracking: "wide" },
    cards: "border",
    sectionTones: { features: "inverse", cta: "inverse" },
  },
  warm: {
    label: "Ciepły",
    description: "Soft serif headings, orange accent, tinted backgrounds and rounded shapes.",
    tags: ["cafe", "bakery", "restaurant", "kids", "family", "craft"],
    colorScheme: "light",
    accent: "#c2410c",
    recommendedAccents: ["#c2410c", "#9f1239", "#4d7c0f", "#0f766e"],
    neutral: "stone",
    tint: 0.05,
    fontPair: "fraunces+work-sans",
    radius: "lg",
    buttonShape: "pill",
    imageStyle: "rounded",
    density: "normal",
    heading: { weight: 600, case: "none", tracking: "tight" },
    cards: "shadow",
    sectionTones: { features: "muted", faq: "muted" },
  },
  "premium-dark": {
    label: "Premium (ciemny)",
    description: "Dark background, gold accent, classic serif headings and generous spacing.",
    tags: ["luxury", "night club", "whisky", "tattoo", "premium", "dark"],
    colorScheme: "dark",
    accent: "#d4a537",
    recommendedAccents: ["#d4a537", "#c084fc", "#5eead4", "#f87171"],
    neutral: "slate",
    tint: 0,
    fontPair: "playfair-display+inter",
    radius: "sm",
    buttonShape: "rounded",
    imageStyle: "border",
    density: "airy",
    heading: { weight: 600, case: "none", tracking: "normal" },
    cards: "border",
    sectionTones: { features: "muted" },
  },
  corporate: {
    label: "Firmowy",
    description: "Trustworthy blue, slate neutrals, clear structure and soft cards.",
    tags: ["accounting", "law firm", "it services", "insurance", "b2b", "corporate"],
    colorScheme: "light",
    accent: "#1d4ed8",
    recommendedAccents: ["#1d4ed8", "#0f766e", "#475569", "#b91c1c"],
    neutral: "slate",
    tint: 0.015,
    fontPair: "source-serif-4+inter",
    radius: "md",
    buttonShape: "rounded",
    imageStyle: "rounded",
    density: "normal",
    heading: { weight: 700, case: "none", tracking: "tight" },
    cards: "shadow",
    sectionTones: { features: "muted", cta: "inverse" },
  },
  energetic: {
    label: "Energiczny",
    description: "Vivid violet accent, playful grotesque headings, pill buttons and big radii.",
    tags: ["dance school", "events", "startup", "fitness", "music", "energetic"],
    colorScheme: "light",
    accent: "#7c3aed",
    recommendedAccents: ["#7c3aed", "#db2777", "#ea580c", "#0891b2"],
    neutral: "gray",
    tint: 0.03,
    fontPair: "space-grotesk+inter",
    radius: "xl",
    buttonShape: "pill",
    imageStyle: "shadow",
    density: "normal",
    heading: { weight: 700, case: "none", tracking: "tight" },
    cards: "shadow",
    sectionTones: { features: "muted", cta: "inverse" },
  },
} as const satisfies Record<string, Archetype>;

export type ArchetypeId = keyof typeof archetypes;

export const ARCHETYPE_IDS = Object.keys(archetypes) as [ArchetypeId, ...ArchetypeId[]];
