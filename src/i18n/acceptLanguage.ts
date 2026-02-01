import type { Locale } from "@/i18n/locales";
import { defaultLocale, isSupportedLocale, normalizeLocale } from "@/i18n/locales";

type Candidate = { tag: string; q: number };

function parseAcceptLanguage(header: string): Candidate[] {
  // Very small parser for RFC 9110 style headers: "en-US,en;q=0.9,fr;q=0.8"
  return header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tagPart, ...params] = part.split(";").map((p) => p.trim());
      let q = 1;
      for (const p of params) {
        const m = /^q=([0-9.]+)$/.exec(p);
        if (m) {
          const parsed = Number(m[1]);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { tag: tagPart, q };
    })
    .sort((a, b) => b.q - a.q);
}

export function pickLocaleFromAcceptLanguage(headerValue: string | null | undefined): Locale {
  if (!headerValue) return defaultLocale;

  for (const cand of parseAcceptLanguage(headerValue)) {
    if (cand.tag === "*") continue;
    const primary = normalizeLocale(cand.tag);
    if (isSupportedLocale(primary)) return primary;
  }

  return defaultLocale;
}
