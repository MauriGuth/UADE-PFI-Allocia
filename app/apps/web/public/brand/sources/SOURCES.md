# Logos de fuentes (proveedores de datos y medios)

Se muestran junto al nombre de la fuente en **Ajustes → Fuentes de datos** y en **Señales** (noticias y «Fuentes y disponibilidad»).
Son archivos locales (la política CSP solo permite imágenes propias); nunca se cargan desde hosts de terceros.
El registro está en `lib/source-logos.ts` (campo `src`); sin archivo se muestra un monograma.

Los `.png` son miniaturas de 250 px que Wikimedia genera a partir del archivo de Commons indicado; los `.svg` son el archivo original.

Origen: Wikimedia Commons (https://commons.wikimedia.org), archivos marcados con la licencia indicada. Los logos son marcas de sus titulares:
se usan solo para identificar la fuente citada.

| Archivo | Fuente | Página del archivo | Licencia (según Commons) | Nota |
|---|---|---|---|---|
| `ambito.png` | ambito | [File:Ambito financ logo.png](https://commons.wikimedia.org/wiki/File%3AAmbito_financ_logo.png) | Public domain | marca registrada de su titular |
| `bloomberg.png` | bloomberg | [File:Bloomberg logo-2556aaa618.svg](https://commons.wikimedia.org/wiki/File%3ABloomberg_logo-2556aaa618.svg) | Public domain | marca registrada de su titular |
| `cnbc.svg` | cnbc | [File:CNBC logo.svg](https://commons.wikimedia.org/wiki/File%3ACNBC_logo.svg) | Public domain | marca registrada de su titular |
| `ft.png` | ft | [File:Financial Times corporate logo 2026.svg](https://commons.wikimedia.org/wiki/File%3AFinancial_Times_corporate_logo_2026.svg) | Public domain | marca registrada de su titular |
| `infobae.png` | infobae | [File:Infobae logo.svg](https://commons.wikimedia.org/wiki/File%3AInfobae_logo.svg) | Public domain | marca registrada de su titular |
| `investopedia.png` | investopedia | [File:Investopedia Logo.svg](https://commons.wikimedia.org/wiki/File%3AInvestopedia_Logo.svg) | Public domain | marca registrada de su titular |
| `lanacion.png` | lanacion | [File:La-Nación-Logo.svg](https://commons.wikimedia.org/wiki/File%3ALa-Naci%C3%B3n-Logo.svg) | Public domain | marca registrada de su titular |
| `polymarket.png` | polymarket | [File:Polymarket.svg](https://commons.wikimedia.org/wiki/File%3APolymarket.svg) | Public domain | marca registrada de su titular |
| `reuters.svg` | reuters | [File:Reuters logo 2024.svg](https://commons.wikimedia.org/wiki/File%3AReuters_logo_2024.svg) | Public domain | marca registrada de su titular |
| `seekingalpha.png` | seekingalpha | [File:Seeking Alpha Logo.svg](https://commons.wikimedia.org/wiki/File%3ASeeking_Alpha_Logo.svg) | Public domain | marca registrada de su titular |
| `wsj.svg` | wsj | [File:The Wall Street Journal Logo.svg](https://commons.wikimedia.org/wiki/File%3AThe_Wall_Street_Journal_Logo.svg) | Public domain | marca registrada de su titular |
| `yahoo.png` | yahoo | [File:Yahoo! Finance logo.svg](https://commons.wikimedia.org/wiki/File%3AYahoo%21_Finance_logo.svg) | Public domain | marca registrada de su titular |

## Sin archivo (se muestra monograma)
Finnhub, CoinGecko, FRED (Federal Reserve Bank of St. Louis), DefiLlama, Alternative.me, MarketWatch, Barron's y el índice GPR no tenían un archivo
con licencia verificable en Commons al momento de preparar este cambio.
Para agregar uno: guardar el SVG/PNG oficial en esta carpeta, registrar su origen y licencia en esta tabla y completar `src` en `lib/source-logos.ts`.

### Búsqueda de archivos verificables (19/11/2026)
Se volvieron a buscar los logos de Finnhub, CoinGecko, FRED, DefiLlama y Alternative.me:
- **Simple Icons 16.38.0** (paquete npm, CC0): no incluye ninguna de estas marcas (se revisaron títulos y alias de sus 3.472 íconos).
- **Wikimedia Commons**: no hay archivos de logo de estas marcas (la búsqueda solo devuelve fotos y archivos sin relación).
- Los sitios oficiales de las marcas no estaban accesibles desde el entorno de desarrollo.
Mientras tanto se mantiene el monograma. No se dibujan logos parecidos: son marcas de terceros y solo se usan archivos con origen y licencia verificables.
