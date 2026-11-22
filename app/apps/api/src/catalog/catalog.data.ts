import { AssetClass } from "../entities/instrument.entity";

export interface CatalogEntry {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  region: string;
  currency: string;
  refPrice: number;
}

// Catálogo de clasificación con precios de referencia del snapshot 14/08/2026.
// En el MVP final los precios se actualizarán desde la capa de integración
// de fuentes externas (Sección 4.9 del informe).
export const CATALOG: CatalogEntry[] = [
  // Acciones EE.UU.
  { ticker: "AAPL", name: "Apple Inc.", assetClass: "accion", sector: "Tecnología", region: "EE.UU.", currency: "USD", refPrice: 236.5 },
  { ticker: "MSFT", name: "Microsoft Corp.", assetClass: "accion", sector: "Tecnología", region: "EE.UU.", currency: "USD", refPrice: 462.1 },
  { ticker: "NVDA", name: "NVIDIA Corp.", assetClass: "accion", sector: "Tecnología", region: "EE.UU.", currency: "USD", refPrice: 156.3 },
  { ticker: "GOOGL", name: "Alphabet Inc.", assetClass: "accion", sector: "Comunicaciones", region: "EE.UU.", currency: "USD", refPrice: 196.4 },
  { ticker: "AMZN", name: "Amazon.com Inc.", assetClass: "accion", sector: "Consumo discrecional", region: "EE.UU.", currency: "USD", refPrice: 221.8 },
  { ticker: "META", name: "Meta Platforms Inc.", assetClass: "accion", sector: "Comunicaciones", region: "EE.UU.", currency: "USD", refPrice: 588.2 },
  { ticker: "TSLA", name: "Tesla Inc.", assetClass: "accion", sector: "Consumo discrecional", region: "EE.UU.", currency: "USD", refPrice: 249.7 },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", assetClass: "accion", sector: "Financiero", region: "EE.UU.", currency: "USD", refPrice: 241.3 },
  { ticker: "JNJ", name: "Johnson & Johnson", assetClass: "accion", sector: "Salud", region: "EE.UU.", currency: "USD", refPrice: 154.9 },
  { ticker: "KO", name: "The Coca-Cola Company", assetClass: "accion", sector: "Consumo básico", region: "EE.UU.", currency: "USD", refPrice: 68.4 },
  { ticker: "PG", name: "Procter & Gamble Co.", assetClass: "accion", sector: "Consumo básico", region: "EE.UU.", currency: "USD", refPrice: 167.2 },
  { ticker: "XOM", name: "Exxon Mobil Corp.", assetClass: "accion", sector: "Energía", region: "EE.UU.", currency: "USD", refPrice: 114.6 },
  // Acciones LatAm / Argentina (ADR)
  { ticker: "MELI", name: "MercadoLibre Inc.", assetClass: "accion", sector: "Consumo discrecional", region: "Latinoamérica", currency: "USD", refPrice: 1894.0 },
  { ticker: "GGAL", name: "Grupo Financiero Galicia (ADR)", assetClass: "accion", sector: "Financiero", region: "Argentina", currency: "USD", refPrice: 54.8 },
  { ticker: "YPF", name: "YPF S.A. (ADR)", assetClass: "accion", sector: "Energía", region: "Argentina", currency: "USD", refPrice: 37.9 },
  { ticker: "PAM", name: "Pampa Energía (ADR)", assetClass: "accion", sector: "Energía", region: "Argentina", currency: "USD", refPrice: 76.2 },
  // ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF", assetClass: "etf", sector: "Diversificado", region: "EE.UU.", currency: "USD", refPrice: 611.4 },
  { ticker: "QQQ", name: "Invesco QQQ (Nasdaq 100)", assetClass: "etf", sector: "Tecnología", region: "EE.UU.", currency: "USD", refPrice: 541.7 },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", assetClass: "etf", sector: "Diversificado", region: "EE.UU.", currency: "USD", refPrice: 562.3 },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", assetClass: "etf", sector: "Diversificado", region: "EE.UU.", currency: "USD", refPrice: 228.6 },
  { ticker: "EEM", name: "iShares MSCI Emerging Markets", assetClass: "etf", sector: "Diversificado", region: "Emergentes", currency: "USD", refPrice: 44.8 },
  { ticker: "EFA", name: "iShares MSCI EAFE (Europa/Asia)", assetClass: "etf", sector: "Diversificado", region: "Europa/Asia", currency: "USD", refPrice: 84.1 },
  { ticker: "GLD", name: "SPDR Gold Shares", assetClass: "etf", sector: "Oro", region: "Global", currency: "USD", refPrice: 251.2 },
  { ticker: "XLE", name: "Energy Select Sector SPDR", assetClass: "etf", sector: "Energía", region: "EE.UU.", currency: "USD", refPrice: 91.8 },
  { ticker: "XLF", name: "Financial Select Sector SPDR", assetClass: "etf", sector: "Financiero", region: "EE.UU.", currency: "USD", refPrice: 48.3 },
  // Criptomonedas
  { ticker: "BTC", name: "Bitcoin", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 104800 },
  { ticker: "ETH", name: "Ethereum", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 3815 },
  { ticker: "SOL", name: "Solana", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 178.4 },
  { ticker: "ADA", name: "Cardano", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 0.92 },
  { ticker: "LINK", name: "Chainlink", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 18.2 },
  { ticker: "POL", name: "Polygon", assetClass: "cripto", sector: "Infraestructura cripto", region: "Global", currency: "USD", refPrice: 0.48 },
  // Stablecoins
  { ticker: "USDT", name: "Tether USD", assetClass: "stablecoin", sector: "Stablecoin", region: "Global", currency: "USD", refPrice: 1 },
  { ticker: "USDC", name: "USD Coin", assetClass: "stablecoin", sector: "Stablecoin", region: "Global", currency: "USD", refPrice: 1 },
  { ticker: "DAI", name: "Dai", assetClass: "stablecoin", sector: "Stablecoin", region: "Global", currency: "USD", refPrice: 1 },
];
