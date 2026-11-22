/**
 * Modelo de Anthropic a usar, con respaldo automático cuando el configurado ya no existe.
 *
 * Anthropic retira modelos viejos: desde ese día toda llamada responde «modelo no encontrado» (404) aunque la clave y
 * el crédito estén bien, y fallan juntos la traducción de noticias y los análisis. Si pasa eso, se prueba con
 * ANTHROPIC_FALLBACK_MODELS (separados por coma) o, si no está definida, con modelos vigentes conocidos.
 */
const DEFAULT_FALLBACKS = ['claude-sonnet-5-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'];

export function modelCandidates(): string[] {
  const configured = process.env.ANTHROPIC_MODEL?.trim();
  const extra = (process.env.ANTHROPIC_FALLBACK_MODELS ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  const list = [configured, ...(extra.length ? extra : DEFAULT_FALLBACKS)].filter((m): m is string => !!m);
  return [...new Set(list)];
}

/** true si el error dice que el modelo no existe o no está disponible para la cuenta. */
export function isModelUnavailable(error: unknown): boolean {
  const e = error as { statusCode?: number; responseBody?: string; message?: string };
  const text = `${e?.responseBody ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return (e?.statusCode === 404 && /model|not_found/.test(text)) || /model[^a-z]{1,20}(not found|does not exist|is not available|deprecated|retired)|not_found_error.{0,40}model/.test(text);
}

/** Mensaje breve del proveedor (sin datos sensibles: Anthropic no devuelve la clave ni datos de la cuenta). */
export function providerMessage(error: unknown): string | null {
  const e = error as { responseBody?: string; message?: string };
  let msg = '';
  try {
    msg = JSON.parse(e?.responseBody ?? '')?.error?.message ?? '';
  } catch {
    msg = '';
  }
  msg = (msg || e?.message || '').replace(/sk-ant-[\w-]+/g, '[clave]').replace(/\s+/g, ' ').trim();
  return msg ? msg.slice(0, 180) : null;
}

let workingModel: string | null = null;

/** Ejecuta `call` con el modelo configurado y, si ese modelo no existe, con los de respaldo (recordando el que anduvo). */
export async function withModelFallback<T>(call: (modelId: string) => Promise<T>, label: string): Promise<{ result: T; model: string }> {
  const candidates = modelCandidates();
  const ordered = workingModel && candidates.includes(workingModel) ? [workingModel, ...candidates.filter((m) => m !== workingModel)] : candidates;
  let lastError: unknown = null;
  for (const model of ordered) {
    try {
      const result = await call(model);
      if (model !== workingModel) {
        if (model !== candidates[0]) console.warn(JSON.stringify({ event: 'anthropic_model_fallback', label, configured: candidates[0], using: model }));
        workingModel = model;
      }
      return { result, model };
    } catch (error) {
      lastError = error;
      if (!isModelUnavailable(error)) throw error;
      console.warn(JSON.stringify({ event: 'anthropic_model_unavailable', label, model, detail: providerMessage(error) }));
    }
  }
  throw lastError ?? new Error('No hay un modelo de Anthropic configurado');
}
