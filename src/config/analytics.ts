/**
 * Google Analytics 4, from site.json `analytics.gaId` (PUBLIC_GA_MEASUREMENT_ID
 * in the environment overrides it, e.g. for test builds).
 * Without a valid ID analytics is disabled and the cookie banner is not shown,
 * because the site then sets no optional cookies.
 * Imports only "virtual:site/analytics", so it is safe in browser scripts.
 */
import { gaId } from "virtual:site/analytics";

const measurementId = gaId.trim();

export const ANALYTICS_CONFIG = {
  measurementId,
  enabled: /^G-[A-Z0-9]+$/.test(measurementId) && measurementId !== "G-XXXXXXXXXX",
  consentStorageKey: "site-analytics-consent",
  consentVersion: 1,
} as const;
