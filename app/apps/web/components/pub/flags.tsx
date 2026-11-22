import { ChartColumn } from "lucide-react";

export function FlagUS() {
  return (
    <svg viewBox="0 0 28 28" className="size-7 rounded-full shadow-sm" aria-hidden="true">
      <clipPath id="flag-us-clip">
        <circle cx="14" cy="14" r="14" />
      </clipPath>
      <g clipPath="url(#flag-us-clip)">
        <rect width="28" height="28" fill="#ffffff" />
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={i * 2.155} width="28" height="2.155" fill={i % 2 === 0 ? "#d22f3c" : "#ffffff"} />
        ))}
        {[0, 2, 4, 6].map((i) => (
          <rect key={`b${i}`} y={(i + 7) * 2.155 + 2.155} width="28" height="2.155" fill="#d22f3c" />
        ))}
        <rect width="13" height="15" fill="#2b3990" />
        {[2.5, 6.5, 10.5].flatMap((x) =>
          [3, 7.5, 12].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="#ffffff" />),
        )}
      </g>
    </svg>
  );
}

export function FlagEU() {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 14 + Math.cos(a) * 7.5, y: 14 + Math.sin(a) * 7.5 };
  });
  return (
    <svg viewBox="0 0 28 28" className="size-7 rounded-full shadow-sm" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#1f3a9e" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x.toFixed(2)} cy={s.y.toFixed(2)} r="1.05" fill="#ffd43b" />
      ))}
    </svg>
  );
}

export function FlagCN() {
  return (
    <svg viewBox="0 0 28 28" className="size-7 rounded-full shadow-sm" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#de2910" />
      <polygon
        points="9,5.5 10.3,9.3 14.3,9.3 11.1,11.7 12.3,15.5 9,13.2 5.7,15.5 6.9,11.7 3.7,9.3 7.7,9.3"
        fill="#ffde00"
      />
      <circle cx="16" cy="6" r="1" fill="#ffde00" />
      <circle cx="18.5" cy="9" r="1" fill="#ffde00" />
      <circle cx="18.5" cy="13" r="1" fill="#ffde00" />
      <circle cx="16" cy="16" r="1" fill="#ffde00" />
    </svg>
  );
}

export function LatAmIcon() {
  return (
    <span className="flex size-7 items-center justify-center text-pub-primary">
      <ChartColumn className="size-5" strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}
