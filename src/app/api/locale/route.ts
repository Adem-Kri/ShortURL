import { NextResponse } from "next/server";

import {
  isSupportedLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/locales";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    locale?: string;
  } | null;
  const next = body?.locale;

  if (!next || !isSupportedLocale(next)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale: next as Locale });
  response.cookies.set({
    name: localeCookieName,
    value: next,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
