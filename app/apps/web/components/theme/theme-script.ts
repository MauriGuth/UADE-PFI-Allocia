/** Clave donde se guarda la elección explícita de la persona («light» o «dark»). Sin ella se sigue al sistema. */
export const THEME_KEY = "allocia-theme";

/** Clave del menú lateral de escritorio: «collapsed» cuando la persona lo ocultó. */
export const SIDEBAR_KEY = "allocia-sidebar";

/**
 * Script que corre antes de pintar (en <head>, con el nonce del CSP): fija `data-theme` en <html> según la elección guardada
 * o, si no la hay, la preferencia del sistema (así no hay un destello claro antes de pasar a oscuro). También restituye el menú
 * lateral oculto con `data-sidebar`, para que la página no cargue con el menú abierto y lo cierre de golpe.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}try{if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")document.documentElement.setAttribute("data-sidebar","collapsed")}catch(e){}})();`;

export const THEME_COLORS = { light: "#f7f9fb", dark: "#0a1122" } as const;
