/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend API (es. https://api.example.com) */
  readonly VITE_API_BASE_URL: string;
  /** PostHog project API key */
  readonly VITE_POSTHOG_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
