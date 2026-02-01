"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/app/providers";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

export function LinksSearchBar(props: { initialQuery?: string }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "createdAt";
  const currentDir = searchParams.get("dir") ?? "desc";
  const currentClicked = (searchParams.get("clicked") ?? "0") === "1";

  const [value, setValue] = useState(props.initialQuery ?? currentQ);
  const [sort, setSort] = useState(currentSort);
  const [dir, setDir] = useState(currentDir);
  const [clickedOnly, setClickedOnly] = useState(currentClicked);

  // Keep input in sync with back/forward navigation.
  useEffect(() => {
    setValue(currentQ);
  }, [currentQ]);

  useEffect(() => {
    setSort(currentSort);
  }, [currentSort]);

  useEffect(() => {
    setDir(currentDir);
  }, [currentDir]);

  useEffect(() => {
    setClickedOnly(currentClicked);
  }, [currentClicked]);

  const debounced = useDebouncedValue(value, 250);

  const nextHref = useMemo(() => {
    const q = debounced.trim();
    const params = new URLSearchParams(searchParams);

    if (!q) {
      params.delete("q");
    } else {
      params.set("q", q);
    }

    if (sort === "createdAt") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }

    if (dir === "desc") {
      params.delete("dir");
    } else {
      params.set("dir", dir);
    }

    if (!clickedOnly) {
      params.delete("clicked");
    } else {
      params.set("clicked", "1");
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [clickedOnly, debounced, dir, pathname, searchParams, sort]);

  useEffect(() => {
    // Avoid pushing a new history entry for every keypress.
    router.replace(nextHref, { scroll: false });
  }, [nextHref, router]);

  const hasQuery = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          inputMode="search"
          name="q"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("links.search.placeholder")}
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-sm underline underline-offset-4 text-zinc-700 dark:text-zinc-300"
          >
            {t("links.search.clear")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={clickedOnly}
            onChange={(e) => setClickedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
          />
          {t("links.search.clickedOnly")}
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {t("links.search.sort")}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm outline-none dark:border-white/15 dark:bg-black"
          >
            <option value="createdAt">{t("links.search.created")}</option>
            <option value="clickCount">{t("links.search.clicks")}</option>
            <option value="lastClickedAt">{t("links.search.lastClick")}</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {t("links.search.dir")}
          </span>
          <select
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm outline-none dark:border-white/15 dark:bg-black"
          >
            <option value="desc">{t("links.search.desc")}</option>
            <option value="asc">{t("links.search.asc")}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
