import { shadows } from "../core/shadows";

export const elevation = {
  none: shadows.none,
  card: shadows.sm,
  cardHover: shadows.md,
  dropdown: shadows.lg,
  sticky: shadows.md,
  modal: shadows.xl,
} as const;