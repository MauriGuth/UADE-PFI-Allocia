# Datasets del Proyecto Allocia

Proyecto Final de Ingeniería en Informática (UADE, 2026). Huentelaf, Mauricio y Rosso, Máximo.

Esta página reúne los datasets y las fuentes de datos que utiliza el Proyecto, con un enlace directo a cada uno.

## 1. Datasets propios

| Dataset | Descripción | Enlace |
|---|---|---|
| Encuesta sobre análisis y gestión de inversiones | 190 respuestas recogidas entre el 24 de mayo y el 14 de agosto de 2026, anónimas. Una fila por respuesta y una columna por pregunta. Sustenta la investigación con usuarios (Subsección 3.1.1 y Anexo C). | [encuesta_respuestas.csv](datasets/encuesta_respuestas.csv) |
| Respuestas a la pregunta abierta de la encuesta | Las 190 respuestas a la pregunta 16, «¿Qué sentís que le falta a las herramientas que usás hoy para analizar mejor tu portafolio?», en orden de registro. | [pregunta16_respuestas.txt](evidence/2026-08-encuesta/pregunta16_respuestas.txt) |
| Catálogo de instrumentos | 34 instrumentos (acciones, ETFs, criptomonedas y stablecoins) con su clase, sector, región, moneda y precio de referencia. Con él, Allocia clasifica las posiciones de cada cartera. | [catalogo_instrumentos.csv](datasets/catalogo_instrumentos.csv) |

## 2. Datasets públicos

| Dataset | Uso en Allocia | Enlace |
|---|---|---|
| Índice de riesgo geopolítico (GPR) diario, de Caldara e Iacoviello | Contexto geopolítico de la cartera. Se usa la media móvil de 30 días de la planilla diaria. | [Página del índice](https://www.matteoiacoviello.com/gpr.htm) · [Planilla diaria](https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls) · [Artículo (DOI)](https://doi.org/10.1257/aer.20191823) |
| FRED: tasa efectiva de fondos federales (DFF) | Contexto macroeconómico de los informes por activo. | [fred.stlouisfed.org/series/DFF](https://fred.stlouisfed.org/series/DFF) |
| FRED: rendimiento del Tesoro de EE. UU. a 2 años (DGS2) | Contexto macroeconómico y diferencial de tasas. | [fred.stlouisfed.org/series/DGS2](https://fred.stlouisfed.org/series/DGS2) |
| FRED: rendimiento del Tesoro de EE. UU. a 10 años (DGS10) | Contexto macroeconómico y diferencial de tasas. | [fred.stlouisfed.org/series/DGS10](https://fred.stlouisfed.org/series/DGS10) |
| FRED: índice de precios al consumidor (CPIAUCSL) | Inflación interanual de EE. UU. | [fred.stlouisfed.org/series/CPIAUCSL](https://fred.stlouisfed.org/series/CPIAUCSL) |

## 3. Fuentes de datos en vivo (API)

Allocia consulta estas fuentes en cada análisis. Cada dato se muestra con su fuente, la fecha del dato y la fecha de consulta.

| Fuente | Datos que aporta | Documentación |
|---|---|---|
| Finnhub | Cotizaciones de acciones, noticias y perfil de empresas | [finnhub.io/docs/api](https://finnhub.io/docs/api) |
| CoinGecko | Precios de criptomonedas y dominancia de Bitcoin | [docs.coingecko.com](https://docs.coingecko.com/reference/crypto-global) |
| Alternative.me | Índice Fear & Greed de sentimiento del mercado cripto | [alternative.me/crypto/fear-and-greed-index](https://alternative.me/crypto/fear-and-greed-index/) |
| DefiLlama | Valor total bloqueado (TVL) en finanzas descentralizadas | [defillama.com/docs/api](https://defillama.com/docs/api) |
| Polymarket | Probabilidades implícitas de mercados de predicción | [docs.polymarket.com](https://docs.polymarket.com) |

## Documentos relacionados

- [Proyecto Final de Ingeniería (PDF)](entrega/%5BE100_GR_SA15_Rosso_Huentelaf%5D%5BE100%20PFI%202026%5D.pdf)
- [Código de la aplicación](app/)
