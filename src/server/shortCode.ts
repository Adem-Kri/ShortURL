import "server-only";

import crypto from "node:crypto";

const BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" as const;

const RESERVED_CODES = new Set([
  "api",
  "links",
  "_next",
  "favicon.ico",
]);

export function generateShortCode(length = 6): string {
  if (length < 4 || length > 32) {
    throw new Error("short code length must be between 4 and 32");
  }

  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += BASE62_ALPHABET[bytes[i] % BASE62_ALPHABET.length];
  }
  return out;
}

export function validateCustomShortCode(input: unknown):
  | { ok: true; shortCode: string }
  | { ok: false; error: string } {
  if (input == null || input === "") {
    return { ok: false, error: "customCode is empty" };
  }
  if (typeof input !== "string") {
    return { ok: false, error: "customCode must be a string" };
  }

  const code = input.trim();
  if (code.length < 4 || code.length > 32) {
    return { ok: false, error: "customCode length must be between 4 and 32" };
  }
  if (!/^[0-9A-Za-z]+$/.test(code)) {
    return { ok: false, error: "customCode must be base62 (0-9, A-Z, a-z)" };
  }
  if (RESERVED_CODES.has(code.toLowerCase())) {
    return { ok: false, error: "customCode is reserved" };
  }
  return { ok: true, shortCode: code };
}
