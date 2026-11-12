import { english } from "./catalog.ts";
export type Language = "pt-BR" | "en";
const listeners = new Set<() => void>();
let volatileLanguage: Language = "pt-BR";
export function getLanguage(): Language {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return volatileLanguage;
    const value = storage.getItem("taskflow.language");
    return value === "en" ? "en" : "pt-BR";
  } catch {
    return volatileLanguage;
  }
}
export function getLocale() {
  return getLanguage() === "en" ? "en-US" : "pt-BR";
}
export function setLanguage(value: Language) {
  volatileLanguage = value;
  try {
    globalThis.localStorage?.setItem("taskflow.language", value);
  } catch {
    /* Keep the current session usable when storage is unavailable. */
  }
  listeners.forEach((listener) => listener());
}
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  const external = (event: StorageEvent) => {
    if (event.key === "taskflow.language" || event.key === null) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", external);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", external);
  };
}
export function t(text: string, values: Record<string, string | number> = {}) {
  let result = getLanguage() === "en" ? (english[text] ?? text) : text;
  for (const [key, value] of Object.entries(values))
    result = result.split("{" + key + "}").join(String(value));
  return result;
}
export function localizeError(text: string) {
  if (english[text]) return t(text);
  if (text === "Network Error" || text.includes("timeout"))
    return t("Confira a conexão e se a API está disponível.");
  return getLanguage() === "en"
    ? "Unable to complete the request. Check the information and try again."
    : text;
}
