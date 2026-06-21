// Lightweight pub/sub for cookie consent state.

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

export const COOKIE_STORAGE_KEY = "unidealz.cookieConsent.v1";
export const OPEN_PREFS_EVENT = "unidealz:open-cookie-preferences";

export const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

export const allAccepted: CookiePreferences = {
  essential: true,
  analytics: true,
  functional: true,
  marketing: true,
};

export function getStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      analytics: !!parsed.analytics,
      functional: !!parsed.functional,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

export function savePreferences(prefs: CookiePreferences) {
  try {
    localStorage.setItem(
      COOKIE_STORAGE_KEY,
      JSON.stringify({ ...prefs, savedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
}
