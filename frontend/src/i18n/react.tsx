import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLanguage, setLanguage, subscribeLanguage, t, type Language } from "./core";
export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => "pt-BR" as Language);
}
export function LanguageSelector() {
  const language = useLanguage();
  const queryClient = useQueryClient();
  return (
    <label className="language-selector">
      <span>{t("Idioma")}</span>
      <select
        aria-label={t("Idioma")}
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value as Language);
          void queryClient.invalidateQueries();
        }}
      >
        <option value="pt-BR">Português</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
export function LanguageDocument() {
  const language = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    document.title = "TaskFlow";
  }, [language]);
  return null;
}
