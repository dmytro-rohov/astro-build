import { colors } from "./core/colors";
import { semanticColors } from "./semantic/color-semantic";
import { radius } from "./core/radius";

export const tokens = {
  color: colors,
  color: semanticColors,
  radius: radius
} as const
