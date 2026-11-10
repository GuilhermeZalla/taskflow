declare module '*.env' {
  const values: Record<string, string>;
  export default values;
}
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}