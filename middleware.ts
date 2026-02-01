import { NextResponse, type NextRequest } from "next/server";

import { pickLocaleFromAcceptLanguage } from "./src/i18n/acceptLanguage";
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
} from "./src/i18n/locales";

export const config = {
  matcher: [
    // All pages except Next internals / static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get(localeCookieName)?.value;
  if (cookie && isSupportedLocale(cookie)) {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept-language");
  const locale = accept ? pickLocaleFromAcceptLanguage(accept) : defaultLocale;

  const response = NextResponse.next();
  response.cookies.set({
    name: localeCookieName,
    value: locale,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
