/**
 * Google Analytics 4. Set PUBLIC_GA_MEASUREMENT_ID in .env (e.g. G-ABC123XYZ).
 * Without a valid ID analytics is disabled and the cookie banner is not shown,
 * because the site then sets no optional cookies.
 */
const measurementId = (import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? "").trim();

export const ANALYTICS_CONFIG = {
  measurementId,
  enabled: /^G-[A-Z0-9]+$/.test(measurementId) && measurementId !== "G-XXXXXXXXXX",
  consentStorageKey: "site-analytics-consent",
  consentVersion: 1,
} as const;
