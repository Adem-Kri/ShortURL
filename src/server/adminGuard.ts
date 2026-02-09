import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import {
  adminSessionCookieName,
  getCookieFromHeader,
  verifyAdminSessionToken,
} from "@/server/adminSession";

export async function isAdminFromRequest(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie");
  const token = getCookieFromHeader(cookieHeader, adminSessionCookieName);
  if (!token) return false;
  const session = await verifyAdminSessionToken(token);
  return !!session;
}

export async function requireAdminApi(
  request: Request,
): Promise<NextResponse | null> {
  const ok = await isAdminFromRequest(request);
  if (ok) return null;

  return NextResponse.json(
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "www-authenticate": 'Bearer realm="admin"',
      },
    },
  );
}

export async function requireAdminPage(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  if (!token) {
    redirect("/admin/login");
  }

  const session = await verifyAdminSessionToken(token);
  if (!session) {
    redirect("/admin/login");
  }
}
