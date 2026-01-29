import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { generateShortCode } from "@/server/shortCode";

export async function createShortLinkForUrl(
  originalUrl: string,
  options?: { expiresAt?: Date; oneTime?: boolean },
): Promise<{
  shortCode: string;
  originalUrl: string;
}> {
  return createShortLinkForUrlWithOptions({ originalUrl, ...options });
}

async function createShortLinkForUrlWithOptions(input: {
  originalUrl: string;
  expiresAt?: Date;
  oneTime?: boolean;
}): Promise<{
  shortCode: string;
  originalUrl: string;
}> {
  // Educational + simple: generate random base62 code and retry on collisions.
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const shortCode = generateShortCode(6);

    try {
      const row = await prisma.shortLink.create({
        data: {
          shortCode,
          originalUrl: input.originalUrl,
          expiresAt: input.expiresAt,
          oneTime: input.oneTime ?? false,
        },
        select: {
          shortCode: true,
          originalUrl: true,
        },
      });

      return row;
    } catch (error) {
      // P2002 = unique constraint failed (collision on shortCode)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate a unique short code");
}

export async function createShortLinkForUrlWithCustomCode(input: {
  originalUrl: string;
  shortCode: string;
  expiresAt?: Date;
  oneTime?: boolean;
}): Promise<{
  shortCode: string;
  originalUrl: string;
}> {
  const row = await prisma.shortLink.create({
    data: {
      shortCode: input.shortCode,
      originalUrl: input.originalUrl,
      expiresAt: input.expiresAt,
      oneTime: input.oneTime ?? false,
    },
    select: {
      shortCode: true,
      originalUrl: true,
    },
  });

  return row;
}

export async function resolveOriginalUrl(shortCode: string): Promise<string | null> {
  const row = await prisma.shortLink.findUnique({
    where: { shortCode },
    select: { originalUrl: true },
  });

  return row?.originalUrl ?? null;
}

export type ResolveAndTrackResult =
  | { ok: true; originalUrl: string }
  | { ok: false; reason: "not_found" | "expired" | "consumed" };

export async function resolveAndTrackClick(shortCode: string): Promise<ResolveAndTrackResult> {
  const now = new Date();

  type GuardRow = {
    originalUrl: string;
    expiresAt: Date | null;
    oneTime: boolean;
    consumedAt: Date | null;
  };

  return prisma.$transaction(async (tx) => {
    const row = (await tx.shortLink.findUnique({
      where: { shortCode },
      select: {
        originalUrl: true,
        expiresAt: true,
        oneTime: true,
        consumedAt: true,
      } as unknown as Prisma.ShortLinkSelect,
    })) as GuardRow | null;

    if (!row) return { ok: false, reason: "not_found" };

    if (row.expiresAt && row.expiresAt <= now) {
      return { ok: false, reason: "expired" };
    }

    if (row.oneTime) {
      if (row.consumedAt) return { ok: false, reason: "consumed" };

      const oneTimeWhere = {
        shortCode,
        consumedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      } as unknown as Prisma.ShortLinkWhereInput;

      const oneTimeData = {
        clickCount: { increment: 1 },
        lastClickedAt: now,
        consumedAt: now,
      } as unknown as Prisma.ShortLinkUpdateManyMutationInput;

      const updated = await tx.shortLink.updateMany({
        where: oneTimeWhere,
        data: oneTimeData,
      });

      if (updated.count === 0) {
        const fresh = (await tx.shortLink.findUnique({
          where: { shortCode },
          select: { expiresAt: true, consumedAt: true } as unknown as Prisma.ShortLinkSelect,
        })) as { expiresAt: Date | null; consumedAt: Date | null } | null;
        if (!fresh) return { ok: false, reason: "not_found" };
        if (fresh.expiresAt && fresh.expiresAt <= now) return { ok: false, reason: "expired" };
        if (fresh.consumedAt) return { ok: false, reason: "consumed" };
        return { ok: false, reason: "consumed" };
      }

      return { ok: true, originalUrl: row.originalUrl };
    }

    const normalWhere = {
      shortCode,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    } as unknown as Prisma.ShortLinkWhereInput;

    const normalData = {
      clickCount: { increment: 1 },
      lastClickedAt: now,
    } as unknown as Prisma.ShortLinkUpdateManyMutationInput;

    const updated = await tx.shortLink.updateMany({ where: normalWhere, data: normalData });

    if (updated.count === 0) {
      const fresh = (await tx.shortLink.findUnique({
        where: { shortCode },
        select: { expiresAt: true } as unknown as Prisma.ShortLinkSelect,
      })) as { expiresAt: Date | null } | null;
      if (!fresh) return { ok: false, reason: "not_found" };
      if (fresh.expiresAt && fresh.expiresAt <= now) return { ok: false, reason: "expired" };
      return { ok: false, reason: "expired" };
    }

    return { ok: true, originalUrl: row.originalUrl };
  });
}

export async function listRecentLinks(input: {
  limit?: number;
  query?: string;
  clickedOnly?: boolean;
  sort?: string;
  dir?: string;
}) {
  const limit = input.limit ?? 50;
  const q = input.query?.trim();
  const clickedOnly = input.clickedOnly ?? false;

  type LinkSort = "createdAt" | "clickCount" | "lastClickedAt";
  const dir = input.dir === "asc" ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;
  const sort: LinkSort =
    input.sort === "clickCount" || input.sort === "lastClickedAt" ? input.sort : "createdAt";

  const select = {
    shortCode: true,
    originalUrl: true,
    createdAt: true,
    clickCount: true,
    lastClickedAt: true,
    expiresAt: true,
    oneTime: true,
    consumedAt: true,
  } as const;

  // When a query is present, Prisma+SQLite doesn't support case-insensitive contains.
  // Use a safe raw query with whitelisted ORDER BY columns.
  if (q) {
    const whereClicked = clickedOnly
      ? Prisma.sql`AND clickCount > 0`
      : Prisma.empty;

    const orderBy = (() => {
      if (sort === "clickCount") {
        return dir === "asc"
          ? Prisma.sql`ORDER BY clickCount ASC, createdAt DESC`
          : Prisma.sql`ORDER BY clickCount DESC, createdAt DESC`;
      }
      if (sort === "lastClickedAt") {
        // Put NULLs last.
        return dir === "asc"
          ? Prisma.sql`ORDER BY lastClickedAt IS NULL ASC, lastClickedAt ASC, createdAt DESC`
          : Prisma.sql`ORDER BY lastClickedAt IS NULL ASC, lastClickedAt DESC, createdAt DESC`;
      }
      return dir === "asc"
        ? Prisma.sql`ORDER BY createdAt ASC`
        : Prisma.sql`ORDER BY createdAt DESC`;
    })();

    const rows = await prisma.$queryRaw<
      Array<{
        shortCode: string;
        originalUrl: string;
        createdAt: Date;
        clickCount: number;
        lastClickedAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT shortCode, originalUrl, createdAt, clickCount, lastClickedAt
      FROM ShortLink
      WHERE (
        LOWER(shortCode) LIKE '%' || LOWER(${q}) || '%'
        OR LOWER(originalUrl) LIKE '%' || LOWER(${q}) || '%'
      )
      ${whereClicked}
      ${orderBy}
      LIMIT ${limit}
    `);

    return rows;
  }

  const where = clickedOnly ? { clickCount: { gt: 0 } } : undefined;

  const orderBy: Prisma.ShortLinkOrderByWithRelationInput[] = (() => {
    if (sort === "clickCount") return [{ clickCount: dir }, { createdAt: Prisma.SortOrder.desc }];
    if (sort === "lastClickedAt") return [{ lastClickedAt: dir }, { createdAt: Prisma.SortOrder.desc }];
    return [{ createdAt: dir }];
  })();

  return prisma.shortLink.findMany({
    take: limit,
    where,
    orderBy,
    select,
  });
}

export async function getLinkByCode(shortCode: string) {
  return prisma.shortLink.findUnique({
    where: { shortCode },
    select: {
      shortCode: true,
      originalUrl: true,
      createdAt: true,
      clickCount: true,
      lastClickedAt: true,
      expiresAt: true,
      oneTime: true,
      consumedAt: true,
    } as unknown as Prisma.ShortLinkSelect,
  });
}

export async function deleteLinkByCode(shortCode: string) {
  return prisma.shortLink.delete({
    where: { shortCode },
    select: { shortCode: true },
  });
}
