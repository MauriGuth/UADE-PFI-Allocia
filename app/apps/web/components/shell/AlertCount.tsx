/** Globo con la cantidad de alertas sin leer sobre el ícono del menú Alertas. */
export function AlertCount({ count, className }: { count: number; className: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className={`absolute min-w-[16px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-on-danger ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
