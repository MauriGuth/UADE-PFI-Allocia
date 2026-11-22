// Logos locales de los medios (Wikimedia Commons, ver assets/sources/SOURCES.md). Relación ancho/alto para dibujarlos
// sin deformar. Sin archivo, se muestra el monograma del medio.
export const SOURCE_LOGOS: Record<string, { image: number; ratio: number }> = {
  ambito: { image: require("../assets/sources/ambito.png"), ratio: 3.583 },
  bloomberg: { image: require("../assets/sources/bloomberg.png"), ratio: 5.375 },
  cnbc: { image: require("../assets/sources/cnbc.png"), ratio: 1.250 },
  ft: { image: require("../assets/sources/ft.png"), ratio: 3.458 },
  infobae: { image: require("../assets/sources/infobae.png"), ratio: 4.208 },
  investopedia: { image: require("../assets/sources/investopedia.png"), ratio: 6.250 },
  lanacion: { image: require("../assets/sources/lanacion.png"), ratio: 8.885 },
  polymarket: { image: require("../assets/sources/polymarket.png"), ratio: 5.375 },
  reuters: { image: require("../assets/sources/reuters.png"), ratio: 3.646 },
  seekingalpha: { image: require("../assets/sources/seekingalpha.png"), ratio: 4.958 },
  wsj: { image: require("../assets/sources/wsj.png"), ratio: 11.500 },
  yahoo: { image: require("../assets/sources/yahoo.png"), ratio: 6.948 },
};
