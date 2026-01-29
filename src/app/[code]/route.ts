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

    if (result.reason === "not_found") {
      logEvent("redirect_not_found", { ip, shortCode: code });
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    logEvent("redirect_gone", { ip, shortCode: code, reason: result.reason });
    return new Response(
      result.reason === "expired" ? "Link expired" : "Link already used",
      {
        status: 410,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  logEvent("redirect_ok", { ip: getClientIp(request), shortCode: code });

  // Use 302 so destinations can change without permanent caching.
  return NextResponse.redirect(result.originalUrl, 302);
}
