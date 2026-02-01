import Link from "next/link";
import { getFallbackMessages, getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";

export default async function NotFound() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages, getFallbackMessages());

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-black sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("notFound.title")}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {t("notFound.subtitle")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {t("notFound.goShorten")}
          </Link>
          <Link
            href="/links"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
          >
            {t("notFound.viewLinks")}
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          {t("notFound.tip")}
        </p>
      </div>
    </section>
  );
}
