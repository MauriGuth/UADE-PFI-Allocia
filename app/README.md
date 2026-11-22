# Allocia — Prototipo PFI de Análisis de Portafolio Multiactivo

Prototipo del Proyecto Final de Ingeniería (UADE, 2026): análisis de portafolios
multiactivo con riesgo geopolítico y recomendaciones explicables mediante IA.
Autores: Rosso, Máximo · Huentelaf, Mauricio.

## Estructura

- `apps/api` — Backend NestJS + TypeORM + PostgreSQL + Redis (cache de señales).
  Módulos: catálogo de clasificación, portafolio (CRUD), análisis estructural
  (composición, HHI, exposiciones), señales externas (contexto geopolítico y
  señales emergentes, con proveedores en vivo y fallback a snapshot local) y
  motor de observaciones explicables con trazabilidad de evidencia.
- `apps/mobile` — Aplicación móvil React Native + Expo (SDK 57). Pantallas:
  Dashboard (métricas, composición, exposiciones, escenarios, señales,
  observaciones explicables) y Portafolio (carga/edición con clasificación
  automática). Se gestiona con npm (fuera del workspace de pnpm).
- `apps/web` — **Allocia Web**: versión web completa del producto (Next.js 15 + Tailwind),
  con la misma identidad visual, autenticación y datos que la app móvil. Ver
  [`docs/WEB_PARITY.md`](docs/WEB_PARITY.md) (arquitectura, matriz de paridad y límites).
- `capturas/` — Capturas del avance del 50 %, wireframes de referencia y capturas de Allocia Web (`allocia-web/`).

## Desarrollo local

Requisitos: Node 20+, pnpm, PostgreSQL (base `pfi_demo`), Redis opcional.

```bash
pnpm install                      # instala api + web
createdb pfi_demo                 # una única vez
cd apps/api && npx ts-node src/seed.ts   # catálogo + portafolio demo
pnpm --filter api dev             # API en http://localhost:4000
cp apps/web/.env.example apps/web/.env.local   # API_URL del backend
pnpm --filter web dev             # Allocia Web en http://localhost:3000
cd apps/mobile && npm install && npx expo start --ios   # app móvil
```

## Despliegue

- **Backend + base de datos (Railway):** crear un servicio desde `apps/api`
  con un Postgres y (opcional) un Redis adjuntos. Railway inyecta `PORT`,
  `DATABASE_URL` y `REDIS_URL`; el código ya los toma automáticamente.
  Comando de build: `npm run build` · comando de inicio: `npm run start`.
  Ejecutar el seed una única vez: `npx ts-node src/seed.ts`.
- **App móvil (EAS Build):** definir `EXPO_PUBLIC_API_URL` con la URL pública
  del backend en Railway (por ejemplo en `eas.json` o en las variables del
  proyecto) y compilar con `eas build`. Con eso la app instalada en un
  teléfono funciona sin el backend local.

- **Web (Vercel / Railway / cualquier host Node):** directorio `apps/web`, build
  `pnpm build`, inicio `pnpm start`. Variable de entorno obligatoria **`API_URL`**
  (URL pública del backend, p. ej. la de Railway). Se lee solo en el servidor de
  Next; el navegador nunca ve el backend ni el JWT (cookie `httpOnly`).
  Verificaciones: `pnpm --filter web typecheck | lint | test | build` y
  `pnpm --filter web test:e2e` (requiere API + cuenta demo sembrada).

## Nota

Prototipo académico. La información presentada por el sistema no constituye
asesoramiento financiero.
