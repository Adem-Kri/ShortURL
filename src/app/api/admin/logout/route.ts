import { NextResponse } from "next/server";

import { adminSessionCookieName } from "@/server/adminSession";

export const runtime = "nodejs";

function clearCookie(response: NextResponse) {
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url), { status: 303 });
  clearCookie(response);
  return response;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url), { status: 303 });
  clearCookie(response);
  return response;
}
