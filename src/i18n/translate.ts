export type Messages = Record<string, unknown>;
export type TranslationValues = Record<string, string | number>;

function getPath(obj: unknown, path: string): unknown {
  if (!obj) return undefined;
  const parts = path.split(".").filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = values[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}

export function createTranslator(current: Messages, fallback?: Messages) {
  return (key: string, values?: TranslationValues): string => {
    const fromCurrent = getPath(current, key);
    const fromFallback = fallback ? getPath(fallback, key) : undefined;
    const raw = (typeof fromCurrent === "string" ? fromCurrent : undefined) ??
      (typeof fromFallback === "string" ? fromFallback : undefined);

    if (!raw) return key;
    return interpolate(raw, values);
  };
}
