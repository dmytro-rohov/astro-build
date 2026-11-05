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

type SemanticColorShape = {
  [Group in keyof typeof semanticColors]: {
    [Key in keyof (typeof semanticColors)[Group]]: string;
  };
};

/**
 * Dark color scheme. Same token names as `semanticColors`,
 * so components never need to know which scheme is active.
 */
export const semanticColorsDark = {
  text: {
    primary: colors.gray[50],
    secondary: colors.gray[300],
    muted: colors.gray[400],
    inverse: colors.gray[900],
  },

  background: {
    primary: colors.gray[900],
    secondary: colors.gray[800],
    muted: colors.gray[800],
    surface: colors.gray[800],
    inverse: colors.gray[50],
  },

  border: {
    default: colors.gray[700],
    strong: colors.gray[500],
    inverse: "rgb(0 0 0 / 0.16)",
  },

  action: {
    primary: colors.blue[500],
    primaryHover: colors.blue[600],
    primaryText: colors.gray[900],

    secondary: colors.gray[800],
    secondaryHover: colors.gray[700],
    secondaryText: colors.gray[50],
  },

  focus: {
    ring: colors.blue[500],
  },

  feedback: {
    success: colors.green[500],
    error: colors.red[500],
    warning: colors.amber[500],
  },
} as const satisfies SemanticColorShape;
