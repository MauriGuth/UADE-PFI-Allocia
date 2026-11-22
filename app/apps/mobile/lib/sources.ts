// Identidad de las FUENTES (proveedores de datos y medios de noticias), igual que en la web
// (apps/web/lib/source-logos.ts). En la app se muestran como monogramas: nunca se descarga el logo de un tercero.
export interface SourceBrand {
  id: string;
  name: string;
  /** Texto del recuadro cuando no hay logo (1–4 letras). */
  monogram: string;
  /** Expresión que reconoce a la fuente en un nombre, un enlace o el sufijo de un titular. */
  match: RegExp;
}

export const SOURCES: SourceBrand[] = [
  // Proveedores de datos
  { id: "finnhub", name: "Finnhub", monogram: "F", match: /finnhub/i },
  { id: "coingecko", name: "CoinGecko", monogram: "CG", match: /coingecko/i },
  { id: "fred", name: "FRED", monogram: "FRED", match: /\bFRED\b|st\.? louis/i },
  { id: "alternative", name: "Alternative.me", monogram: "alt", match: /alternative\.me/i },
  { id: "defillama", name: "DefiLlama", monogram: "DL", match: /defillama/i },
  { id: "polymarket", name: "Polymarket", monogram: "PM", match: /polymarket/i },
  { id: "gpr", name: "Índice GPR (Caldara e Iacoviello)", monogram: "GPR", match: /caldara|iacoviello|\bGPR\b/i },
  // Medios de noticias
  { id: "reuters", name: "Reuters", monogram: "R", match: /reuters/i },
  { id: "cnbc", name: "CNBC", monogram: "CNBC", match: /cnbc/i },
  { id: "bloomberg", name: "Bloomberg", monogram: "B", match: /bloomberg/i },
  { id: "wsj", name: "The Wall Street Journal", monogram: "WSJ", match: /wall street journal|wsj\.com|\bWSJ\b/i },
  { id: "ft", name: "Financial Times", monogram: "FT", match: /financial times|ft\.com/i },
  { id: "yahoo", name: "Yahoo Finance", monogram: "Y!", match: /yahoo/i },
  { id: "marketwatch", name: "MarketWatch", monogram: "MW", match: /marketwatch/i },
  { id: "barrons", name: "Barron's", monogram: "B", match: /barron/i },
  { id: "seekingalpha", name: "Seeking Alpha", monogram: "SA", match: /seeking ?alpha/i },
  { id: "investopedia", name: "Investopedia", monogram: "IN", match: /investopedia/i },
  { id: "infobae", name: "Infobae", monogram: "IB", match: /infobae/i },
  { id: "ambito", name: "Ámbito", monogram: "Á", match: /ambito/i },
  { id: "lanacion", name: "La Nación", monogram: "LN", match: /lanacion/i },
  // Medios sin archivo de logo: monograma (nunca se descarga un logo de un tercero).
  { id: "ap", name: "Associated Press", monogram: "AP", match: /associated press|apnews\.com|\bAP News\b/i },
  { id: "investing", name: "Investing.com", monogram: "IV", match: /investing\.com/i },
  { id: "benzinga", name: "Benzinga", monogram: "BZ", match: /benzinga/i },
  { id: "fool", name: "The Motley Fool", monogram: "MF", match: /motley fool|fool\.com/i },
  { id: "businessinsider", name: "Business Insider", monogram: "BI", match: /business insider|businessinsider/i },
  { id: "forbes", name: "Forbes", monogram: "F", match: /forbes/i },
  { id: "fortune", name: "Fortune", monogram: "F", match: /fortune\.com|^fortune$/i },
  { id: "axios", name: "Axios", monogram: "AX", match: /axios/i },
  { id: "nyt", name: "The New York Times", monogram: "NYT", match: /new york times|nytimes/i },
  { id: "economist", name: "The Economist", monogram: "E", match: /economist/i },
  { id: "foxbusiness", name: "Fox Business", monogram: "FB", match: /fox business|foxbusiness/i },
  { id: "coindesk", name: "CoinDesk", monogram: "CD", match: /coindesk/i },
  { id: "cointelegraph", name: "Cointelegraph", monogram: "CT", match: /cointelegraph/i },
];

/** Todas las fuentes reconocidas en un texto (sin repetir), en el orden en que aparecen en el registro. */
export function sourceBrandsIn(text: string | null | undefined): SourceBrand[] {
  if (!text) return [];
  return SOURCES.filter((s) => s.match.test(text));
}

export function sourceBrandFor(text: string | null | undefined): SourceBrand | null {
  return sourceBrandsIn(text)[0] ?? null;
}

/** Monograma de un medio que no está en el registro: iniciales de sus palabras («The Hill» → «TH»). */
export function monogramOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s.&]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].replace(/\..*$/, "").slice(0, 2).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

/**
 * Medio que publicó una noticia. Orden: el medio que informa el backend (proveedor o sufijo del titular), el enlace
 * («https://www.cnbc.com/…») y el sufijo del titular. Un enlace de agregador (Google News) no identifica al medio.
 * Devuelve null si no se reconoce: no se inventa.
 */
export function publisherOf(e: { titulo: string; fuente: string; medio?: string }): SourceBrand | null {
  const news = SOURCES.filter((s) => !["finnhub", "coingecko", "fred", "alternative", "defillama", "polymarket", "gpr"].includes(s.id));
  const named = e.medio?.trim();
  if (named) {
    return news.find((s) => s.match.test(named)) ?? { id: `medio:${named.toLowerCase()}`, name: named, monogram: monogramOf(named), match: /$^/ };
  }
  const url = e.fuente.match(/https?:\/\/[^\s]+/)?.[0] ?? "";
  let host = "";
  try {
    host = (url.match(/^https?:\/\/([^/?#]+)/)?.[1] ?? "");
  } catch {
    host = "";
  }
  const suffix = e.titulo.match(/\s[-–—]\s([^-–—]{2,40})$/)?.[1] ?? "";
  return news.find((s) => s.match.test(host)) ?? news.find((s) => s.match.test(suffix)) ?? null;
}
