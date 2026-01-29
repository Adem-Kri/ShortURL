import "server-only";

import { prisma } from "@/server/db";

export function getClientIp(request: Request): string {
  const trustProxy = process.env.TRUST_PROXY === "1";

  if (trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}> {
  const now = new Date();
  const newResetAt = new Date(now.getTime() + input.windowMs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({
      where: { key: input.key },
      select: { resetAt: true, count: true },
    });

    if (!existing || existing.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key: input.key },
        create: { key: input.key, resetAt: newResetAt, count: 1 },
        update: { resetAt: newResetAt, count: 1 },
        select: { key: true },
      });

      return {
        ok: true,
        remaining: Math.max(0, input.limit - 1),
        retryAfterSeconds: Math.ceil(input.windowMs / 1000),
      };
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
    );

    if (existing.count >= input.limit) {
      return { ok: false, remaining: 0, retryAfterSeconds };
    }

    const nextCount = existing.count + 1;
    await tx.rateLimitBucket.update({
      where: { key: input.key },
      data: { count: { increment: 1 } },
      select: { key: true },
    });

    return {
      ok: true,
      remaining: Math.max(0, input.limit - nextCount),
      retryAfterSeconds,
    };
  });
}
