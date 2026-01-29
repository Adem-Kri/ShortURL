import Link from "next/link";

import { listRecentLinks } from "@/server/linkService";
import { LinksSearchBar } from "@/components/LinksSearchBar";
import { LinksList } from "@/components/LinksList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LinksPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LinksPage({ searchParams }: LinksPageProps) {
  // Keep this as a server-rendered page; filtering happens via querystring.
  const resolved = searchParams ? await searchParams : {};
  const q = asString(resolved?.q);
  const sort = asString(resolved?.sort);
  const dir = asString(resolved?.dir);
  const clicked = asString(resolved?.clicked);

  const links = await listRecentLinks({
    limit: 50,
    query: q,
    clickedOnly: clicked === "1",
    sort,
    dir,
  });

  const serializable = links.map((row) => ({
    shortCode: row.shortCode,
    originalUrl: row.originalUrl,
    createdAt: row.createdAt.toISOString(),
    clickCount: row.clickCount,
    lastClickedAt: row.lastClickedAt ? row.lastClickedAt.toISOString() : null,
  }));

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Links</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Recent shortened URLs and click counts.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/15 dark:bg-black">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/15 dark:bg-white/5">
          <LinksSearchBar initialQuery={q ?? ""} />
        </div>

        <LinksList links={serializable} />
      </div>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
        Tip: open a short link in another tab and refresh to see click counts.
      </p>
    </section>
  );
}
