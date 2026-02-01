"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { Locale } from "@/i18n/locales";
import { supportedLocales } from "@/i18n/locales";

const labels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export function LanguageSwitcher(props: {
  currentLocale: Locale;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <span className="sr-only">{props.label}</span>
      <select
        value={props.currentLocale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Locale;
          startTransition(async () => {
            await fetch("/api/locale", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locale: next }),
            });
            router.refresh();
          });
        }}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-white/15 dark:bg-black"
        aria-label={props.label}
      >
        {supportedLocales.map((l) => (
          <option key={l} value={l}>
            {labels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
