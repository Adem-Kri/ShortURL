type UrlValidationOptions = {
  maxLength?: number;
  allowLocalhost?: boolean;
  allowPrivateIp?: boolean;
};

function isValidIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function isPrivateIpv4(hostname: string): boolean {
  if (!isValidIpv4(hostname)) return false;
  const [a, b] = hostname.split(".").map((x) => Number(x));
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function looksLikeIpv6(hostname: string): boolean {
  return hostname.includes(":");
}

function isPrivateIpv6(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "::1") return true;
  // Unique local addresses: fc00::/7 (fc.. or fd..)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // Link-local unicast: fe80::/10
  if (lower.startsWith("fe80")) return true;
  return false;
}

function isLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower.endsWith(".localhost");
}

export function normalizeAndValidateUrl(
  input: unknown,
  options: UrlValidationOptions = {},
): {
  ok: true;
  normalized: string;
} | {
  ok: false;
  error: string;
} {
  if (typeof input !== "string") {
    return { ok: false, error: "url must be a string" };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "url is required" };
  }

  const maxLength = options.maxLength ?? 2048;
  if (trimmed.length > maxLength) {
    return { ok: false, error: `url is too long (max ${maxLength} chars)` };
  }

  // Give a clearer error than the generic URL() exception.
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return { ok: false, error: "url must start with http:// or https://" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "invalid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "only http/https URLs are allowed" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "credentials in URL are not allowed" };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { ok: false, error: "url must include a hostname" };
  }

  const allowLocalhost = options.allowLocalhost ?? false;
  const allowPrivateIp = options.allowPrivateIp ?? false;

  if (!allowLocalhost && isLocalhost(hostname)) {
    return { ok: false, error: "localhost URLs are not allowed" };
  }

  if (!allowPrivateIp) {
    if (isPrivateIpv4(hostname)) {
      return { ok: false, error: "private network IPs are not allowed" };
    }
    if (looksLikeIpv6(hostname) && isPrivateIpv6(hostname)) {
      return { ok: false, error: "private network IPs are not allowed" };
    }
  }

  return { ok: true, normalized: parsed.toString() };
}
