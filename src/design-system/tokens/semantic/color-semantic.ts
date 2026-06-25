import { colors } from "../core/colors";

export const semanticColors = {
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    muted: colors.gray[500],
    inverse: colors.white,
  },

  background: {
    primary: colors.white,
    secondary: colors.gray[50],
    muted: colors.gray[100],
    surface: colors.white,
    inverse: colors.gray[900],
  },

  border: {
    default: colors.gray[200],
    strong: colors.gray[400],
    inverse: "rgb(255 255 255 / 0.16)",
  },

  action: {
    primary: colors.blue[600],
    primaryHover: colors.blue[700],
    primaryText: colors.white,

    secondary: colors.gray[100],
    secondaryHover: colors.gray[200],
    secondaryText: colors.gray[900],
  },

  focus: {
    ring: colors.blue[500],
  },

  feedback: {
    success: colors.green[600],
    error: colors.red[600],
    warning: colors.amber[600],
  },
} as const;