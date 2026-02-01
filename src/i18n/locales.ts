export const supportedLocales = ["en", "fr", "ar"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "pds_locale";

export function isSupportedLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (supportedLocales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return defaultLocale;
  const normalized = value.toLowerCase().split("-")[0];
  return isSupportedLocale(normalized) ? normalized : defaultLocale;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
