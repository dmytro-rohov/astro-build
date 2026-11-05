/**
 * Shape, density and heading tokens derived from the archetype.
 * Emitted as CSS custom properties next to the color tokens.
 */
import type { Archetype } from "../archetypes";

const RADII = {
  none: { small: "0", large: "0" },
  sm: { small: "0.125rem", large: "0.25rem" },
  md: { small: "0.5rem", large: "0.75rem" },
  lg: { small: "0.75rem", large: "1.25rem" },
  xl: { small: "1rem", large: "1.75rem" },
} as const;

export function shapeTokens(archetype: Archetype): Record<string, string> {
  const radius = RADII[archetype.radius];

  const button = archetype.buttonShape === "pill" ? "999px" : archetype.buttonShape === "square" ? "0" : radius.small;

  const image = {
    sharp: { radius: "0", shadow: "none", border: "0 solid transparent" },
    rounded: { radius: radius.large, shadow: "none", border: "0 solid transparent" },
    shadow: { radius: radius.large, shadow: "var(--elevation-card)", border: "0 solid transparent" },
    border: { radius: radius.small, shadow: "none", border: "1px solid var(--color-border-default)" },
  }[archetype.imageStyle];

  const density = { compact: "0.8", normal: "1", airy: "1.3" }[archetype.density];
  const tracking = { tight: "-0.02em", normal: "0", wide: "0.04em" }[archetype.heading.tracking];

  return {
    "radius-control": radius.small,
    "radius-card": radius.large,
    "radius-button": button,
    "radius-image": image.radius,
    "image-shadow": image.shadow,
    "image-border": image.border,
    "card-shadow": archetype.cards === "shadow" ? "var(--elevation-card)" : "none",
    "card-shadow-hover": archetype.cards === "shadow" ? "var(--elevation-card-hover)" : "none",
    "card-border-color": archetype.cards === "shadow" ? "transparent" : "var(--color-border-default)",
    "space-scale": density,
    "heading-weight": String(archetype.heading.weight),
    "heading-transform": archetype.heading.case,
    "heading-tracking": tracking,
  };
}
