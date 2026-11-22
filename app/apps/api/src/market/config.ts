import { readFileSync } from 'node:fs';
import { z } from 'zod';
export const AssetSchema = z.object({ ticker: z.string().regex(/^[A-Z0-9.^=-]{1,24}$/), name: z.string().max(150), region: z.string().max(50), exchange: z.string().max(20), providerSymbol: z.string().max(80), currency: z.string().regex(/^[A-Z]{3}$/), kind: z.enum(['equity','crypto']) });
export type MarketAsset = z.infer<typeof AssetSchema>;
export const CalendarSchema = z.object({
  source: z.string().url(), verifiedAt: z.iso.datetime(), validUntil: z.iso.datetime(),
  sessions: z.array(z.object({ exchange: z.string().max(20), timezone: z.string().max(80), open: z.iso.datetime({ offset: true }), close: z.iso.datetime({ offset: true }) })).max(20000),
});
export function universe(): MarketAsset[] {
  if (!process.env.MARKET_UNIVERSE_FILE) return [];
  const assets = z.array(AssetSchema).max(500).parse(JSON.parse(readFileSync(process.env.MARKET_UNIVERSE_FILE, 'utf8')));
  if (new Set(assets.map(a=>a.ticker)).size !== assets.length) throw new Error('Tickers duplicados');
  return assets;
}
export function dueSlots(now = new Date(), includeEquities = true): { slot: string; exchange: string }[] {
  const due: { slot: string; exchange: string }[] = [];
  if (includeEquities && process.env.MARKET_CALENDAR_FILE) {
    const c = CalendarSchema.parse(JSON.parse(readFileSync(process.env.MARKET_CALENDAR_FILE, 'utf8')));
    if (Date.parse(c.validUntil) < now.getTime() || Date.parse(c.verifiedAt) > now.getTime()) throw new Error('Calendario vencido o inválido');
    for (const s of c.sessions) {
      new Intl.DateTimeFormat('en', { timeZone: s.timezone });
      if (Date.parse(s.close) <= Date.parse(s.open)) throw new Error('Sesión de mercado inválida');
      for (const phase of ['open','close'] as const) {
        const trigger = Date.parse(s[phase]) - 15 * 60_000;
        if (now.getTime() >= trigger && now.getTime() < trigger + 15 * 60_000) due.push({slot: `${s.exchange}:${s[phase]}:pre-${phase}`, exchange:s.exchange});
      }
    }
  }
  // Crypto has no exchange close: these are two daily UTC analysis cuts.
  for (const hour of [0,12]) {
    const d = new Date(now); d.setUTCHours(hour,0,0,0);
    if (now.getTime() >= d.getTime() && now.getTime() < d.getTime()+15*60_000) due.push({slot:`CRYPTO:${d.toISOString()}`,exchange:'CRYPTO'});
  }
  return due;
}
