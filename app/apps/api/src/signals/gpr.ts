import * as XLSX from 'xlsx';
import { GeoSignals } from './signals.types';

/**
 * Índice de riesgo geopolítico diario (GPRD) de Caldara e Iacoviello.
 * Fuente pública: planilla Excel actualizada periódicamente por los autores.
 * Se usa la media móvil de 30 días (GPRD_MA30) como valor de referencia, para
 * evitar el ruido de un único día; el valor diario y la media de 7 días quedan
 * disponibles para describir la tendencia. La media histórica del índice es ~100.
 */
export const GPR_DAILY_URL = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls';
export const GPR_MAX_AGE_MS = 21 * 24 * 3600_000; // la planilla se publica con días de rezago
export const GPR_CACHE_MS = 6 * 3600_000;
const MAX_BYTES = 8_000_000;

export interface GprReading { day: string; gprd: number; ma7: number; ma30: number; }

export async function marketBinary(url: URL): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'error', headers: { 'user-agent': 'Allocia/1.0 (uso académico)' } });
  if (!res.ok) throw new Error('Fuente no disponible');
  const reader = res.body?.getReader(); if (!reader) throw new Error('Respuesta vacía');
  let size = 0; const chunks: Uint8Array[] = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); throw new Error('Respuesta excesiva'); } chunks.push(value); }
  return Buffer.concat(chunks);
}

const num = (v: unknown): number => typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;

/** Convierte "20261019" en "2026-10-19". */
function dayToIso(v: unknown): string | null {
  const s = String(v ?? '').trim();
  if (!/^\d{8}$/.test(s)) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return Number.isFinite(Date.parse(iso)) ? iso : null;
}

export function parseGprDaily(buf: Buffer | ArrayBuffer): GprReading | null {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]]; if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const day = dayToIso(r.DAY), gprd = num(r.GPRD), ma7 = num(r.GPRD_MA7), ma30 = num(r.GPRD_MA30);
    if (day && [gprd, ma7, ma30].every(x => Number.isFinite(x) && x >= 0 && x < 10_000)) return { day, gprd, ma7, ma30 };
  }
  return null;
}

export function gprLevel(ma30: number): GeoSignals['gprLevel'] {
  return ma30 > 120 ? 'elevado' : ma30 >= 80 ? 'moderado' : 'bajo';
}
export function gprTrend(ma7: number, ma30: number): GeoSignals['tendencia'] {
  if (!(ma30 > 0)) return 'no disponible';
  const r = ma7 / ma30;
  return r > 1.05 ? 'ascendente' : r < 0.95 ? 'descendente' : 'estable';
}

let memo: { at: number; reading: GprReading | null } | null = null;
export function resetGprCache() { memo = null; }

/** Devuelve la última lectura válida y reciente, con caché en memoria de 6 horas. */
export async function fetchGprDaily(getBinary: (u: URL) => Promise<Buffer> = marketBinary, now = Date.now()): Promise<GprReading | null> {
  if (memo && now - memo.at < GPR_CACHE_MS) return memo.reading;
  let reading: GprReading | null = null;
  try {
    reading = parseGprDaily(await getBinary(new URL(GPR_DAILY_URL)));
    if (reading && now - Date.parse(reading.day) > GPR_MAX_AGE_MS) reading = null; // demasiado antiguo
    if (reading && Date.parse(reading.day) > now + 24 * 3600_000) reading = null; // fecha futura
  } catch { reading = null; }
  memo = { at: now, reading };
  return reading;
}
