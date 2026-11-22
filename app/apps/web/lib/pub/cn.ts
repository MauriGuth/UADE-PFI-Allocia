/** Une clases condicionales (sin resolver conflictos: los componentes de pub/ no pisan clases entre sí). */
export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}
