import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";

import { getLinkByCode } from "@/server/linkService";
import { LinkDetailActions } from "@/components/LinkDetailActions";
import { getFallbackMessages, getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LinkDetailPageProps = {
  params: Promise<{ code: string }> | { code: string };
};

function formatDate(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function getBaseUrl(): Promise<string> {
  // Prefer explicit base URL if you deploy behind a proxy.
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}

export default async function LinkDetailPage({ params }: LinkDetailPageProps) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages, getFallbackMessages());

  const resolvedParams = await params;
  const code = resolvedParams.code;

  const row = (await getLinkByCode(code)) as {
    shortCode: string;
    originalUrl: string;
    createdAt: Date;
    clickCount: number;
    lastClickedAt: Date | null;
    expiresAt: Date | null;
    oneTime: boolean;
    consumedAt: Date | null;
  } | null;
  if (!row) notFound();

  const now = new Date();
  const expired = row.expiresAt ? row.expiresAt <= now : false;
  const consumed = row.oneTime ? !!row.consumedAt : false;

  const baseUrl = await getBaseUrl();
  const shortUrl = `${baseUrl}/${row.shortCode}`;
  const qrSvg = await QRCode.toString(shortUrl, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
  });
  const qrSvgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
  const qrPngDataUrl = await QRCode.toDataURL(shortUrl, {
    margin: 2,
    width: 360,
    errorCorrectionLevel: "M",
  });

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span dir="ltr" className="font-mono">
              /{row.shortCode}
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t("detail.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/links"
            className="text-sm font-medium underline underline-offset-4"
          >
            {t("detail.backToLinks")}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-black sm:p-5">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("detail.shortUrl")}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <a
              dir="ltr"
              className="font-medium underline underline-offset-4"
              href={`/${row.shortCode}`}
              target="_blank"
              rel="noreferrer"
              title={t("detail.openRedirectTitle")}
            >
              {shortUrl}
            </a>
            <a
              className="text-sm underline underline-offset-4 text-zinc-700 dark:text-zinc-300"
              href={row.originalUrl}
              target="_blank"
              rel="noreferrer"
              title={t("detail.openOriginalTitle")}
            >
              {t("detail.openOriginal")}
            </a>
          </div>

          <div className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
            {t("detail.originalUrl")}
          </div>
          <a
            href={row.originalUrl}
            dir="ltr"
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all text-left underline underline-offset-4"
          >
            {row.originalUrl}
          </a>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                {t("detail.created")}
              </div>
              <div className="mt-1 text-sm font-medium">
                {formatDate(locale, row.createdAt)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                {t("detail.lastClick")}
              </div>
              <div className="mt-1 text-sm font-medium">
                {row.lastClickedAt
                  ? formatDate(locale, row.lastClickedAt)
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                {t("detail.clicks")}
              </div>
              <div className="mt-1 text-sm font-medium tabular-nums">
                {row.clickCount}
              </div>
            </div>
          </div>

          {(row.expiresAt || row.oneTime) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  {t("detail.expires")}
                </div>
                <div className="mt-1 text-sm font-medium">
                  {row.expiresAt
                    ? formatDate(locale, row.expiresAt)
                    : t("detail.never")}
                </div>
                {expired ? (
                  <div className="mt-1 text-xs text-red-700 dark:text-red-300">
                    {t("detail.expired")}
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  {t("detail.oneTime")}
                </div>
                <div className="mt-1 text-sm font-medium">
                  {row.oneTime ? t("detail.yes") : t("detail.no")}
                </div>
                {row.oneTime ? (
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {consumed && row.consumedAt
                      ? t("detail.usedAt", {
                          date: formatDate(locale, row.consumedAt),
                        })
                      : t("detail.notUsedYet")}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className="mt-6">
            <LinkDetailActions
              code={row.shortCode}
              shortUrl={shortUrl}
              originalUrl={row.originalUrl}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-black sm:p-5">
          <div className="text-sm font-medium">{t("detail.qr.title")}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("detail.qr.subtitle")}
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <div
              className="w-full max-w-[260px] rounded-lg border border-zinc-200 bg-white p-2 dark:border-white/15"
              aria-label={t("detail.qr.ariaLabel", { url: shortUrl })}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <div className="flex flex-wrap justify-center gap-2">
              <a
                href={qrPngDataUrl}
                download={`qr-${row.shortCode}.png`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
              >
                {t("detail.qr.downloadPng")}
              </a>
              <a
                href={qrSvgDataUrl}
                download={`qr-${row.shortCode}.svg`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
              >
                {t("detail.qr.downloadSvg")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
