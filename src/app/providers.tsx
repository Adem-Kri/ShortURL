"use client";

import { ThemeProvider } from "next-themes";
import React, { createContext, useContext, useMemo } from "react";

import type { Locale } from "@/i18n/locales";
import type { AppMessages } from "@/i18n/messages";
import { createTranslator, type TranslationValues } from "@/i18n/translate";

type LocaleContextValue = {
  locale: Locale;
  messages: AppMessages;
  t: (key: string, values?: TranslationValues) => string;
  formatDateTime: (isoOrDate: string | Date) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within Providers");
  return ctx.locale;
}

export function useT(): LocaleContextValue["t"] {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT must be used within Providers");
  return ctx.t;
}

export function useFormatDateTime(): LocaleContextValue["formatDateTime"] {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useFormatDateTime must be used within Providers");
  return ctx.formatDateTime;
}

export function Providers(props: {
  children: React.ReactNode;
  locale: Locale;
  messages: AppMessages;
}) {
  const localeValue = useMemo<LocaleContextValue>(() => {
    const t = createTranslator(props.messages);
    return {
      locale: props.locale,
      messages: props.messages,
      t,
      formatDateTime: (isoOrDate) => {
        const date =
          typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
        return new Intl.DateTimeFormat(props.locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
      },
    };
  }, [props.locale, props.messages]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleContext.Provider value={localeValue}>
        {props.children}
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}
