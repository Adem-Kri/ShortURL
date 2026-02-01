import { cookies, headers } from "next/headers";

import { pickLocaleFromAcceptLanguage } from "@/i18n/acceptLanguage";
import { defaultLocale, isSupportedLocale, localeCookieName, normalizeLocale, type Locale } from "@/i18n/locales";

export async function getRequestLocale(): Promise<Locale> {
  const c = await cookies();
  const fromCookie = c.get(localeCookieName)?.value;
  if (fromCookie && isSupportedLocale(fromCookie)) return fromCookie;

  const h = await headers();
  const accept = h.get("accept-language");
  return accept ? pickLocaleFromAcceptLanguage(accept) : defaultLocale;
}

export function normalizeLocaleOrDefault(value: string | undefined | null): Locale {
  return normalizeLocale(value);
}
