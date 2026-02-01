"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFormatDateTime, useT } from "@/app/providers";

type LinkRow = {
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  clickCount: number;
  lastClickedAt: string | null;
};

async function deleteOne(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`/api/links/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
  if (response.ok) return { ok: true };
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return { ok: false, error: data?.error ?? "delete failed" };
}

export function LinksList(props: { links: LinkRow[] }) {
  const t = useT();
  const formatDateTime = useFormatDateTime();
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCodes = useMemo(
    () => props.links.map((l) => l.shortCode).filter((c) => selected[c]),
    [props.links, selected],
  );

  const allOnPageSelected =
    selectedCodes.length > 0 && selectedCodes.length === props.links.length;

  function toggleAllOnPage(next: boolean) {
    const nextSelected: Record<string, boolean> = { ...selected };
    for (const row of props.links) nextSelected[row.shortCode] = next;
    setSelected(nextSelected);
  }

  async function copyShortUrl(code: string) {
    setError(null);
    try {
      const shortUrl = `${window.location.origin}/${code}`;
      await navigator.clipboard.writeText(shortUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("links.list.copyFailed"));
    }
  }

  async function deleteSelected() {
    setError(null);
    const codes = selectedCodes;
    if (codes.length === 0) return;

    const ok = window.confirm(
      t("links.list.confirmDeleteMany", { count: codes.length }),
    );
    if (!ok) return;

    setBusy(true);
    try {
      for (const code of codes) {
        const result = await deleteOne(code);
        if (!result.ok) {
          setError(t("links.list.deleteFailed", { code, error: result.error }));
          break;
        }
      }

      setSelected({});
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-white/15 dark:bg-white/5">
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(e) => toggleAllOnPage(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
          />
          {t("links.list.selectAllOnPage")}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy || selectedCodes.length === 0}
            onClick={deleteSelected}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-300"
          >
            {busy
              ? t("links.list.deleting")
              : t("links.list.deleteSelected", { count: selectedCodes.length })}
          </button>
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Mobile: cards */}
      <div className="md:hidden">
        {props.links.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400">
            {t("links.list.noLinks")}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-white/10">
            {props.links.map((row) => (
              <div key={row.shortCode} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        href={`/links/${row.shortCode}`}
                        dir="ltr"
                        className="font-mono font-medium underline underline-offset-4"
                      >
                        {row.shortCode}
                      </Link>
                      <a
                        href={`/${row.shortCode}`}
                        dir="ltr"
                        className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
                        title={t("links.list.openRedirectTitle")}
                      >
                        {t("links.list.open")}
                      </a>
                    </div>
                    <a
                      href={row.originalUrl}
                      dir="ltr"
                      target="_blank"
                      rel="noreferrer"
                      title={row.originalUrl}
                      className="mt-2 block truncate text-left text-sm underline underline-offset-4"
                    >
                      {row.originalUrl}
                    </a>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyShortUrl(row.shortCode)}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
                      >
                        {t("links.list.copy")}
                      </button>
                      <Link
                        href={`/links/${row.shortCode}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
                      >
                        {t("links.list.details")}
                      </Link>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <input
                      type="checkbox"
                      checked={!!selected[row.shortCode]}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          [row.shortCode]: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
                      aria-label={t("links.list.selectOneAria", {
                        code: row.shortCode,
                      })}
                    />
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {t("links.search.clicks")}
                    </div>
                    <div className="text-sm font-medium tabular-nums">
                      {row.clickCount}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-500">
                      {t("links.search.created")}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-500">
                      {t("links.search.lastClick")}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap">
                      {row.lastClickedAt
                        ? formatDateTime(row.lastClickedAt)
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[940px] w-full border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-white/15 dark:bg-white/5">
              <tr>
                <th className="w-[44px] px-4 py-3">
                  <span className="sr-only">{t("links.list.select")}</span>
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("links.list.code")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("links.list.originalUrl")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("links.search.created")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("links.search.lastClick")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("links.search.clicks")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("links.list.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {props.links.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-zinc-600 dark:text-zinc-400"
                  >
                    {t("links.list.noLinks")}
                  </td>
                </tr>
              ) : (
                props.links.map((row) => (
                  <tr
                    key={row.shortCode}
                    className="border-b border-zinc-200 last:border-b-0 dark:border-white/10"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selected[row.shortCode]}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            [row.shortCode]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
                        aria-label={t("links.list.selectOneAria", {
                          code: row.shortCode,
                        })}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/links/${row.shortCode}`}
                          dir="ltr"
                          className="underline underline-offset-4"
                        >
                          {row.shortCode}
                        </Link>
                        <a
                          href={`/${row.shortCode}`}
                          dir="ltr"
                          className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
                          title={t("links.list.openRedirectTitle")}
                        >
                          {t("links.list.open")}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={row.originalUrl}
                        dir="ltr"
                        target="_blank"
                        rel="noreferrer"
                        title={row.originalUrl}
                        className="block max-w-[52ch] truncate text-left underline underline-offset-4"
                      >
                        {row.originalUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {row.lastClickedAt
                        ? formatDateTime(row.lastClickedAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.clickCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyShortUrl(row.shortCode)}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
                        >
                          {t("links.list.copy")}
                        </button>
                        <Link
                          href={`/links/${row.shortCode}`}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
                        >
                          {t("links.list.details")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
