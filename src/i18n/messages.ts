import type { Locale } from "@/i18n/locales";

import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import ar from "@/messages/ar.json";

export type AppMessages = typeof en;

export function getMessages(locale: Locale): AppMessages {
  switch (locale) {
    case "fr":
      return fr as AppMessages;
    case "ar":
      return ar as AppMessages;
    case "en":
    default:
      return en as AppMessages;
  }
}

export function getFallbackMessages(): AppMessages {
  return en as AppMessages;
}
