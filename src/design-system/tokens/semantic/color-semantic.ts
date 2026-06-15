import { colors } from "../core/colors"

export const semanticColors = {

  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    inverse: colors.white
  },

  background: {
    primary: colors.white,
    secondary: colors.gray[50],
    inverse: colors.gray[900]
  },

  border: {
    default: colors.gray[200],
    strong: colors.gray[400]
  },

  action: {
    primary: colors.blue[600],
    primaryHover: colors.blue[700]
  },

  feedback: {
    success: colors.green[600],
    error: colors.red[600]
  }

} as const