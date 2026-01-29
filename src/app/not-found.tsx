import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The page you’re looking for doesn’t exist or was moved.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Go to Shorten
        </Link>
        <Link
          href="/links"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/5"
        >
          View Links
        </Link>
      </div>

      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
        Tip: if you typed a short code manually, double-check it.
      </p>
    </section>
  );
}
