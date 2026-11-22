"use client";

import type {
  Analysis,
  AuthUser,
  EnrichedPosition,
  Instrument,
  HoldingPosition,
  ObservationsResponse,
  SignalsSnapshot,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const OFFLINE = "No hay conexión con el servidor. Verificá tu internet e intentá de nuevo.";

// Evita redirigir varias veces si varias requests fallan con 401 a la vez.
let redirecting = false;

/** El backend responde 401 «Contraseña incorrecta» al confirmar con una contraseña inválida. */
export const isWrongPassword = (message?: string) => /contraseña incorrecta/i.test(message ?? "");

async function request<T>(url: string, init?: RequestInit, opts?: { auth?: boolean }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }

  // Algunas respuestas (DELETE, 204) vienen sin cuerpo: parsear con cuidado.
  const text = await res.text();
  let body: { message?: string | string[] } | null = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body?.message[0] : body?.message;
    // Sesión vencida: el proxy ya limpió la cookie; volvemos al login. Una
    // contraseña incorrecta (p. ej. al eliminar la cuenta) también responde 401,
    // pero la sesión sigue vigente: se informa el error sin cerrar la sesión.
    if (res.status === 401 && opts?.auth !== false && !redirecting && !isWrongPassword(msg)) {
      redirecting = true;
      window.location.assign("/login?expired=1");
    }
    throw new ApiError(msg ?? `Error ${res.status}`, res.status);
  }
  return body as T;
}

const proxy = (path: string) => `/api/proxy${path}`;

export interface MarketCandidate {provider:'coingecko'|'finnhub';id:string;symbol:string;name:string}
export interface ResearchDisplay {technical:{status:string;asOf:string|null;samples:number;values:Record<string,number|null>;method:string};fundamentals:{retrievedAt:string;metrics:Record<string,number>;error?:string};history:{error?:string}}
export const api = {
  assetLogo: (ticker:string) => request<{dataUri:string|null;source:string|null}>("/api/proxy/catalog/"+encodeURIComponent(ticker)+"/logo"),
  requestAnalysis: () => request<{queued:number;message:string}>("/api/proxy/market/analyze", {method:"POST"}),
  searchCatalog: (query:string) => request<{results:MarketCandidate[];unavailable:string[]}>("/api/proxy/catalog/search", {method:"POST",body:JSON.stringify({query})}),
  importAsset: (candidate:MarketCandidate) => request<Instrument>("/api/proxy/catalog/import", {method:"POST",body:JSON.stringify({provider:candidate.provider,id:candidate.id})}),

  opportunities: () => request<OpportunityFeed>("/api/proxy/market/opportunities"),
  opportunityPreferences: (enabled:boolean,scope:'all'|'watchlist') => request("/api/proxy/market/opportunities/preferences",{method:"PATCH",body:JSON.stringify({enabled,scope})}),
  followAsset: (ticker:string) => request("/api/proxy/market/opportunities/watchlist",{method:"POST",body:JSON.stringify({ticker})}),
  unfollowAsset: (ticker:string) => request("/api/proxy/market/opportunities/watchlist/"+encodeURIComponent(ticker),{method:"DELETE"}),
  analyzeOpportunities: () => request<{queued:number;message:string}>("/api/proxy/market/opportunities/analyze",{method:"POST"}),
  marketStatus: () => request<MarketStatus>("/api/proxy/market/status"),
  marketReports: () => request<MarketReport[]>("/api/proxy/market/reports"),
  marketAlerts: () => request<(MarketReport & {reportId:string;readAt:string|null})[]>("/api/proxy/market/alerts"),
  marketPreferences: (enabled:boolean) => request("/api/proxy/market/preferences", {method:"PATCH",body:JSON.stringify({enabled})}),
  readMarketAlert: (id:string) => request(`/api/proxy/market/alerts/${id}`, {method:"PATCH"}),

  login: (email: string, password: string) =>
    request<{ user: AuthUser }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { auth: false },
    ),
  register: (name: string, email: string, password: string, privacyAccepted: boolean) =>
    request<{ user: AuthUser }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password, privacyAccepted }) },
      { auth: false },
    ),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }, { auth: false }),
  exportData: () => request<unknown>(proxy("/auth/export")),
  deleteAccount: (password: string) => request(proxy("/auth/me"), { method: "DELETE", body: JSON.stringify({ password }) }),

  catalog: () => request<Instrument[]>(proxy("/catalog")),
  holdings: () => request<HoldingPosition[]>(proxy("/portfolio/holdings")),
  portfolio: (refresh = false) =>
    request<{ totalValue: number; positions: EnrichedPosition[] }>(proxy("/portfolio" + (refresh ? "?refresh=true" : ""))),
  addPosition: (ticker: string, quantity: number) =>
    request(proxy("/portfolio/positions"), {
      method: "POST",
      body: JSON.stringify({ ticker, quantity }),
    }),
  updatePosition: (id: number, quantity: number) =>
    request(proxy(`/portfolio/positions/${id}`), {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removePosition: (id: number) =>
    request(proxy(`/portfolio/positions/${id}`), { method: "DELETE" }),
  analysis: () => request<Analysis>(proxy("/analysis")),
  signals: () => request<SignalsSnapshot>(proxy("/signals")),
  observations: () => request<ObservationsResponse>(proxy("/observations")),
};

export interface MarketStatus {analysisRequests?:{ticker:string;state:"queued"|"processing"|"ready"|"failed";message:string;createdAt:string;finishedAt:string|null}[];configured:boolean;calendarConfigured:boolean;pushEnabled:boolean;alertsEnabled:boolean;coverage:{ticker:string;exchange:string;region:string}[];lastRun:{status:string;finishedAt:string|null}|null;}
export interface MarketReport {id:string;ticker:string;region:string;createdAt:string;payload:{failure?:{kind:'provider'|'validation';reason:string}|null;masterSections?:{section:string;status:string;detail:string}[];report:{status:string;summary:string;facts:{sourceId:string;excerpt:string;translation?:string}[];sourceTitles?:{sourceId:string;title:string}[];scenarios:{direction:'up'|'down'|'neutral';condition:string;explanation:string;sourceIds:string[]}[];limitations:string[]};snapshot:{research?:ResearchDisplay;quote:{price:number;currency:string;asOf:string;source:string}|null;sources:{id:string;title:string;url:string;publishedAt:string;fetchedAt:string}[]}};}

export interface OpportunityFeed {
  preferences:{enabled:boolean;scope:'all'|'watchlist'};
  watchlist:{ticker:string;name:string}[];
  coverage:{ticker:string;name:string;kind:'equity'|'crypto'}[];
  notice:string;
  requests:{ticker:string;status:string;attempts:number;createdAt:string}[];
  reports:(MarketReport & {alertId:string|null;opportunity:{label:string;notice:string;probability:null;scenarios:{condition:string;explanation:string;sources:{title:string;url:string;publishedAt:string}[]}[]}})[];
}
