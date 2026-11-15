export const motion = {
  duration: {
    instant: "0ms",
    // Hover and focus feedback: unhurried enough to read as smooth, not nervous (v3.2).
    fast: "240ms",
    normal: "320ms",
    slow: "480ms",
  },

  easing: {
    linear: "linear",
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
  },
} as const;