"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LinkDetailActions(props: {
  code: string;
  shortUrl: string;
  originalUrl: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destination, setDestination] = useState(props.originalUrl);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(props.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to copy");
    }
  }

  async function onDelete() {
    setError(null);
    const ok = window.confirm(`Delete /${props.code}? This cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(props.code)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = data?.error ?? "delete failed";
        setError(message);
        return;
      }

      router.push("/links");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function onSave() {
    setError(null);
    const url = destination.trim();
    if (!url) {
      setError("URL is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(props.code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = data?.error ?? "update failed";
        setError(message);
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Edit destination</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="url"
            inputMode="url"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
            placeholder="https://example.com"
          />
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
        >
          {copied ? "Copied" : "Copy short URL"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-300"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}
