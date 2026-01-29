import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { normalizeAndValidateUrl } from "@/lib/url";
import { createShortLinkForUrl, createShortLinkForUrlWithCustomCode } from "@/server/linkService";
import { checkRateLimit, getClientIp } from "@/server/rateLimit";
import { validateCustomShortCode } from "@/server/shortCode";
import { logEvent } from "@/server/logging";

export const runtime = "nodejs";

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    key: `create:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    logEvent("rate_limit", { action: "create", ip });
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

  const urlInput = (body as { url?: unknown; customCode?: unknown; ttlSeconds?: unknown; oneTime?: unknown } | null)?.url;
  const customCodeInput = (body as { url?: unknown; customCode?: unknown; ttlSeconds?: unknown; oneTime?: unknown } | null)?.customCode;
  const ttlSecondsInput = (body as { ttlSeconds?: unknown } | null)?.ttlSeconds;
  const oneTimeInput = (body as { oneTime?: unknown } | null)?.oneTime;

  const oneTime = oneTimeInput === true;
  let expiresAt: Date | undefined;
  if (ttlSecondsInput != null && ttlSecondsInput !== "") {
    const ttlSeconds =
      typeof ttlSecondsInput === "number"
        ? ttlSecondsInput
        : Number(String(ttlSecondsInput));

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      return NextResponse.json({ error: "ttlSeconds must be a positive number" }, { status: 400 });
    }

    // Guardrail: max 365 days.
    if (ttlSeconds > 365 * 24 * 60 * 60) {
      return NextResponse.json({ error: "ttlSeconds is too large" }, { status: 400 });
    }

    expiresAt = new Date(Date.now() + Math.floor(ttlSeconds) * 1000);
  }

  const isDev = process.env.NODE_ENV !== "production";
  const validated = normalizeAndValidateUrl(urlInput, {
    maxLength: 2048,
    allowLocalhost: isDev,
    allowPrivateIp: isDev,
  });
  if (!validated.ok) {
    logEvent("create_rejected", { ip, reason: validated.error });
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  let created: { shortCode: string; originalUrl: string };
  if (customCodeInput != null && customCodeInput !== "") {
    const custom = validateCustomShortCode(customCodeInput);
    if (!custom.ok) {
      return NextResponse.json({ error: custom.error }, { status: 400 });
    }

    try {
      created = await createShortLinkForUrlWithCustomCode({
        originalUrl: validated.normalized,
        shortCode: custom.shortCode,
        expiresAt,
        oneTime,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        logEvent("create_conflict", { ip, shortCode: custom.shortCode });
        return NextResponse.json({ error: "customCode already exists" }, { status: 409 });
      }
      throw error;
    }
  } else {
    created = await createShortLinkForUrl(validated.normalized, { expiresAt, oneTime });
  }

  const baseUrl = getBaseUrl(request);

  logEvent("create_ok", { ip, shortCode: created.shortCode });

  return NextResponse.json(
    {
      shortCode: created.shortCode,
      shortUrl: `${baseUrl}/${created.shortCode}`,
      originalUrl: created.originalUrl,
    },
    { status: 201 },
  );
}
