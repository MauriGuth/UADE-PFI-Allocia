import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { themeVars } from "./lib/theme-tokens";

// Los colores son variables CSS (`--c-*` en la app, `--pc-*` en las páginas públicas) que emite el plugin de abajo para el
// tema claro (los valores de siempre, de lib/tokens.ts) y el oscuro (lib/theme-tokens.ts). Las clases no cambian
// (bg-card, text-ink, bg-pub-ink…) y admiten opacidad (bg-card/90) porque la variable guarda «R G B».
const app = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;
const pub = (name: string) => `rgb(var(--pc-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // El tema lo fija `data-theme` en <html> (ver components/shell/theme-script.ts).
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: app("bg"),
        canvas: app("canvas"),
        card: app("card"),
        low: app("low"),
        container: app("container"),
        high: app("high"),
        ink: app("ink"),
        soft: app("soft"),
        muted: app("muted"),
        faint: app("faint"),
        line: app("line"),
        outline: app("outline"),
        primary: { DEFAULT: app("primary"), container: app("primary-container") },
        // Texto sobre rellenos: blanco en claro; en oscuro, texto oscuro sobre el relleno aclarado.
        "on-primary": app("on-primary"),
        "on-secondary": app("on-secondary"),
        "on-danger": app("on-danger"),
        secondary: {
          DEFAULT: app("secondary"),
          fixed: app("secondary-fixed"),
          "on-fixed": app("on-secondary-fixed"),
        },
        danger: { DEFAULT: app("danger"), bg: app("danger-bg") },
        warn: { DEFAULT: app("warn"), bg: app("warn-bg"), accent: app("warn-accent") },
        ok: { DEFAULT: app("ok"), bg: app("ok-bg") },
        brand: { DEFAULT: app("brand"), dark: app("brand-dark") },
        // Pantallas públicas rediseñadas (landing, login, registro): ver lib/pub/tokens.ts.
        pub: {
          background: pub("background"),
          foreground: pub("foreground"),
          card: pub("card"),
          popover: pub("popover"),
          primary: pub("primary"),
          secondary: pub("secondary"),
          muted: pub("muted"),
          "muted-foreground": pub("muted-foreground"),
          subtle: pub("subtle"),
          accent: pub("accent"),
          destructive: pub("destructive"),
          border: pub("border"),
          input: pub("input"),
          ring: pub("ring"),
          ink: pub("ink"),
          "ink-foreground": pub("ink-foreground"),
          success: pub("success"),
          "success-soft": pub("success-soft"),
          warning: pub("warning"),
          "warning-soft": pub("warning-soft"),
          danger: pub("danger"),
          "danger-soft": pub("danger-soft"),
          teal: pub("teal"),
          "teal-soft": pub("teal-soft"),
          lilac: pub("lilac"),
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        heading: ['"Plus Jakarta Sans"', "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        // Escala: tarjetas 16, controles 10–12, piezas internas 10.
        card: "16px",
        field: "10px",
        btn: "12px",
        // Escala de radios del rediseño público (base 0.75rem).
        "pub-sm": "0.45rem",
        "pub-md": "0.6rem",
        "pub-lg": "0.75rem",
        "pub-xl": "1.05rem",
        "pub-2xl": "1.35rem",
      },
      fontSize: {
        eyebrow: ["11px", { lineHeight: "1.2", letterSpacing: "0.08em" }],
        // Escala de texto pequeño con nombre (reemplaza los text-[10px]/[11.5px]/[12.5px]… sueltos).
        micro: ["11px", { lineHeight: "16px" }],
        caption: ["12px", { lineHeight: "17px" }],
        "body-sm": ["13px", { lineHeight: "19px" }],
      },
      boxShadow: {
        // Sombra ambiente suave del sistema de diseño (DESIGN.md → Elevation).
        // Tarjetas: borde fino + una sombra casi imperceptible (sin «flotar»).
        card: "0 1px 2px rgb(9 20 38 / 0.035)",
        lift: "0 2px 4px rgb(9 20 38 / 0.04), 0 12px 24px -8px rgb(9 20 38 / 0.12)",
        btn: "0 1px 2px rgb(9 20 38 / 0.18), 0 4px 10px -4px rgb(9 20 38 / 0.28)",
        pop: "0 10px 30px -6px rgb(9 20 38 / 0.18), 0 4px 10px -4px rgb(9 20 38 / 0.10)",
      },
      transitionTimingFunction: {
        // Curva de desaceleración suave para movimiento e interacciones.
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        "pop-in": { from: { opacity: "0", transform: "scale(0.97)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        // Entrada solo con transform (sin opacidad parcial): así el contraste medido nunca depende del instante de captura.
        rise: { from: { transform: "translateY(16px)" }, to: { transform: "translateY(0)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "pulse-dot": {
          "0%": { boxShadow: "0 0 0 0 rgb(91 62 230 / 0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgb(91 62 230 / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(91 62 230 / 0)" },
        },
        draw: { from: { strokeDashoffset: "1" }, to: { strokeDashoffset: "0" } },
        "pub-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pub-pop": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "none" } },
        "pub-spin-in": { from: { opacity: "0", transform: "rotate(-12deg) scale(0.9)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out backwards",
        "pop-in": "pop-in 150ms ease-out both",
        rise: "rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2.4s ease-out infinite",
        draw: "draw 1.8s cubic-bezier(0.65, 0, 0.35, 1) both",
        "pub-fade": "pub-fade 700ms ease-out both",
        "pub-pop": "pub-pop 150ms ease-out both",
        "pub-spin-in": "pub-spin-in 700ms ease-out both",
      },
    },
  },
  plugins: [
    // Variables de color de los dos temas. El oscuro va dentro de @media screen: al imprimir (informe a PDF) siempre sale en claro.
    plugin(({ addBase }) => {
      addBase({
        ":root": { ...themeVars(0), "color-scheme": "light" },
        "@media screen": {
          '[data-theme="dark"]': { ...themeVars(1), "color-scheme": "dark" },
          "@media (prefers-color-scheme: dark)": { ":root:not([data-theme])": { ...themeVars(1), "color-scheme": "dark" } },
        },
      });
    }),
  ],
};

export default config;
