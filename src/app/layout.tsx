import type { Metadata } from "next";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "@/app/providers";
import { getDirection } from "@/i18n/locales";
import { getFallbackMessages, getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PDS ShortURL",
    template: "%s · PDS ShortURL",
  },
  description: "Minimal URL shortener (Next.js + Prisma + SQLite)",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages, getFallbackMessages());
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="antialiased">
        <Providers locale={locale} messages={messages}>
          <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
          <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link href="/" className="font-semibold tracking-tight">
                  {t("app.name")}
                </Link>
              </div>
              <nav className="flex items-center gap-1">
                <NavLink href="/">{t("nav.shorten")}</NavLink>
                <NavLink href="/links">{t("nav.links")}</NavLink>
                <div className="ml-1">
                  <LanguageSwitcher currentLocale={locale} label={t("nav.language")} />
                </div>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>

          <footer className="border-t border-zinc-200/70 px-4 py-8 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-500 sm:px-6">
            {t("app.tagline")}
          </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
