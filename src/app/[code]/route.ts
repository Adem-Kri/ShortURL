import { NextResponse } from "next/server";

import { resolveAndTrackClick } from "@/server/linkService";
import { getClientIp } from "@/server/rateLimit";
import { logEvent } from "@/server/logging";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  const result = await resolveAndTrackClick(code);

  if (!result.ok) {
    const ip = getClientIp(request);

    const statusUrl = new URL("/status", request.url);
    statusUrl.searchParams.set("code", code);

    if (result.reason === "not_found") {
      logEvent("redirect_not_found", { ip, shortCode: code });
      statusUrl.searchParams.set("reason", "not_found");
      return NextResponse.redirect(statusUrl, 302);
    }

    logEvent("redirect_gone", { ip, shortCode: code, reason: result.reason });
    statusUrl.searchParams.set(
      "reason",
      result.reason === "expired" ? "expired" : "used",
    );
    return NextResponse.redirect(statusUrl, 302);
  }

  logEvent("redirect_ok", { ip: getClientIp(request), shortCode: code });

  // Use 302 so destinations can change without permanent caching.
  return NextResponse.redirect(result.originalUrl, 302);
}
