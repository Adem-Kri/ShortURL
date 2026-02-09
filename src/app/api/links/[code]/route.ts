import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { deleteLinkByCode, resolveOriginalUrl } from "@/server/linkService";
import { normalizeAndValidateUrl } from "@/lib/url";
import { checkRateLimit, getClientIp } from "@/server/rateLimit";
import { logEvent } from "@/server/logging";
import { prisma } from "@/server/db";
import { requireAdminApi } from "@/server/adminGuard";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const auth = await requireAdminApi(request);
  if (auth) return auth;

  const { code } = await context.params;

  const originalUrl = await resolveOriginalUrl(code);
  if (!originalUrl) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ originalUrl }, { status: 200 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const auth = await requireAdminApi(request);
  if (auth) return auth;

  const { code } = await context.params;

  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    key: `delete:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    logEvent("rate_limit", { action: "delete", ip });
    return NextResponse.json(
      { error: "rate limit exceeded" },
      {
        status: 429,
        headers: {
          "retry-after": rl.retryAfterSeconds.toString(),
          "x-ratelimit-remaining": rl.remaining.toString(),
        },
      },
    );
  }

  try {
    await deleteLinkByCode(code);
    logEvent("delete_ok", { ip, shortCode: code });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    // P2025 = record not found
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logEvent("delete_not_found", { ip, shortCode: code });
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    logEvent("delete_failed", { ip, shortCode: code });
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const auth = await requireAdminApi(request);
  if (auth) return auth;

  const { code } = await context.params;

  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    key: `update:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    logEvent("rate_limit", { action: "update", ip });
    return NextResponse.json(
      { error: "rate limit exceeded" },
      {
        status: 429,
        headers: {
          "retry-after": rl.retryAfterSeconds.toString(),
          "x-ratelimit-remaining": rl.remaining.toString(),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const urlInput = (body as { url?: unknown } | null)?.url;

  const isDev = process.env.NODE_ENV !== "production";
  const validated = normalizeAndValidateUrl(urlInput, {
    maxLength: 2048,
    allowLocalhost: isDev,
    allowPrivateIp: isDev,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const row = await prisma.shortLink.update({
      where: { shortCode: code },
      data: { originalUrl: validated.normalized },
      select: { shortCode: true, originalUrl: true },
    });

    logEvent("update_ok", { ip, shortCode: code });
    return NextResponse.json(row, { status: 200 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logEvent("update_not_found", { ip, shortCode: code });
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    logEvent("update_failed", { ip, shortCode: code });
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
