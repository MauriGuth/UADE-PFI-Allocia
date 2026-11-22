"use client";

import { useId, useMemo, useState } from "react";
import { api, type MarketCandidate } from "@/lib/client";
import {
  CLASS_LABELS,
  MAX_DECIMALS,
  MAX_QUANTITY,
  fmtQty,
  parseQuantity,
  sanitizeQuantityInput,
} from "@/lib/format";
import type { HoldingPosition, Instrument } from "@/lib/types";
import { IconPlus } from "../icons";
import { Card } from "../ui/primitives";

export const QUANTITY_HELP =
  "Cantidad de unidades del activo, no el dinero invertido. Ejemplo: 2 para dos acciones; 0,1 para una décima de bitcoin.";

// Formulario "Nueva Posición" con autocompletado del catálogo de clasificación.
export function PositionForm({
  catalog,
  positions,
  onAdded,
  onError,
  onNotice,
  onEditExisting,
}: {
  catalog: Instrument[];
  positions: HoldingPosition[];
  onAdded: () => void | Promise<void>;
  onError: (message: string | null) => void;
  /** Confirmación persistente que muestra la pantalla (null la limpia). */
  onNotice: (message: string | null) => void;
  /** Abre el diálogo de edición de una posición que ya está en la cartera. */
  onEditExisting: (position: HoldingPosition) => void;
}) {
  const ids = { ticker: useId(), qty: useId(), list: useId() };
  const [external,setExternal]=useState<MarketCandidate[]>([]);
  const [searching,setSearching]=useState(false);
  const [imported,setImported]=useState<Instrument[]>([]);
  async function searchExternal(){setSearching(true);onError(null);try{const r=await api.searchCatalog(ticker);setExternal(r.results);if(r.unavailable.length)onError('Fuentes no disponibles: '+r.unavailable.join(', '));else if(!r.results.length)onError('No se encontraron instrumentos.');}catch(e){onError(e instanceof Error?e.message:'No se pudo buscar');}finally{setSearching(false);}}
  async function pickExternal(c:MarketCandidate){if(busy)return;setBusy(true);onError(null);try{const i=await api.importAsset(c);setImported(old=>[...old.filter(x=>x.ticker!==i.ticker),i]);setTicker(i.ticker);setExternal([]);setShowSuggestions(false);}catch(e){onError(e instanceof Error?e.message:'Cotización no disponible');}finally{setBusy(false);}}
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  // Posición ya existente con el ticker ingresado: se ofrece editarla en lugar de duplicarla.
  const [duplicate, setDuplicate] = useState<HoldingPosition | null>(null);

  const q = ticker.trim().toUpperCase();

  const suggestions = useMemo(() => {
    if (!q) return [];
    return catalog.filter((c) => c.ticker.startsWith(q) || c.name.toUpperCase().includes(q)).slice(0, 5);
  }, [catalog, q]);

  const selected = useMemo(() => [...catalog,...imported].find((c) => c.ticker === q), [catalog, imported, q]);
  const listOpen = showSuggestions && suggestions.length > 0 && !selected;
  const canSubmit = ticker.trim() !== "" && quantity.trim() !== "";

  function pick(c: Instrument) {
    setTicker(c.ticker);
    setShowSuggestions(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    onError(null);
    onNotice(null);
    setDuplicate(null);
    const qty = parseQuantity(quantity);
    if (!(qty > 0)) {
      onError("Ingresá una cantidad mayor a cero (podés usar coma o punto decimal).");
      return;
    }
    // La API suma la cantidad si el ticker ya existe (POST /portfolio/positions
    // no duplica ni rechaza). Para evitar sumas involuntarias, no se envía: se
    // avisa y se ofrece editar la posición existente.
    const existing = positions.find((p) => p.ticker === q);
    if (existing) {
      setDuplicate(existing);
      return;
    }
    if (qty > MAX_QUANTITY) {
      onError(`La cantidad de ${q} no puede superar ${fmtQty(MAX_QUANTITY)}.`);
      return;
    }
    setBusy(true);
    try {
      await api.addPosition(q, qty);
      onNotice(`Posición guardada: ${q} se agregó a tu cartera con ${fmtQty(qty)} unidades.`);
      setTicker("");
      setQuantity("");
      setShowSuggestions(false);
      await onAdded();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  function editDuplicate() {
    if (!duplicate) return;
    const p = duplicate;
    setDuplicate(null);
    setTicker("");
    setQuantity("");
    setShowSuggestions(false);
    onEditExisting(p);
  }

  return (
    <Card as="section" aria-labelledby={`${ids.list}-h`}>
      <h2 id={`${ids.list}-h`} className="mb-3 text-lg font-semibold text-ink">
        Nueva Posición
      </h2>
      <div className="mb-3">
        <button type="button" disabled={searching||busy||ticker.trim().length<2} onClick={searchExternal} className="text-sm underline disabled:opacity-50">{searching?'Buscando…':'Buscar más activos y criptos'}</button>
        <p className="text-xs text-muted">Escribí un nombre o símbolo. La cotización se verifica antes de incorporarlo; la cobertura depende del proveedor.</p>
        {external.map(c=><button type="button" key={c.provider+':'+c.id} disabled={busy} onClick={()=>pickExternal(c)} className="block py-2 text-left text-sm">{c.symbol.toUpperCase()} · {c.name} · {busy?'Comprobando…':'Seleccionar y comprobar precio'}</button>)}
      </div>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-[1.4fr_1fr] items-end gap-2.5">
          <div className="relative">
            <label htmlFor={ids.ticker} className="field-label">
              Ticker / Símbolo
            </label>
            <input
              id={ids.ticker}
              className="input uppercase placeholder:normal-case"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.slice(0,60));
                setExternal([]);
                setShowSuggestions(true);
                setActive(0);
                setDuplicate(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={(e) => {
                if (!listOpen) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pick(suggestions[active]);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Ej: AAPL"
              autoComplete="off"
              maxLength={60}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={listOpen}
              aria-controls={ids.list}
              aria-autocomplete="list"
            />
          </div>
          <div>
            <label htmlFor={ids.qty} className="field-label">
              Cantidad (en unidades)
            </label>
            <input
              id={ids.qty}
              className="input"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              value={quantity}
              onChange={(e) => {
                setQuantity(sanitizeQuantityInput(e.target.value));
                setDuplicate(null);
              }}
              placeholder="p. ej. 2"
              aria-describedby={`${ids.qty}-hint`}
            />
          </div>
        </div>

        <p id={`${ids.qty}-hint`} className="mt-1.5 text-[11px] leading-4 text-muted">
          {QUANTITY_HELP} Solo números; hasta {MAX_DECIMALS} decimales (coma o punto).
        </p>

        {listOpen && (
          <ul
            id={ids.list}
            role="listbox"
            className="mt-2 overflow-hidden rounded-field border border-line bg-card"
          >
            {suggestions.map((c, i) => (
              <li
                key={c.ticker}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 border-b border-line px-3 py-[9px] last:border-b-0 ${
                  i === active ? "bg-low" : ""
                }`}
              >
                <span className="w-[54px] text-[13px] font-bold text-ink">{c.ticker}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-soft">
                  {c.name} · {CLASS_LABELS[c.assetClass]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <p className="mt-2 text-[11.5px] leading-4 text-soft" aria-live="polite">
            <span className="sr-only">Activo seleccionado: </span>
            {selected.name} — {CLASS_LABELS[selected.assetClass]} · {selected.sector} · {selected.region} ·
            cotización sujeta a disponibilidad
          </p>
        )}

        <div aria-live="polite">
          {duplicate && (
            <div className="mt-3 rounded-field border border-outline bg-low p-3 text-[13px] leading-5">
              <p className="font-semibold text-ink">Ya tenés {duplicate.ticker} en tu cartera</p>
              <p className="mt-1 text-soft">
                Tu posición actual es de {fmtQty(duplicate.quantity)} unidades. Para cambiarla, editá esa posición en lugar de
                cargarla de nuevo.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button type="button" onClick={editDuplicate} className="btn-primary btn-sm">
                  Editar cantidad
                </button>
                <button type="button" onClick={() => setDuplicate(null)} className="btn-secondary btn-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={!canSubmit || busy} className="btn-soft mt-3 w-full">
          <IconPlus size={16} /> {busy ? "Agregando…" : "Agregar Activo"}
        </button>
      </form>
    </Card>
  );
}
