// Cliente de la API del prototipo. En desarrollo (simulador de iOS) localhost
// apunta a la máquina anfitriona; en los builds de EAS se define
// EXPO_PUBLIC_API_URL con la URL del backend desplegado en Railway.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
if (!__DEV__ && !BASE.startsWith("https://")) throw new Error("La API debe usar HTTPS en la versión de distribución");

export class ApiError extends Error { constructor(message: string, public readonly status: number) { super(message); this.name = "ApiError"; } }

export interface Instrument {
  ticker: string;
  name: string;
  assetClass: "accion" | "etf" | "cripto" | "stablecoin";
  sector: string;
  region: string;
  currency: string;
  refPrice: number;
}

export interface EnrichedPosition {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  region: string;
  currency: string;
  quantity: number;
  refPrice: number;
  priceSource?: string;
  priceAsOf?: string;
  priceCheckedAt?: string;
  priceStatus?: 'recent' | 'reference' | 'demo';
  value: number;
  weight: number;
}

export interface ExposureItem {
  key: string;
  value: number;
  weight: number;
}

export interface Analysis {
  totalValue: number;
  positionCount: number;
  composition: {
    byClass: ExposureItem[];
    bySector: ExposureItem[];
    byRegion: ExposureItem[];
    byCurrency: ExposureItem[];
  };
  concentration: {
    hhi: number;
    hhiLevel: "baja" | "moderada" | "alta";
    effectiveN: number;
    topPosition: { ticker: string; weight: number } | null;
    top3Weight: number;
  };
  positions: EnrichedPosition[];
}

export interface Evidence {
  tipo: string;
  descripcion: string;
  valor: string;
  fuente: string;
}

export interface Observation {
  id: string;
  severidad: "info" | "atencion" | "alerta";
  categoria: string;
  titulo: string;
  mensaje: string;
  evidencia: Evidence[];
}

export interface ScenarioImpact {
  escenario: "favorable" | "base" | "adverso";
  descripcion: string;
  impactoTotalPct: number;
  porClase: { clase: string; shockPct: number; contribucionPct: number }[];
}

export interface ObservationsResponse {
  generadoEl: string;
  observaciones: Observation[];
  escenarios: ScenarioImpact[];
  escenariosConFuentes?: EvidenceScenario[];
}

export interface SignalsSnapshot {
  provenance?: Record<string, {source: string; origin: string; dataDate: string | null; fetchedAt?: string}>;
  snapshotDate: string;
  origen: string;
  geo: {
    gprIndex: number | null;
    gprLevel: string;
    tendencia: string;
    eventos: {
      titulo: string;
      regiones: string[];
      sectores: string[];
      impacto: string;
      descripcion: string;
      fuente: string;
      /** Medio que publicó la nota, si el backend lo identificó con certeza. */
      medio?: string;
      /** false: se muestra el texto original porque no se pudo traducir. Ausente en respuestas anteriores. */
      traducido?: boolean;
    }[];
  };
  emerging: {
    fearGreedIndex: number | null;
    fearGreedLabel: string;
    btcDominance: number | null;
    defiTvlUsd: number | null;
    tendenciaCripto: string;
    predictionMarkets: { pregunta: string; probabilidad: number; fuente: string; traducido?: boolean }[];
  };
}

// Token de sesión en memoria (persistido por el AuthContext) y callback
// para cerrar sesión automáticamente si el backend devuelve 401.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};
export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("No hay conexión con el servidor. Verificá tu internet e intentá de nuevo.");
  }

  // Algunas respuestas (DELETE, 204) pueden venir sin cuerpo: parsear con cuidado.
  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    // Una contraseña incorrecta (p. ej. al eliminar la cuenta) también responde 401,
    // pero la sesión sigue vigente: se informa el error sin cerrar la sesión.
    if (res.status === 401 && authToken && onUnauthorized && !/contraseña incorrecta/i.test(msg ?? "")) onUnauthorized();
    throw new ApiError(msg ?? `Error ${res.status}`, res.status);
  }
  return body as T;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface MarketCandidate {provider:'coingecko'|'finnhub';id:string;symbol:string;name:string}
