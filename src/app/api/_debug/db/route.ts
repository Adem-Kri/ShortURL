import { NextResponse } from "next/server";

import {
  findShortLinkByCode,
  upsertShortLinkByCode,
} from "@/server/shortLinkRepo";
import { requireAdminApi } from "@/server/adminGuard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const auth = await requireAdminApi(request);
  if (auth) return auth;

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
