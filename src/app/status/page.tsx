import Link from "next/link";

import { StatusAutoRedirect } from "@/components/StatusAutoRedirect";
import { getFallbackMessages, getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";

type StatusPageProps = {
  searchParams:
    | Promise<{ reason?: string; code?: string }>
    | { reason?: string; code?: string };
};

type StatusReason = "not_found" | "expired" | "used";

function normalizeReason(value: string | undefined): StatusReason {
  if (value === "expired" || value === "used" || value === "not_found") {
    return value;
  }
  return "not_found";
}

export default async function StatusPage(props: StatusPageProps) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages, getFallbackMessages());

  const { reason, code } = await props.searchParams;
  const normalized = normalizeReason(reason);

  const titleKey =
    normalized === "expired"
      ? "status.expired.title"
      : normalized === "used"
        ? "status.used.title"
        : "status.notFound.title";

  const subtitleKey =
    normalized === "expired"
      ? "status.expired.subtitle"
      : normalized === "used"
        ? "status.used.subtitle"
        : "status.notFound.subtitle";

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-black sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(titleKey)}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {t(subtitleKey)}
        </p>

        {code ? (
          <div className="mt-4 rounded-lg border border-zinc-200/70 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("status.code")}
            </div>
            <div dir="ltr" className="mt-1 font-mono text-sm">
              /{code}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {t("status.goHome")}
          </Link>
          <Link
            href="/links"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
          >
            {t("status.viewLinks")}
          </Link>
        </div>

        <StatusAutoRedirect href="/" seconds={5} />
      </div>
    </section>
  );
}
