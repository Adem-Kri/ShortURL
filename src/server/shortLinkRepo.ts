import "server-only";

import { prisma } from "./db";

export async function createShortLink(input: {
  shortCode: string;
  originalUrl: string;
}) {
  return prisma.shortLink.create({
    data: {
      shortCode: input.shortCode,
      originalUrl: input.originalUrl,
    },
  });
}

export async function findShortLinkByCode(shortCode: string) {
  return prisma.shortLink.findUnique({
    where: { shortCode },
  });
}

export async function upsertShortLinkByCode(input: {
  shortCode: string;
  originalUrl: string;
}) {
  return prisma.shortLink.upsert({
    where: { shortCode: input.shortCode },
    create: {
      shortCode: input.shortCode,
      originalUrl: input.originalUrl,
    },
    update: {
      originalUrl: input.originalUrl,
    },
  });
}
