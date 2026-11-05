/** Neutral color scales (Tailwind CSS palettes, MIT). Steps 550/850 are interpolated. */
import { mix } from "./color";

const base = {
  slate: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"],
  gray: ["#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"],
  zinc: ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
  stone: ["#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"],
  neutral: ["#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"],
} as const;

export type NeutralName = keyof typeof base;

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type NeutralScale = Record<(typeof STEPS)[number] | 550 | 850, string>;

export function neutralScale(name: NeutralName): NeutralScale {
  const scale = Object.fromEntries(STEPS.map((step, index) => [step, base[name][index]])) as NeutralScale;
  scale[550] = mix(scale[500], scale[600], 0.5);
  scale[850] = mix(scale[800], scale[900], 0.5);

  return scale;
}

export const NEUTRAL_NAMES = Object.keys(base) as NeutralName[];
