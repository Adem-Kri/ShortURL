import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const next = asString(resolved?.next) ?? "/links";
  const error = asString(resolved?.error);

  return (
    <section className="mx-auto w-full max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Admin login</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Sign in to manage links.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-black sm:p-5">
        <form action="/api/admin/login" method="post" className="space-y-3">
          <input type="hidden" name="next" value={next} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-white/15 dark:bg-black"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              {error === "invalid" ? "Invalid credentials." : "Login failed."}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Sign in
          </button>
        </form>
      </div>

      <div className="mt-4 text-sm">
        <Link
          href="/"
          className="font-medium underline underline-offset-4 text-zinc-700 dark:text-zinc-300"
        >
          Back to shortener
        </Link>
      </div>
    </section>
  );
}
