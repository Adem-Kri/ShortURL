import { NextResponse } from "next/server";
import crypto from "node:crypto";

import {
  adminSessionCookieName,
  signAdminSessionToken,
} from "@/server/adminSession";

export const runtime = "nodejs";

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function safeNextPath(value: string | null): string {
  if (!value) return "/links";

  // Only allow relative paths to prevent open redirects.
  if (!value.startsWith("/")) return "/links";
  if (value.startsWith("//")) return "/links";

  return value;
}

async function getCredentials(request: Request): Promise<{
  email: string;
  password: string;
  next: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
      next?: unknown;
    } | null;

    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const next = typeof body?.next === "string" ? body.next : "/links";

    return { email, password, next };
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/links");

  return { email, password, next };
}

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      {
        error: "Admin login is not configured (ADMIN_EMAIL / ADMIN_PASSWORD).",
      },
      { status: 500 },
    );
  }

  const { email, password, next } = await getCredentials(request);

  const emailOk = email.trim().toLowerCase() === adminEmail.toLowerCase();
  const passwordOk = password ? timingSafeEqual(password, adminPassword) : false;

  if (!emailOk || !passwordOk) {
    const url = new URL(request.url);
    url.pathname = "/admin/login";
    url.searchParams.set("error", "invalid");
    url.searchParams.set("next", safeNextPath(next));
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await signAdminSessionToken({ email: adminEmail });

  const url = new URL(request.url);
  const destination = new URL(safeNextPath(next), url);

  const response = NextResponse.redirect(destination, { status: 303 });
  response.cookies.set({
    name: adminSessionCookieName,
    value: token,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
