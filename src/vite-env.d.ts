/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPSTORE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
