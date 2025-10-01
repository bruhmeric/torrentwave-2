// The reference to "vite/client" was causing a build error, so it has been removed.
// Manually defining the types for import.meta.env to resolve related type errors.

interface ImportMetaEnv {
  readonly VITE_JACKETT_URL?: string;
  readonly VITE_JACKETT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
