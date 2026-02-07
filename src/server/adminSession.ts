import crypto from "node:crypto";

export const adminSessionCookieName = "pds_admin_session";

type AdminSessionPayload = {
  sub: "admin";
  email: string;
};

type TokenPayload = AdminSessionPayload & {
  iat: number;
  exp: number;
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate a long random string and set it in .env.",
    );
  }
  return secret;
}

function getAuthSecretOrNull(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret ? secret : null;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function sign(data: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(data).digest();
  return base64UrlEncode(mac);
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function signAdminSessionToken(payload: {
  email: string;
}): Promise<string> {
  const secret = getAuthSecret();

  const header = { alg: "HS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);

  const body: TokenPayload = {
    sub: "admin",
    email: payload.email,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 60 * 24 * 7,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput, secret);

  return `${signingInput}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionPayload | null> {
  try {
    const secret = getAuthSecretOrNull();
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expected = sign(signingInput, secret);
    if (!timingSafeEqualString(signature, expected)) return null;

    const payloadJson = base64UrlDecodeToBuffer(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadJson) as Partial<TokenPayload>;

    if (payload.sub !== "admin") return null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) return null;

    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (!exp) return null;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) return null;

    return { sub: "admin", email };
  } catch {
    return null;
  }
}

export function getCookieFromHeader(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;

  // Tiny cookie parser (good enough for our use).
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
