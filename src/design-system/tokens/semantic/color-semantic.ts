import { colors } from "../core/colors";

export const semanticColors = {
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    // gray-550 keeps 4.5:1 also on background.muted (WCAG AA).
    muted: colors.gray[550],
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
    // Form controls need 3:1 against the background (WCAG 1.4.11).
    control: colors.gray[500],
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
    success: colors.green[700],
    error: colors.red[700],
    warning: colors.amber[700],
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
    // Muted sections sit between the page and the cards, so cards stand out.
    muted: colors.gray[850],
    surface: colors.gray[800],
    inverse: colors.gray[50],
  },

  border: {
    default: colors.gray[700],
    strong: colors.gray[500],
    control: colors.gray[400],
    inverse: "rgb(0 0 0 / 0.16)",
  },

  action: {
    primary: colors.blue[400],
    primaryHover: colors.blue[500],
    primaryText: colors.gray[900],

    secondary: colors.gray[800],
    secondaryHover: colors.gray[700],
    secondaryText: colors.gray[50],
  },

  focus: {
    ring: colors.blue[400],
  },

  feedback: {
    success: colors.green[400],
    error: colors.red[400],
    warning: colors.amber[400],
  },
} as const satisfies SemanticColorShape;
