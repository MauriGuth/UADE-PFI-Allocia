# Rediseño de las pantallas públicas (landing, login, registro)

Migración **solo visual** del export de v0 a `apps/web`. El proyecto v0 se usó como fuente de componentes, no como
aplicación: no se copió su `package.json`, layout, configuración ni su capa de auth de demostración.

## Mapa de compatibilidad

| v0 (Next 16, Tailwind 4, `@base-ui`, shadcn) | ALLOCIA (`apps/web`: Next 15.5, Tailwind 3.4) | Resolución |
| --- | --- | --- |
| `components/allocia/*` | `components/pub/*` | Portados; clases convertidas a Tailwind 3 y tokens bajo prefijo `pub-` |
| tokens `--primary`, `--card`, `--ink`… (globals.css v4) | `lib/pub/tokens.ts` + `tailwind.config.ts` (`colors.pub`) | Aislados: no pisan la paleta de la app privada |
| `rounded-lg/xl/2xl` (escala 0.75rem de v0) | `rounded-pub-*` | Radios propios del rediseño |
| `tw-animate-css` (`animate-in`…) | keyframes `pub-fade/pop/spin-in` | Sin dependencia nueva |
| `next/font/google` (Plus Jakarta Sans) | `@fontsource/plus-jakarta-sans` (solo 600/700/800) | Self-hosted: compatible con el CSP `font-src 'self'` |
| `lucide-react` | `lucide-react@1.17.0` | Única dependencia de íconos nueva |
| `components/ui/button` (`@base-ui`), `GeopoliticalGlobe`, `@vercel/analytics`, `shadcn` | — | No se usan en las 3 pantallas: no se portaron |
| `lib/auth/auth-service.ts` + `validation.ts` (simulados) | **no portados** | Se usa `api.login` / `api.register` reales |
| imágenes `public/images/*` | `public/brand/redesign/*` | Bajo `/brand/` para quedar fuera del middleware (mantenimiento/CSP) |

Los fondos de login/registro se entregan como WebP (172 KB / 98 KB, RMSE ≈ 2,5/255 frente a los PNG de 1,9 MB).

## Archivos de la app que cambiaron

- `app/(public)/page.tsx`, `login/page.tsx`, `register/page.tsx`: composición visual.
- `components/auth/AuthForm.tsx`: **misma lógica** (estado, `canSubmit`, `api.login/register`, `safeNext`, `?expired`, `hydrated`),
  JSX nuevo.
- `tailwind.config.ts`, `app/globals.css`: solo adiciones (tokens `pub`, keyframes nuevos, reglas bajo `.pub`).
- `package.json`/`pnpm-lock.yaml`: `lucide-react`, `@fontsource/plus-jakarta-sans`.
- Nuevos: `components/pub/**`, `lib/pub/**`, `public/brand/redesign/**`, `e2e/public-redesign.spec.ts`.

`components/auth/AuthShell.tsx` quedó sin uso (el login/registro usan `components/pub/auth/auth-layout.tsx`); se conserva.

## Inventario de controles y su destino

| Pantalla | Control | Comportamiento (sin cambios) |
| --- | --- | --- |
| Landing | Iniciar sesión / Ya tengo cuenta | `Link` → `/login` |
| Landing | Empezar / Crear cuenta | `Link` → `/register` |
| Landing | Ver cómo funciona / Ver señales / Ver ejemplo / Ver todas | Anclas internas (`#demo`, `#senales`) |
| Landing | Rango (1M…1A), selector de período, navegación y donut del dashboard | Interacción de demostración (datos ficticios rotulados) |
| Login | Email, contraseña, mostrar/ocultar | Mismos `autoComplete`, `maxLength`, `aria-pressed` y nombres accesibles |
| Login | Iniciar sesión | `api.login(email.trim(), password)` → `router.replace(safeNext(next))` + `refresh()`; deshabilitado hasta completar |
| Login | Olvidé mi contraseña | `Link` → `/forgot-password` (flujo real) |
| Login | Registrate / Volver | `Link` → `/register` / `/` |
| Login | Aviso `?expired=1`, error del backend (`p[role=alert]`), estado "Un momento…" | Conservados |
| Registro | Nombre, email, contraseña (≥ 12), política de privacidad (obligatoria, `/privacy`) | Misma validación y mismo contrato: `api.register(name, email, password, privacyAccepted)` |
| Registro | Crear cuenta / Iniciá sesión / Volver | Igual que antes |

## Diferencias deliberadas respecto de v0 (a revisar con el equipo)

- **No se agregó** "Confirmar contraseña" ni "Recordarme en este dispositivo": no existen en el flujo real (la sesión la fija
  el servidor) y agregarlos cambiaría comportamiento. Los campos reales (política de privacidad, mínimo de 12) se conservaron.
- Ruta de registro: `/register` (no `/registro`). Se conserva "Volver" en el registro además del logo-enlace.
- Tonos de texto `subtle`, `success`, `warning`, `danger` oscurecidos para cumplir contraste AA (lo verifica `e2e/extra-checks`).
- Las entradas animadas usan solo `transform` (sin opacidad parcial) para que la medición de contraste no sea intermitente.
- Tarjetas de región de la landing reposicionadas entre 1280 y 1580 px (v0 las recortaba o las tapaba el dashboard).
- Las pantallas `forgot-password`, `reset-password`, `verify-email` y `privacy` no se tocaron y conservan su estilo anterior.
