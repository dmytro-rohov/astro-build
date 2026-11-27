/**
 * v3.14: the browsers the build's CSS is minified for (astro.config.mjs vite.build.cssTarget). Without a
 * list, Lightning CSS (Vite 8's CSS minifier) folds `animation-timeline` into the `animation` shorthand
 * (`animation: linear both name view()`), which browsers refuse: the whole declaration was dropped and the
 * scroll-driven animations of custom sections never ran. With the list it stays a declaration of its own.
 * The same as Vite's default ("baseline widely available"), only written out.
 */
export const CSS_TARGET = ["chrome111", "edge111", "firefox114", "safari16.4", "ios16.4"];
