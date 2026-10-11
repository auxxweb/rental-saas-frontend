# Rental SaaS — Vite + React shell

This folder is the **incremental migration** target from `frontend/` (Next.js). The existing Next app is unchanged.

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview  # serve production build locally
```

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` if needed. Defaults match the Next app (`http://localhost:5000/api`).

Optional dev proxy: set `VITE_API_URL=/api` so requests go through Vite’s `/api` proxy to the Express backend.

## Production hosting

Configure the host to **serve `index.html` for unknown paths** (SPA fallback) so React Router deep links work.

**HTTPS is required** for PWA install and service workers (except `localhost`).

## PWA (Progressive Web App)

The build includes a **web app manifest**, **service worker** (Workbox), and **offline precaching** for static assets. Google Fonts are cached at runtime. **API calls are not cached** by the service worker (network-only behavior for `/api` navigation fallback denylist).

- After `npm run build`, `dist/` contains `manifest.webmanifest`, `sw.js`, and Workbox helpers.
- **Install**: users can “Install app” from supported browsers when the site is served over HTTPS.
- **Icons**: `public/pwa-192x192.png` and `public/pwa-512x512.png` (regenerate with `npm run generate-pwa-icons` after changing brand color in `scripts/generate-pwa-icons.mjs`).
- **Dev**: PWA plugin dev mode is off by default (`vite.config.ts` → `devOptions.enabled`). Set to `true` to debug install/SW locally.

## Layout & routes

- `src/layouts/RootLayout.tsx` — global providers (same order as `app/layout.tsx`).
- `src/app-routes/tenant/layout.tsx` — auth + redirects for `/tenant/*` (uses `<Outlet />`).
- `src/routes.tsx` — full React Router table; page modules live under `src/app-routes/**/page.tsx` (copied from the Next `app/` tree, migrated off `next/*`).

One-time migration script used to transform Next imports: `node scripts/migrate-app-routes.cjs` (already applied; re-run only if you re-copy from Next).
