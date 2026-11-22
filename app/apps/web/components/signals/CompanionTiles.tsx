import { useId } from "react";
import { ProvenanceDates } from "../ui/provenance";

const NBSP = " ";

function Tile({ title, note, children, footer }: { title: string; note: string; children: React.ReactNode; footer: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex h-full flex-col rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h3 id={id} className="text-sm font-semibold leading-5 text-ink">
        {title}
      </h3>
      <p className="mt-0.5 text-caption text-soft">{note}</p>
      {/* El valor se centra en el espacio que sobre: si el vecino es más alto, la holgura se reparte arriba y abajo. */}
      <div className="flex flex-1 flex-col justify-center py-3">{children}</div>
      <div>{footer}</div>
    </section>
  );
}

/**
 * Dominancia de Bitcoin (CoinGecko): es una participación sobre 100 %, así que se muestra con una pista fina de 0 a 100 %
 * y un marcador en el valor actual. Un dato ausente se dice con palabras y la pista queda vacía (no se dibuja como cero).
 */
export function BtcDominanceTile({
  value,
  dataDate,
  fetchedAt,
}: {
  value: number | null;
  dataDate?: string | null;
  fetchedAt?: string | null;
}) {
  const valid = typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
  const text = valid === null ? "—" : `${valid}${NBSP}%`;
  return (
    <Tile
      title="Dominancia BTC"
      note="Porcentaje de la capitalización total cripto que corresponde a Bitcoin. No mide la probabilidad de éxito."
      footer={<ProvenanceDates source="Dominancia BTC" dataDate={dataDate} fetchedAt={fetchedAt} />}
    >
      <p className="font-heading text-[30px] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-ink">{text}</p>
      <div className="mt-3">
        <div
          role="img"
          aria-label={valid === null ? "Dominancia BTC: dato no disponible" : `Dominancia BTC: ${text} de 100${NBSP}%`}
          className="relative h-1.5 rounded-full bg-container"
        >
          {valid !== null ? (
            <>
              <span className="absolute inset-y-0 left-0 rounded-full bg-secondary/30" style={{ width: `${valid}%` }} />
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-secondary shadow-[0_1px_3px_rgb(9_20_38/0.35)]"
                style={{ left: `${valid}%` }}
              />
            </>
          ) : null}
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between text-micro tabular-nums text-soft">
          <span>0{NBSP}%</span>
          <span>100{NBSP}%</span>
        </div>
      </div>
    </Tile>
  );
}

/**
 * TVL de DeFi (DefiLlama): un monto en dólares sin un rango de referencia, así que no se dibuja ninguna pista ni historial:
 * va el valor, su unidad y el monto exacto como contexto.
 */
export function DefiTvlTile({
  value,
  dataDate,
  fetchedAt,
}: {
  value: number | null;
  dataDate?: string | null;
  fetchedAt?: string | null;
}) {
  const valid = typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  const short = valid === null ? "—" : `${(valid / 1e9).toFixed(1)}${NBSP}B`;
  const exact = valid === null ? "no disponible" : valid.toLocaleString("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return (
    <Tile
      title="TVL DeFi (USD)"
      note={`Valor bloqueado en DeFi: ${exact}.`}
      footer={<ProvenanceDates source="TVL DeFi" dataDate={dataDate} fetchedAt={fetchedAt} />}
    >
      <p className="font-heading text-[30px] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-ink">{short}</p>
    </Tile>
  );
}
