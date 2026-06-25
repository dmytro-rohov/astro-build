import { colors } from "./core/colors";
import { spacing } from "./core/spacing";
import { radius } from "./core/radius";
import { typography } from "./core/typography";
import { shadows } from "./core/shadows";
import { zIndex } from "./core/zindex";
import { motion } from "./core/motion";

import { semanticColors } from "./semantic/color-semantic";
import { elevation } from "./semantic/elevation";

export const tokens = {
  color: {
    ...semanticColors,
    primitive: colors,
  },

  spacing,
  radius,
  shadow: shadows,
  elevation,
  zIndex,
  motion,

  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  lineHeight: typography.lineHeight,
  letterSpacing: typography.letterSpacing,
} as const;

export type Tokens = typeof tokens;