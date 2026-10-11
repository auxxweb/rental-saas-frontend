/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Base URL for the Express API (include `/api` path), e.g. `http://localhost:5000/api` */
  readonly VITE_API_URL?: string
  readonly VITE_DEV_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
