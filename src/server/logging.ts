import "server-only";

export function logEvent(event: string, data?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...(data ?? {}),
  };

  console.log(JSON.stringify(payload));
}
