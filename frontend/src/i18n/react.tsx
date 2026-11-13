import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLanguage, setLanguage, subscribeLanguage, t, type Language } from "./core";
import { api } from "@/services/api";
import { isDemo } from "@/services/demo";
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
          const nextLanguage = e.target.value as Language;
          setLanguage(nextLanguage);
          void queryClient.invalidateQueries();
          if (localStorage.getItem("accessToken") && !isDemo()) {
            void api.put("/api/auth/language", { language: nextLanguage }).catch(() => undefined);
          }
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
