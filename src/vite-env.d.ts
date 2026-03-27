/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_SEARCH_API_KEY: string
  readonly VITE_GOOGLE_SEARCH_CX: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_STABILITY_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
