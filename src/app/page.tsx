"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CreateLinkResponse = {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
};

export default function HomePage() {
  const [url, setUrl] = useState<string>("");
  const [customCode, setCustomCode] = useState<string>("");
  const [ttlSeconds, setTtlSeconds] = useState<string>("");
  const [oneTime, setOneTime] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);
  const [result, setResult] = useState<CreateLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setRetryAfterSeconds(0);
    setLoading(true);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          customCode: customCode.trim() || undefined,
          ttlSeconds: ttlSeconds || undefined,
          oneTime,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | CreateLinkResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0") || 0;
          setRetryAfterSeconds(retryAfter);
        }

        const message =
          data && "error" in data && data.error ? data.error : "request failed";
        setError(
          message === "customCode already exists"
            ? "That alias is already taken. Try another one."
            : message,
        );
        return;
      }

      setResult(data as CreateLinkResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  // Simple retry-after countdown.
  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const id = window.setTimeout(() => {
      setRetryAfterSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [retryAfterSeconds]);

  async function copyShortUrl() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to copy");
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">URL Shortener</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Paste a long URL, get a short link.
      </p>
      <div className="mt-3">
        <Link
          href="/links"
          className="text-sm font-medium underline underline-offset-4 text-zinc-700 dark:text-zinc-300"
        >
          View link stats
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-black sm:p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="url">
            Long URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com/some/very/long/path"
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium" htmlFor="customCode">
              Custom alias (optional)
            </label>
            <input
              id="customCode"
              name="customCode"
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="e.g. my-project"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              Must be base62 (0-9, A-Z, a-z), 4–32 chars.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="ttlSeconds">
                Expires in (optional)
              </label>
              <select
                id="ttlSeconds"
                name="ttlSeconds"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
              >
                <option value="">Never</option>
                <option value="3600">1 hour</option>
                <option value="86400">24 hours</option>
                <option value="604800">7 days</option>
                <option value="2592000">30 days</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 dark:border-white/20"
                  checked={oneTime}
                  onChange={(e) => setOneTime(e.target.checked)}
                />
                One-time use
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || retryAfterSeconds > 0}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {loading
                ? "Shortening…"
                : retryAfterSeconds > 0
                  ? `Try again in ${retryAfterSeconds}s`
                  : "Shorten"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setUrl("");
                setCustomCode("");
                setTtlSeconds("");
                setOneTime(false);
                setError(null);
                setResult(null);
                setCopied(false);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 sm:p-4">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5 sm:p-4">
            <div className="text-sm">
              <div className="text-zinc-600 dark:text-zinc-400">Short link</div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <a
                  className="font-medium underline underline-offset-4"
                  href={result.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {result.shortUrl}
                </a>
                <button
                  type="button"
                  onClick={copyShortUrl}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-3 text-zinc-600 dark:text-zinc-400">Original URL</div>
              <div className="mt-1 break-all">{result.originalUrl}</div>
              <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                Visiting <span className="font-mono">/{result.shortCode}</span> redirects and increments the click count.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
