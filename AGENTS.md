# AGENTS.md

SIGICE: Angular 20 standalone SPA (student survey, trainings, admin panel) for Universidad del Pacífico. The app lives at the repo root (`src/`). UI copy, docs, and identifiers are Spanish — keep new user-facing text and naming in Spanish.

## Commands

- `npm ci` then `npm start` — `ng serve` on `0.0.0.0:4200` (development config, proxy from `proxy.conf.js`).
- `npm run build` — production build to `dist/app/browser`; it also enforces the initial-bundle budget (2 MB warning / 5 MB error). There are no tests, spec files, lint, typecheck, or e2e setup, so this is the only verification.
- Docker: multi-stage `Dockerfile`, Node 22 build then nginx serving `dist/app/browser`; `nginx.conf` proxies `/api` and `/uploads` to the Railway backend (no compose file here).
- Node >= 20 required (`package.json` engines).

## API and auth

- API base is chosen at runtime in `src/environments/environment.ts`: only `localhost:4200` uses `http://localhost:3000/api`; any other host/port uses the Railway production URL. There is no `environment.prod.ts` / file replacement. The app calls absolute URLs, so `proxy.conf.js` and the nginx proxies do not affect API calls today. Opening the app from another port or the LAN IP silently switches to production data.
- Token is kept in `sessionStorage` under `token` (memory fallback), never in `localStorage`; the legacy copy is deleted at startup. The only `localStorage` use is notification read-state (`NotificacionesService`, keyed by user id).
- `jwt.interceptor.ts` attaches `Bearer` only to URLs containing `/api/`, logs out on 401, and shows a snackbar on 403.
- Login is client-side encrypted: GET `/auth/login-crypto`, then RSA-OAEP + AES-GCM via WebCrypto (`core/login-crypto.ts`). It needs a secure context — use `localhost`, not a LAN IP over HTTP.
- Images under `/api/uploads` require JWT. Use `<img [appAuthImage]="url">` (or `ImagenesService`), never a plain `src`, or the request will 401.
- `authGuard` protects the student layout; `/admin/*` also uses `roleGuard` with `data: { rol: 'ADMIN' }`. Both await the deduped `AuthService.cargarPerfil()` because guards run in parallel on refresh.

## Structure

- All components are standalone and single-file (`template` + `styles` inline), lazy-loaded with `loadComponent` in `app.routes.ts`; templates use `@if`/`@for` (no `*ngIf`/`*ngFor`).
- `src/app/core/` — auth, guards, token storage, interceptor, chart theme, image service.
- `src/app/shared/ui/` — `app-page-header`, `app-metric-card`, `app-status-chip`, `app-empty-state`, confirm dialog. Use `UiService.confirmar/exito/error/info`; never `alert`/`confirm`.
- `src/app/layout/` — global header, footer, mobile bottom nav, rendered by `AppComponent` around every route (including auth screens); feature layouts add their own shell inside.
- `src/app/features/{auth,encuesta,capacitaciones,estudiante,admin}/` — screens.

## Styling

- `src/styles.scss` is the only global entry: tokens → Material 3 theme → base. Component styles must use `var(--...)` tokens, never hardcoded colors. Exceptions are the chart palette in `core/charts.config.ts` and datepicker/overlay overrides in `_theme-material.scss`.
- `docs/guia-de-estilo.md` is the authoritative visual spec (60/30/10 white/blue/green, contrast rules, component patterns, breakpoints) — read it before UI work.
- Icons are Material Symbols Outlined; font is Inter; both loaded in `index.html`.

## Gotchas

- Services use Angular signals and `HttpClient.toPromise()`; follow the existing style instead of mass-migrating.
- Production builds are already covered by `.gitignore` (`node_modules/`, `dist/`, `.angular/`); do not commit build output.

<!-- BEGIN agent-context -->
## Contexto de arquitectura y registro

- Lee `AGENTS.md` completo antes de trabajar.
- Carga las skills aplicables de la sección 16 de `ARCHITECTURE_CONTEXT.md` (si están disponibles en tu entorno) y lee ese documento completo, contrastándolo con el código de las zonas que vayas a tocar.
- Sigue la misma arquitectura, capas, convenciones y patrones; no introduzcas estructuras, librerías ni estilos nuevos sin justificación y aprobación.
- Registra cada tarea en `AGENT_CHANGELOG.md` y actualiza `ARCHITECTURE_CONTEXT.md` si cambió algo que describe.
<!-- END agent-context -->
