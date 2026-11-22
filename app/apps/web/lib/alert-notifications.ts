// Avisos del navegador para las alertas de Allocia. Funcionan mientras la web esté abierta en una
// pestaña (no hay Web Push con la app cerrada: ese envío vive en el backend y es solo móvil).
// Esta parte es lógica pura y almacenamiento; la interfaz está en components/shell y components.

/** La pantalla Alertas lo emite al leer o cambiar alertas para refrescar el contador sin esperar al ciclo. */
export const ALERTS_CHANGED = "allocia:alerts-changed";

export interface AlertRef {
  id: string;
  kind: "portfolio" | "opportunity";
  ticker: string;
}

interface PortfolioAlertRow {
  id: string | number;
  reportId: string | number | null;
  readAt: string | null;
  ticker: string;
}

interface OpportunityFeedLike {
  reports: { ticker: string; alertId: string | number | null }[];
}

/** Igual que la pantalla Alertas: sin leer = sin `readAt` y con informe asociado. */
export function unreadPortfolio(rows: PortfolioAlertRow[]): AlertRef[] {
  return rows
    .filter((row) => !row.readAt && row.reportId)
    .map((row) => ({ id: String(row.id), kind: "portfolio" as const, ticker: row.ticker }));
}

/** La API ya devuelve `alertId: null` para las oportunidades leídas o sin alerta. */
export function unreadOpportunities(feed: OpportunityFeedLike): AlertRef[] {
  return feed.reports
    .filter((report) => report.alertId !== null && report.alertId !== undefined)
    .map((report) => ({ id: String(report.alertId), kind: "opportunity" as const, ticker: report.ticker }));
}

export function newAlerts(unread: AlertRef[], seen: ReadonlySet<string>): AlertRef[] {
  return unread.filter((alert) => !seen.has(alert.id));
}

/**
 * Texto del aviso. Igual criterio que el push móvil: nada de montos ni posiciones de la cartera;
 * solo el ticker de una oportunidad (un activo que el usuario no tiene) o un mensaje genérico.
 */
export function notificationText(fresh: AlertRef[]): { title: string; body: string } {
  const title = "Allocia";
  if (fresh.length === 1 && fresh[0].kind === "opportunity") {
    return {
      title,
      body: `${fresh[0].ticker}: detectamos un escenario de posible suba. Revisá la condición, las fuentes y los riesgos; puede no cumplirse.`,
    };
  }
  if (fresh.length === 1) {
    return { title, body: "Tenés un nuevo análisis disponible. Abrí Allocia para ver las fuentes y los riesgos." };
  }
  return { title, body: `Tenés ${fresh.length} alertas nuevas. Abrí Allocia para ver las fuentes y los riesgos.` };
}

export const TEST_NOTIFICATION = {
  title: "Allocia",
  body: "Prueba: las notificaciones del navegador funcionan. Te avisamos cuando haya un análisis nuevo mientras Allocia esté abierta.",
};

// ---- Preferencias (por usuario, en este navegador) ----

export interface NotificationPrefs {
  enabled: boolean;
  /** `false` justo después de activar: la primera lectura solo marca lo pendiente como visto. */
  seeded: boolean;
  seen: string[];
}

const MAX_SEEN = 200;
const keyFor = (userId: string) => `allocia:browser-notifications:v1:${userId}`;
const DEFAULT_PREFS: NotificationPrefs = { enabled: false, seeded: false, seen: [] };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // modo privado o almacenamiento bloqueado
  }
}

export function readPrefs(userId: string, storage: StorageLike | null = browserStorage()): NotificationPrefs {
  try {
    const raw = storage?.getItem(keyFor(userId));
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      enabled: parsed.enabled === true,
      seeded: parsed.seeded === true,
      seen: Array.isArray(parsed.seen) ? parsed.seen.filter((id): id is string => typeof id === "string") : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(userId: string, prefs: NotificationPrefs, storage: StorageLike | null = browserStorage()) {
  try {
    const seen = prefs.seen.slice(-MAX_SEEN);
    storage?.setItem(keyFor(userId), JSON.stringify({ ...prefs, seen }));
  } catch {
    // sin almacenamiento disponible: el aviso sigue funcionando en esta sesión
  }
}
