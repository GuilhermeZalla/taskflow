import { LanguageSelector } from "@/i18n/react";
import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isDemo } from "@/services/demo";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
const labels: Record<string, string> = {
  tasks: "Tarefas",
  projects: "Projetos",
  workspaces: "Espaços de trabalho",
  teams: "Equipes",
  calendar: "Calendário",
  activity: "Atividade",
  reports: "Relatórios",
  settings: "Preferências",
};
export function Header() {
  useLanguage();
  const location = useLocation(),
    navigate = useNavigate(),
    cache = useQueryClient();
  const [search, setSearch] = useState("");
  const label = labels[location.pathname.split("/")[1] || ""] || translate("Visão geral");
  return (
    <header className="topbar">
      <span className="breadcrumbs">
        <Link to="/">{translate("Área de trabalho")}</Link>
        <span className="crumb">/</span>
        <strong>{translate(label || "")}</strong>
      </span>
      <form
        className="header-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(
            "/tasks" + (search.trim() ? "?search=" + encodeURIComponent(search.trim()) : ""),
          );
          setSearch("");
        }}
      >
        <label className="sr-only" htmlFor="header-search">
          {translate("Buscar tarefas")}{" "}
        </label>
        <input
          id="header-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={translate("Buscar tarefas…")}
        />
        <button className="quiet">{translate("Buscar")}</button>
      </form>
      <div className="topbar-actions">
        <NotificationCenter />
        <LanguageSelector />
        {isDemo() && (
          <span className="demo-label">{translate("Demonstração · dados fictícios")}</span>
        )}
        <Link
          className="account-link"
          to="/settings"
          aria-label={translate("Preferências da conta")}
        >
          {isDemo() ? "D" : "C"}
        </Link>
        <button
          className="quiet"
          onClick={() => {
            sessionStorage.removeItem("taskflow.preview");
            localStorage.removeItem("accessToken");
            cache.clear();
            navigate("/login");
          }}
        >
          {translate("Sair")}{" "}
        </button>
      </div>
    </header>
  );
}