export interface ResearchDisplay {technical:{status:string;asOf:string|null;samples:number;values:Record<string,number|null>;method:string};fundamentals:{retrievedAt:string;metrics:Record<string,number>;error?:string};history:{error?:string}}
export const api = {
  assetLogo: (ticker:string) => request<{dataUri:string|null;source:string|null}>("/catalog/"+encodeURIComponent(ticker)+"/logo"),
  requestAnalysis: () => request<{queued:number;message:string}>("/market/analyze", {method:"POST"}),
  searchCatalog: (query:string) => request<{results:MarketCandidate[];unavailable:string[]}>("/catalog/search", {method:"POST",body:JSON.stringify({query})}),
  importAsset: (candidate:MarketCandidate) => request<Instrument>("/catalog/import", {method:"POST",body:JSON.stringify({provider:candidate.provider,id:candidate.id})}),

  forgotPassword: (email:string) => request<{message:string}>("/auth/forgot-password",{method:"POST",body:JSON.stringify({email})}),
  requestVerification: () => request<{message:string}>("/auth/request-verification",{method:"POST"}),
  exportData: () => request<unknown>("/auth/export"),
  holdings: () => request<HoldingPosition[]>("/portfolio/holdings"),
  logout: () => request("/auth/logout", {method:"POST"}),
  me: () => request<AuthUser>("/auth/me"),
  deleteAccount: (password:string) => request("/auth/me", {method:"DELETE",body:JSON.stringify({password})}),
  opportunities: () => request<OpportunityFeed>("/market/opportunities"),
  opportunityPreferences: (enabled:boolean,scope:'all'|'watchlist') => request("/market/opportunities/preferences",{method:"PATCH",body:JSON.stringify({enabled,scope})}),
  followAsset: (ticker:string) => request("/market/opportunities/watchlist",{method:"POST",body:JSON.stringify({ticker})}),
  unfollowAsset: (ticker:string) => request("/market/opportunities/watchlist/"+encodeURIComponent(ticker),{method:"DELETE"}),
  analyzeOpportunities: () => request<{queued:number;message:string}>("/market/opportunities/analyze",{method:"POST"}),
  marketStatus: () => request<MarketStatus>("/market/status"),
  marketReports: () => request<MarketReport[]>("/market/reports"),
  marketAlerts: () => request<(MarketReport & {reportId:string;readAt:string|null})[]>("/market/alerts"),
  marketPreferences: (enabled:boolean) => request("/market/preferences", {method:"PATCH",body:JSON.stringify({enabled})}),
  readMarketAlert: (id:string) => request(`/market/alerts/${id}`, {method:"PATCH"}),
  registerDevice: (token:string) => request("/market/devices", {method:"POST",body:JSON.stringify({token})}),

  register: (name: string, email: string, password: string) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, privacyAccepted: true }),
    }),
  login: (email: string, password: string) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  catalog: () => request<Instrument[]>("/catalog"),
  portfolio: (refresh = false) =>
    request<{ totalValue: number; positions: EnrichedPosition[] }>("/portfolio" + (refresh ? "?refresh=true" : "")),
  addPosition: (ticker: string, quantity: number) =>
    request("/portfolio/positions", {
      method: "POST",
      body: JSON.stringify({ ticker, quantity }),
    }),
  updatePosition: (id: number, quantity: number) =>
    request(`/portfolio/positions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removePosition: (id: number) =>
    request(`/portfolio/positions/${id}`, { method: "DELETE" }),
  analysis: () => request<Analysis>("/analysis"),
  signals: () => request<SignalsSnapshot>("/signals"),
  observations: () => request<ObservationsResponse>("/observations"),
};

export const CLASS_LABELS: Record<string, string> = {
  accion: "Acciones",
  etf: "ETFs",
  cripto: "Cripto",
  stablecoin: "Stablecoins",
};

export const fmtUsd = (v: number) =>
  "US$ " + Math.round(v).toLocaleString("es-AR");

export const fmtPct = (w: number, digits = 1) =>
  `${(w * 100).toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

export interface MarketStatus {analysisRequests?:{ticker:string;state:"queued"|"processing"|"ready"|"failed";message:string;createdAt:string;finishedAt:string|null}[];configured:boolean;calendarConfigured:boolean;pushEnabled:boolean;alertsEnabled:boolean;coverage:{ticker:string;exchange:string;region:string}[];lastRun:{status:string;finishedAt:string|null}|null;}
export interface MarketReport {id:string;ticker:string;region:string;createdAt:string;payload:{failure?:{kind:'provider'|'validation';reason:string}|null;masterSections?:{section:string;status:string;detail:string}[];report:{status:string;summary:string;facts:{sourceId:string;excerpt:string;translation?:string}[];sourceTitles?:{sourceId:string;title:string}[];scenarios:{direction:'up'|'down'|'neutral';condition:string;explanation:string;sourceIds:string[]}[];limitations:string[]};snapshot:{research?:ResearchDisplay;quote:{price:number;currency:string;asOf:string;source:string}|null;sources:{id:string;title:string;url:string;publishedAt:string;fetchedAt:string}[]}};}

export type HoldingPosition = Omit<EnrichedPosition, "refPrice" | "value" | "weight"> & {refPrice:number|null;value:number|null;weight:number|null};

export interface EvidenceScenario {
  id: string; ticker: string; generatedAt: string; direction: 'up' | 'down' | 'neutral';
  condition: string; explanation: string; limitations: string[];
  sources: {title:string;url:string;publishedAt:string}[];
}

export interface OpportunityFeed {
  preferences:{enabled:boolean;scope:'all'|'watchlist'};
  watchlist:{ticker:string;name:string}[];
  coverage:{ticker:string;name:string;kind:'equity'|'crypto'}[];
  notice:string;
  requests:{ticker:string;status:string;attempts:number;createdAt:string}[];
  reports:(MarketReport & {alertId:string|null;opportunity:{label:string;notice:string;probability:null;scenarios:{condition:string;explanation:string;sources:{title:string;url:string;publishedAt:string}[]}[]}})[];
}
