import { NextResponse, type NextRequest } from "next/server";

import { pickLocaleFromAcceptLanguage } from "./src/i18n/acceptLanguage";
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
} from "./src/i18n/locales";
import {
  adminSessionCookieName,
  verifyAdminSessionToken,
} from "./src/server/adminSession";

export const config = {
  matcher: [
    // All pages except Next internals / static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAdmin =
    pathname.startsWith("/links") ||
    (pathname.startsWith("/admin") && pathname !== "/admin/login");

  const localeCookie = request.cookies.get(localeCookieName)?.value;
  const hasValidLocaleCookie =
    !!localeCookie && isSupportedLocale(localeCookie);

  const accept = request.headers.get("accept-language");
  const locale = accept ? pickLocaleFromAcceptLanguage(accept) : defaultLocale;

  if (needsAdmin) {
    const token = request.cookies.get(adminSessionCookieName)?.value;
    const session = token ? await verifyAdminSessionToken(token) : null;
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

      const redirectResponse = NextResponse.redirect(loginUrl);
      if (!hasValidLocaleCookie) {
        redirectResponse.cookies.set({
          name: localeCookieName,
          value: locale,
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return redirectResponse;
    }
  }

  if (hasValidLocaleCookie) return NextResponse.next();

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
