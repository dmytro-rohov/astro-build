import { ANALYTICS_CONFIG } from "@/config/analytics";

export type AnalyticsConsentStatus = "granted" | "denied";

interface StoredAnalyticsConsent {
  status: AnalyticsConsentStatus;
  version: number;
  updatedAt: string;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (..._args: unknown[]) => void;
  }
}

const CONSENT_EVENT = "madebymary:analytics-consent-change";
const OPEN_SETTINGS_EVENT = "madebymary:open-cookie-settings";

let analyticsLoadPromise: Promise<void> | null = null;

function isStoredConsent(value: unknown): value is StoredAnalyticsConsent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const consent = value as Partial<StoredAnalyticsConsent>;

  return (
    (consent.status === "granted" || consent.status === "denied") &&
    consent.version === ANALYTICS_CONFIG.consentVersion &&
    typeof consent.updatedAt === "string"
  );
}

export function getAnalyticsConsent(): AnalyticsConsentStatus | null {
  try {
    const rawValue = localStorage.getItem(
      ANALYTICS_CONFIG.consentStorageKey,
    );

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isStoredConsent(parsedValue)) {
      localStorage.removeItem(ANALYTICS_CONFIG.consentStorageKey);
      return null;
    }

    return parsedValue.status;
  } catch {
    return null;
  }
}

function saveAnalyticsConsent(status: AnalyticsConsentStatus): void {
  const consent: StoredAnalyticsConsent = {
    status,
    version: ANALYTICS_CONFIG.consentVersion,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    ANALYTICS_CONFIG.consentStorageKey,
    JSON.stringify(consent),
  );
}

function initializeDataLayer(): void {
  window.dataLayer = window.dataLayer ?? [];

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(..._args: unknown[]): void {
      window.dataLayer.push(arguments);
    };
  }
}

function setGoogleConsent(status: AnalyticsConsentStatus): void {
  if (!window.gtag) {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: status,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function clearAnalyticsCookies(): void {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  const hostnameParts = window.location.hostname.split(".");
  const rootDomain =
    hostnameParts.length >= 2
      ? `.${hostnameParts.slice(-2).join(".")}`
      : window.location.hostname;

  for (const name of cookieNames) {
    document.cookie =
      `${name}=; Max-Age=0; Path=/; SameSite=Lax`;

    document.cookie =
      `${name}=; Max-Age=0; Path=/; Domain=${rootDomain}; SameSite=Lax`;
  }
}

export function loadGoogleAnalytics(): Promise<void> {
  if (analyticsLoadPromise) {
    return analyticsLoadPromise;
  }

  analyticsLoadPromise = new Promise((resolve, reject) => {
    const { measurementId } = ANALYTICS_CONFIG;

    if (!measurementId.startsWith("G-")) {
      analyticsLoadPromise = null;

      reject(
        new Error(
          "Invalid GA4 Measurement ID. Expected an identifier beginning with G-.",
        ),
      );

      return;
    }

    initializeDataLayer();

    window.gtag?.("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    window.gtag?.("js", new Date());

    const configureAnalytics = (): void => {
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });

      window.gtag?.("config", measurementId, {
        send_page_view: true,
        debug_mode: import.meta.env.DEV,
      });

      resolve();
    };

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        `script[data-ga-measurement-id="${measurementId}"]`,
      );

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        configureAnalytics();
        return;
      }

      existingScript.addEventListener(
        "load",
        configureAnalytics,
        { once: true },
      );

      existingScript.addEventListener(
        "error",
        () => {
          analyticsLoadPromise = null;
          reject(new Error("Google Analytics script failed to load."));
        },
        { once: true },
      );

      return;
    }

    const script = document.createElement("script");

    script.async = true;
    script.src =
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId,
      )}`;

    script.dataset.gaMeasurementId = measurementId;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        configureAnalytics();
      },
      { once: true },
    );

    script.addEventListener(
      "error",
      () => {
        analyticsLoadPromise = null;
        reject(new Error("Google Analytics script failed to load."));
      },
      { once: true },
    );

    document.head.append(script);
  });

  return analyticsLoadPromise;
}

export async function setAnalyticsConsent(
  status: AnalyticsConsentStatus,
): Promise<void> {
  const previousStatus = getAnalyticsConsent();

  saveAnalyticsConsent(status);

  if (status === "granted") {
    await loadGoogleAnalytics();
  } else {
    setGoogleConsent("denied");
    clearAnalyticsCookies();
  }

  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, {
      detail: {
        status,
        previousStatus,
      },
    }),
  );
}

export function trackAnalyticsEvent(
  eventName: string,
  parameters: Record<string, string | number | boolean> = {},
): void {
  if (getAnalyticsConsent() !== "granted") {
    return;
  }

  if (!window.gtag) {
    return;
  }

  window.gtag("event", eventName, parameters);
}

export function openCookieSettings(): void {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

export const analyticsConsentEvents = {
  change: CONSENT_EVENT,
  openSettings: OPEN_SETTINGS_EVENT,
} as const;