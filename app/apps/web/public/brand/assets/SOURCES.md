# Logos locales de activos y proveedores

Estos archivos se usan solo como **respaldo** cuando la API de Allocia no devuelve el logo de un activo
(`GET /catalog/:ticker/logo`, proveedores Finnhub/CoinGecko). Si no hay ni logo de la API ni archivo local,
la interfaz muestra un recuadro con el ticker (ver `components/ui/AssetIdentity.tsx`).

| Archivo    | Activo        | Origen                                                                 | Licencia del archivo |
|------------|---------------|------------------------------------------------------------------------|----------------------|
| `aapl.svg` | Apple (AAPL)  | Simple Icons v16.38.0 · `icons/apple.svg` · https://simpleicons.org/?q=apple (color #000000) | CC0 1.0 |
| `btc.svg`  | Bitcoin (BTC) | Simple Icons v16.38.0 · `icons/bitcoin.svg` · https://simpleicons.org/?q=bitcoin (color #F7931A) | CC0 1.0 |

Descarga: paquete npm `simple-icons@16.38.0` (https://www.npmjs.com/package/simple-icons), solo se copiaron los dos SVG;
no se agregó ninguna dependencia al proyecto.

Las marcas pertenecen a sus respectivos titulares; Simple Icons indica que su uso debe respetar las guías de cada marca.

## No incluidos (sin fuente verificable accesible)
- YPF y Pampa Energía: se previó Wikimedia Commons, pero ese host no estaba accesible al preparar este cambio, por lo que
  se muestran con recuadro de ticker (o con el logo que entregue la API). Para agregarlos: guardar el SVG verificado en
  esta carpeta como `ypf.svg` / `pam.svg`, registrar la fuente en esta tabla y añadirlos a `lib/asset-logos.ts`.
- SPY y EEM (ETF): recuadro de ticker, como en el diseño.
- Proveedores de datos de Ajustes (Finnhub, CoinGecko, FRED): recuadro con iniciales; no se alojan logos de terceros.
