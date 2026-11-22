import { LogoWhite } from "../logo";

export function AuthShowcase({
  title,
  highlight,
  description,
  features,
  children,
  backgroundImage,
}: {
  backgroundImage: string;
  title: React.ReactNode;
  highlight: React.ReactNode;
  description: string;
  /** Tres afirmaciones breves, cada una completa en una línea (se leen como frases, no como título y subtítulo). */
  features: string[];
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label="Allocia"
      className="relative isolate hidden h-dvh flex-col overflow-hidden bg-[#0a1022] bg-cover bg-center bg-no-repeat lg:flex"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,10,34,0.38)_0%,rgba(7,10,34,0.24)_30%,transparent_52%,rgb(var(--showcase-fade)/0.3)_78%,rgb(var(--showcase-fade)/0.96)_100%)]"
      />

      <header className="relative z-10 px-10 pt-[clamp(28px,5.5vh,56px)] xl:px-14">
        <LogoWhite className="h-[clamp(34px,4.4vh,46px)] animate-rise" priority />
        <p
          className="mt-[clamp(22px,6vh,64px)] animate-rise font-heading text-[clamp(32px,3.2vw,50px)] leading-[1.06] font-extrabold tracking-[-0.035em] text-[#f5f6fc]"
          style={{ animationDelay: "80ms" }}
        >
          {title}{" "}
          <span className="bg-[linear-gradient(90deg,#cfc6ff,#a596ff)] bg-clip-text text-transparent [box-decoration-break:clone]">
            {highlight}
          </span>
        </p>
        <p
          className="mt-[clamp(10px,2vh,20px)] max-w-[33em] animate-rise text-[clamp(14px,1.12vw,17px)] leading-relaxed text-pretty text-[#f5f6fc]/85"
          style={{ animationDelay: "160ms" }}
        >
          {description}
        </p>
      </header>

      <div className="relative flex min-h-0 flex-1 pt-[clamp(14px,3.5vh,40px)] pb-[clamp(10px,2vh,20px)] pl-10 xl:pl-14">
        {children}
      </div>

      <div className="relative z-10 px-10 pb-[clamp(18px,4vh,36px)] xl:px-14">
        {/* Tres afirmaciones independientes: una regla arriba y divisores entre ellas las separan sin íconos ni sombras. */}
        <ul className="grid max-w-[640px] grid-cols-3 border-t border-pub-ink/20">
          {features.map((text, i) => (
            <li
              key={text}
              className={`pt-3 text-[12.5px] leading-snug font-semibold text-pub-ink text-balance xl:text-[14px] ${
                i > 0 ? "border-l border-pub-ink/15 pl-4 xl:pl-5" : ""
              } ${i < features.length - 1 ? "pr-4 xl:pr-5" : ""}`}
            >
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
