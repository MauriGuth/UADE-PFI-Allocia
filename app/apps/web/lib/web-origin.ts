/** Exact, explicit origins only; never derive trust from forwarded headers. */
export function allowedWebOrigin(origin: string | null, configured: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) return false;
    return configured.split(",").map(value => value.trim()).some(value => {
      try { return new URL(value).origin === value && value === origin; }
      catch { return false; }
    });
  } catch { return false; }
}
