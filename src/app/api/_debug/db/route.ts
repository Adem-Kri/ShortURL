import { NextResponse } from "next/server";

import { findShortLinkByCode, upsertShortLinkByCode } from "@/server/shortLinkRepo";

export const runtime = "nodejs";

export async function GET() {
  const shortCode = "debug123";
  const originalUrl = "https://example.com";

  const createdOrUpdated = await upsertShortLinkByCode({
    shortCode,
    originalUrl,
  });

  const readBack = await findShortLinkByCode(shortCode);

  return NextResponse.json({
    createdOrUpdated,
    readBack,
  });
}
