import { describe, expect, it } from "vitest";
import {
  newAlerts,
  notificationText,
  readPrefs,
  unreadOpportunities,
  unreadPortfolio,
  writePrefs,
} from "./alert-notifications";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe("alertas sin leer", () => {
  it("cartera: ignora las leídas y las que no tienen informe, como la pantalla Alertas", () => {
    const rows = [
      { id: "1", reportId: "10", readAt: null, ticker: "AAPL" },
      { id: "2", reportId: "11", readAt: "2026-11-05T10:00:00Z", ticker: "BTC" },
      { id: "3", reportId: null, readAt: null, ticker: "MSFT" },
      { id: 4, reportId: 12, readAt: null, ticker: "TSLA" },
    ];
    expect(unreadPortfolio(rows)).toEqual([
      { id: "1", kind: "portfolio", ticker: "AAPL" },
      { id: "4", kind: "portfolio", ticker: "TSLA" },
    ]);
  });

  it("oportunidades: solo las que la API marca con alertId", () => {
    const feed = { reports: [{ ticker: "ETH", alertId: "7" }, { ticker: "SOL", alertId: null }] };
    expect(unreadOpportunities(feed)).toEqual([{ id: "7", kind: "opportunity", ticker: "ETH" }]);
  });

  it("newAlerts devuelve solo lo que todavía no se avisó", () => {
    const unread = [
      { id: "1", kind: "portfolio" as const, ticker: "AAPL" },
      { id: "2", kind: "portfolio" as const, ticker: "BTC" },
    ];
    expect(newAlerts(unread, new Set(["1"]))).toEqual([unread[1]]);
    expect(newAlerts(unread, new Set(["1", "2"]))).toEqual([]);
  });
});

describe("texto del aviso", () => {
  it("de cartera no incluye ticker, montos ni posiciones", () => {
    const { body } = notificationText([{ id: "1", kind: "portfolio", ticker: "AAPL" }]);
    expect(body).toContain("nuevo análisis");
    expect(body).not.toContain("AAPL");
  });

  it("de una oportunidad nombra el activo (que el usuario no tiene) y advierte que puede no cumplirse", () => {
    const { body } = notificationText([{ id: "7", kind: "opportunity", ticker: "ETH" }]);
    expect(body).toContain("ETH");
    expect(body).toContain("puede no cumplirse");
  });

  it("varias alertas se resumen en un solo aviso, sin tickers", () => {
    const { body } = notificationText([
      { id: "1", kind: "portfolio", ticker: "AAPL" },
      { id: "2", kind: "opportunity", ticker: "ETH" },
    ]);
    expect(body).toContain("2 alertas nuevas");
    expect(body).not.toMatch(/AAPL|ETH/);
  });
});

describe("preferencias por usuario", () => {
  it("se guardan separadas por usuario y ante datos dañados vuelven al valor por defecto", () => {
    const storage = memory();
    writePrefs("1", { enabled: true, seeded: true, seen: ["5"] }, storage);
    expect(readPrefs("1", storage)).toEqual({ enabled: true, seeded: true, seen: ["5"] });
    expect(readPrefs("2", storage).enabled).toBe(false);
    storage.setItem("allocia:browser-notifications:v1:3", "{no es json");
    expect(readPrefs("3", storage)).toEqual({ enabled: false, seeded: false, seen: [] });
  });

  it("limita la lista de alertas vistas y tolera que no haya almacenamiento", () => {
    const storage = memory();
    writePrefs("1", { enabled: true, seeded: true, seen: Array.from({ length: 500 }, (_, i) => String(i)) }, storage);
    const saved = readPrefs("1", storage).seen;
    expect(saved).toHaveLength(200);
    expect(saved.at(-1)).toBe("499");
    expect(() => writePrefs("1", { enabled: true, seeded: true, seen: [] }, null)).not.toThrow();
    expect(readPrefs("1", null).enabled).toBe(false);
  });
});
