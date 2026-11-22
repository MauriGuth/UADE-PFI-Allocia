/** Fecha ISO al comienzo de «fuente» de una noticia («2026-11-22T10:00:00Z · https://…»). */
export const eventDate = (fuente: string) => {
  const head = fuente.split(" · ")[0];
  return Number.isFinite(Date.parse(head)) ? head : null;
};
/** Una API anterior reemplazaba el titular por un aviso cuando fallaba la traducción: ese aviso no es contexto. */
export const usableHeadline = (titulo?: string | null) => (titulo && !/traducción no disponible/i.test(titulo) ? titulo : null);
